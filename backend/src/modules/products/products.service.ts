import { StockMovementType, BarcodeType as PrismaBarcodeType } from '@prisma/client';
import { prisma } from '../../config/database';
import { StockService } from '../stock/stock.service';
import {
  buildProductQrToken,
  parseProductScanCode,
  normalizeBarcode,
  sanitizeScanInput,
  generateInternalBarcode,
  resolveBarcodeType,
  allowsInternalBarcode,
  BarcodeType,
  type BarcodeLookupResult,
  type Product,
} from '@magazin/shared';
import type { ProductInput, ProductQuery } from './products.schema';
import type { PaginatedResponse } from '@magazin/shared';

export class ProductError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = 'ProductError';
  }
}

function toNum(val: { toNumber?: () => number } | number | null | undefined): number {
  if (val == null) return 0;
  if (typeof val === 'number') return val;
  return val.toNumber?.() ?? Number(val);
}

function parseDate(val?: string | null): Date | null {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Товарлар бизнес-логикасы — заводдук штрихкод негизги
 */
export class ProductsService {
  static async findAll(query: ProductQuery): Promise<PaginatedResponse<Product>> {
    const { page, limit, search, categoryId, lowStock, includeInactive } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (!includeInactive) where.isActive = true;
    if (categoryId) where.categoryId = categoryId;
    if (search) {
      where.OR = [
        { nameKy: { contains: search, mode: 'insensitive' } },
        { nameRu: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search } },
        { qrCode: { contains: search } },
        { brand: { contains: search, mode: 'insensitive' } },
        { supplier: { contains: search, mode: 'insensitive' } },
        { shelfLocation: { contains: search, mode: 'insensitive' } },
      ];
    }

    let products = await prisma.product.findMany({
      where,
      orderBy: { nameKy: 'asc' },
      include: { category: { select: { id: true, nameKy: true, nameRu: true } } },
    });

    if (lowStock) {
      products = products.filter((p) => toNum(p.stock) <= toNum(p.minStock));
    }

    const total = products.length;
    const paginated = products.slice(skip, skip + limit);

    return {
      items: paginated.map(this.toProduct),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async findById(id: string): Promise<Product> {
    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: { select: { id: true, nameKy: true, nameRu: true } } },
    });
    if (!product) throw new ProductError('Товар табылган жок', 404);
    return this.toProduct(product);
  }

  /**
   * Штрихкод боюнча издөө (товар кошуу агымы).
   * Табылса — exists:true, жок болсо — exists:false (жаңы товар үчүн).
   */
  static async lookupByBarcode(rawCode: string): Promise<BarcodeLookupResult> {
    const barcode = sanitizeScanInput(rawCode);
    if (!barcode) {
      throw new ProductError('Штрихкод бош болбошу керек', 400);
    }

    const product = await prisma.product.findFirst({
      where: { barcode },
      include: { category: { select: { id: true, nameKy: true, nameRu: true } } },
    });

    return {
      exists: !!product,
      barcode,
      product: product ? this.toProduct(product) : null,
    };
  }

  /**
   * Сатуу/сканер — алгач так barcode, андан соң QR/URL.
   */
  static async findByCode(code: string): Promise<Product> {
    const cleaned = sanitizeScanInput(code);
    const parsed = parseProductScanCode(cleaned);

    // 1) Так заводдук/ички штрихкод (негизги канал)
    if (parsed.type === 'barcode') {
      const byBarcode = await prisma.product.findFirst({
        where: { barcode: parsed.value, isActive: true },
        include: { category: { select: { id: true, nameKy: true, nameRu: true } } },
      });
      if (byBarcode) return this.toProduct(byBarcode);
    }

    // 2) QR / продукт ID
    const where =
      parsed.type === 'id'
        ? { id: parsed.value, isActive: true }
        : { qrCode: parsed.value, isActive: true };

    const product = await prisma.product.findFirst({
      where,
      include: { category: { select: { id: true, nameKy: true, nameRu: true } } },
    });
    if (!product) throw new ProductError('Товар табылган жок', 404);
    return this.toProduct(product);
  }

  static async create(input: ProductInput, userId?: string): Promise<Product> {
    await this.ensureCategoryExists(input.categoryId);

    const resolved = await this.resolveBarcodeForSave(input);
    await this.ensureUniqueCodes(resolved.barcode, input.qrCode);

    const initialStock = input.stock ?? 0;

    const product = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          nameKy: input.nameKy.trim(),
          nameRu: input.nameRu.trim(),
          barcode: resolved.barcode,
          barcodeType: resolved.barcodeType as PrismaBarcodeType,
          soldByWeight: input.soldByWeight ?? false,
          isSelfPacked: input.isSelfPacked ?? false,
          noFactoryBarcode: input.noFactoryBarcode ?? false,
          qrCode: input.qrCode?.trim() || null,
          brand: input.brand?.trim() || null,
          description: input.description?.trim() || null,
          price: input.price,
          costPrice: input.costPrice,
          stock: 0,
          minStock: input.minStock ?? 10,
          unit: input.unit ?? 'шт',
          supplier: input.supplier?.trim() || null,
          arrivalDate: parseDate(input.arrivalDate),
          expiryDate: parseDate(input.expiryDate),
          shelfLocation: input.shelfLocation?.trim() || null,
          categoryId: input.categoryId,
          isActive: input.isActive ?? true,
        },
        include: { category: { select: { id: true, nameKy: true, nameRu: true } } },
      });

      const qrToken = input.qrCode?.trim() || buildProductQrToken(created.id);
      await tx.product.update({ where: { id: created.id }, data: { qrCode: qrToken } });

      if (initialStock > 0 && userId) {
        await StockService.adjustStock({
          productId: created.id,
          delta: initialStock,
          type: StockMovementType.RECEIPT,
          userId,
          reason: 'Баштапкы запас',
          tx,
        });
      } else if (initialStock > 0) {
        await tx.product.update({ where: { id: created.id }, data: { stock: initialStock } });
      }

      return tx.product.findUniqueOrThrow({
        where: { id: created.id },
        include: { category: { select: { id: true, nameKy: true, nameRu: true } } },
      });
    });

    return this.toProduct(product);
  }

  static async update(id: string, input: ProductInput, userId?: string): Promise<Product> {
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) throw new ProductError('Товар табылган жок', 404);

    await this.ensureCategoryExists(input.categoryId);

    const resolved = await this.resolveBarcodeForSave(input, id);
    await this.ensureUniqueCodes(resolved.barcode, input.qrCode, id);

    const oldStock = toNum(existing.stock);
    const newStock = input.stock;
    const stockDelta = newStock - oldStock;

    const product = await prisma.$transaction(async (tx) => {
      const updated = await tx.product.update({
        where: { id },
        data: {
          nameKy: input.nameKy.trim(),
          nameRu: input.nameRu.trim(),
          barcode: resolved.barcode,
          barcodeType: resolved.barcodeType as PrismaBarcodeType,
          soldByWeight: input.soldByWeight ?? false,
          isSelfPacked: input.isSelfPacked ?? false,
          noFactoryBarcode: input.noFactoryBarcode ?? false,
          qrCode: this.ensureQrToken(id, input.qrCode?.trim() || existing.qrCode),
          brand: input.brand?.trim() || null,
          description: input.description?.trim() || null,
          price: input.price,
          costPrice: input.costPrice,
          stock: stockDelta === 0 || userId ? oldStock : newStock,
          minStock: input.minStock ?? 10,
          unit: input.unit ?? 'шт',
          supplier: input.supplier?.trim() || null,
          arrivalDate: parseDate(input.arrivalDate),
          expiryDate: parseDate(input.expiryDate),
          shelfLocation: input.shelfLocation?.trim() || null,
          categoryId: input.categoryId,
          isActive: input.isActive ?? existing.isActive,
        },
        include: { category: { select: { id: true, nameKy: true, nameRu: true } } },
      });

      if (stockDelta !== 0 && userId) {
        await StockService.adjustStock({
          productId: id,
          delta: stockDelta,
          type: StockMovementType.ADJUSTMENT,
          userId,
          reason: 'Товар формасынан түзөтүү',
          tx,
        });
      } else if (stockDelta !== 0) {
        await tx.product.update({ where: { id }, data: { stock: newStock } });
      }

      return stockDelta !== 0 && userId
        ? tx.product.findUniqueOrThrow({
            where: { id },
            include: { category: { select: { id: true, nameKy: true, nameRu: true } } },
          })
        : updated;
    });

    return this.toProduct(product);
  }

  static async updateImage(id: string, imageUrl: string): Promise<Product> {
    const product = await prisma.product.update({
      where: { id },
      data: { imageUrl },
      include: { category: { select: { id: true, nameKy: true, nameRu: true } } },
    });
    return this.toProduct(product);
  }

  static async delete(id: string): Promise<void> {
    const product = await prisma.product.findUnique({
      where: { id },
      include: { _count: { select: { saleItems: true } } },
    });
    if (!product) throw new ProductError('Товар табылган жок', 404);

    if (product._count.saleItems > 0) {
      await prisma.product.update({ where: { id }, data: { isActive: false } });
      return;
    }

    await prisma.product.delete({ where: { id } });
  }

  /** Штрихкодду даярдоо — ички код өзгөчө учурларда гана */
  private static async resolveBarcodeForSave(
    input: ProductInput,
    excludeId?: string
  ): Promise<{ barcode: string | null; barcodeType: BarcodeType }> {
    let barcode = normalizeBarcode(input.barcode) || null;
    const special = allowsInternalBarcode({
      soldByWeight: input.soldByWeight,
      isSelfPacked: input.isSelfPacked,
      noFactoryBarcode: input.noFactoryBarcode,
    });

    const barcodeType = resolveBarcodeType(input);

    if (input.generateInternalBarcode) {
      if (!special) {
        throw new ProductError('Ички штрихкод өзгөчө учурларда гана түзүлөт', 400);
      }
      barcode = await this.createUniqueInternalBarcode(excludeId);
      return { barcode, barcodeType: BarcodeType.INTERNAL };
    }

    // Кадимки товар — заводдук штрихкод; автоматтык ички код ЖОК
    if (!barcode && !special) {
      throw new ProductError('Заводдук штрихкод талап кылынат', 400);
    }

    if (barcode) {
      return {
        barcode,
        barcodeType: barcodeType === BarcodeType.INTERNAL ? BarcodeType.INTERNAL : BarcodeType.FACTORY,
      };
    }

    // Өзгөчө учур, штрихкод жок — null калтырууга уруксат (кийин ички код түзсө болот)
    return { barcode: null, barcodeType: BarcodeType.INTERNAL };
  }

  private static async createUniqueInternalBarcode(excludeId?: string): Promise<string> {
    for (let i = 0; i < 8; i++) {
      const candidate = generateInternalBarcode();
      const existing = await prisma.product.findFirst({
        where: { barcode: candidate, id: excludeId ? { not: excludeId } : undefined },
      });
      if (!existing) return candidate;
    }
    throw new ProductError('Ички штрихкод түзүлбөдү, кайра аракет кылыңыз', 500);
  }

  private static ensureQrToken(productId: string, qrCode?: string | null): string {
    if (qrCode?.trim() && !qrCode.startsWith('QR-')) return qrCode.trim();
    return buildProductQrToken(productId);
  }

  private static async ensureCategoryExists(categoryId: string): Promise<void> {
    const cat = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!cat || !cat.isActive) {
      throw new ProductError('Категория табылган жок же активдүү эмес', 400);
    }
  }

  private static async ensureUniqueCodes(
    barcode?: string | null,
    qrCode?: string | null,
    excludeId?: string
  ): Promise<void> {
    if (barcode?.trim()) {
      const existing = await prisma.product.findFirst({
        where: { barcode: barcode.trim(), id: excludeId ? { not: excludeId } : undefined },
      });
      if (existing) throw new ProductError('Мындай штрихкодду товар мурунтан бар', 409);
    }
    if (qrCode?.trim()) {
      const existing = await prisma.product.findFirst({
        where: { qrCode: qrCode.trim(), id: excludeId ? { not: excludeId } : undefined },
      });
      if (existing) throw new ProductError('Мындай QR кодду товар мурунтан бар', 409);
    }
  }

  private static toProduct(product: {
    id: string;
    barcode: string | null;
    barcodeType?: string;
    soldByWeight?: boolean;
    isSelfPacked?: boolean;
    noFactoryBarcode?: boolean;
    qrCode: string | null;
    nameKy: string;
    nameRu: string;
    brand: string | null;
    description: string | null;
    price: { toNumber?: () => number } | number;
    costPrice: { toNumber?: () => number } | number;
    stock: { toNumber?: () => number } | number;
    minStock: { toNumber?: () => number } | number;
    unit: string;
    supplier: string | null;
    arrivalDate: Date | null;
    expiryDate: Date | null;
    imageUrl: string | null;
    shelfLocation: string | null;
    categoryId: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    category?: { id: string; nameKy: string; nameRu: string };
  }): Product {
    const stock = toNum(product.stock);
    const minStock = toNum(product.minStock);
    return {
      id: product.id,
      barcode: product.barcode,
      barcodeType: (product.barcodeType as Product['barcodeType']) ?? 'FACTORY',
      soldByWeight: product.soldByWeight ?? false,
      isSelfPacked: product.isSelfPacked ?? false,
      noFactoryBarcode: product.noFactoryBarcode ?? false,
      qrCode: product.qrCode,
      nameKy: product.nameKy,
      nameRu: product.nameRu,
      brand: product.brand,
      description: product.description,
      price: toNum(product.price),
      costPrice: toNum(product.costPrice),
      stock,
      minStock,
      unit: product.unit,
      supplier: product.supplier,
      arrivalDate: product.arrivalDate?.toISOString() ?? null,
      expiryDate: product.expiryDate?.toISOString() ?? null,
      imageUrl: product.imageUrl,
      shelfLocation: product.shelfLocation,
      categoryId: product.categoryId,
      category: product.category,
      isActive: product.isActive,
      isLowStock: stock <= minStock,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };
  }
}

import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { toNum } from '../stock/stock.service';
import { buildProductQrUrl, buildProductQrToken, parseProductScanCode } from '@magazin/shared';
import type { ProductScanResult, PublicProductInfo, StaffProductInfo } from '@magazin/shared';
import { Permission, hasPermission } from '@magazin/shared';
import type { UserRole } from '@magazin/shared';

export class PublicError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = 'PublicError';
  }
}

export class PublicService {
  /** ID боюнча товар — кардар/кызматкер режими */
  static async getProductById(id: string, role?: UserRole): Promise<ProductScanResult> {
    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: { select: { nameKy: true, nameRu: true } } },
    });

    if (!product || !product.isActive) {
      throw new PublicError('Товар табылган жок', 404);
    }

    return this.toScanResult(product, role);
  }

  /** Штрихкод/QR/URL боюнча товар */
  static async getProductByCode(code: string, role?: UserRole): Promise<ProductScanResult> {
    const parsed = parseProductScanCode(code);

    if (parsed.type === 'id') {
      return this.getProductById(parsed.value, role);
    }

    const product = await prisma.product.findFirst({
      where: {
        OR: [{ barcode: parsed.value }, { qrCode: parsed.value }],
        isActive: true,
      },
      include: { category: { select: { nameKy: true, nameRu: true } } },
    });

    if (!product) throw new PublicError('Товар табылган жок', 404);
    return this.toScanResult(product, role);
  }

  private static toScanResult(
    product: {
      id: string;
      nameKy: string;
      nameRu: string;
      price: { toNumber?: () => number } | number;
      unit: string;
      brand: string | null;
      description: string | null;
      imageUrl: string | null;
      expiryDate: Date | null;
      barcode: string | null;
      costPrice: { toNumber?: () => number } | number;
      stock: { toNumber?: () => number } | number;
      minStock: { toNumber?: () => number } | number;
      supplier: string | null;
      arrivalDate: Date | null;
      shelfLocation: string | null;
      isActive: boolean;
      category?: { nameKy: string; nameRu: string } | null;
    },
    role?: UserRole
  ): ProductScanResult {
    const stock = toNum(product.stock);
    const minStock = toNum(product.minStock);

    const customer: PublicProductInfo = {
      id: product.id,
      nameKy: product.nameKy,
      nameRu: product.nameRu,
      price: toNum(product.price),
      unit: product.unit,
      brand: product.brand,
      description: product.description,
      imageUrl: product.imageUrl,
      expiryDate: product.expiryDate?.toISOString() ?? null,
      category: product.category ?? null,
      qrUrl: buildProductQrUrl(product.id, env.publicAppUrl),
    };

    const result: ProductScanResult = { customer };

    if (role && hasPermission(role, Permission.PRODUCTS_VIEW)) {
      const staff: StaffProductInfo = {
        barcode: product.barcode,
        costPrice: toNum(product.costPrice),
        stock,
        minStock,
        supplier: product.supplier,
        arrivalDate: product.arrivalDate?.toISOString() ?? null,
        shelfLocation: product.shelfLocation,
        isLowStock: stock <= minStock,
        isActive: product.isActive,
      };
      result.staff = staff;
    }

    return result;
  }
}

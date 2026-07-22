import { StockMovementType, InventoryCountStatus } from '@prisma/client';
import { prisma } from '../../config/database';
import { StockService, StockError, toNum } from '../stock/stock.service';
import type {
  StockMovement,
  StockAlert,
  InventoryCount,
  InventoryCountItem,
  PaginatedResponse,
  ReceiptResult,
  PriceLabelBatch,
} from '@magazin/shared';
import type {
  MovementQuery,
  ReceiptInput,
  WriteOffInput,
  CountQuery,
  CreateCountInput,
  UpdateCountItemsInput,
} from './inventory.schema';

export class InventoryError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = 'InventoryError';
  }
}

export class InventoryService {
  /** Запас кыймылдары тарыхы */
  static async getMovements(query: MovementQuery): Promise<PaginatedResponse<StockMovement>> {
    const { page, limit, productId, type, dateFrom, dateTo } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (productId) where.productId = productId;
    if (type) where.type = type;
    if (dateFrom || dateTo) {
      where.createdAt = {
        ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
        ...(dateTo ? { lte: new Date(dateTo + 'T23:59:59') } : {}),
      };
    }

    const [items, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          product: { select: { id: true, nameKy: true, nameRu: true, unit: true, barcode: true } },
          user: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      prisma.stockMovement.count({ where }),
    ]);

    return {
      items: items.map(this.toMovement),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /** Товар келүү — запас автоматтык кошулат, этикеткалар даярдалат */
  static async receipt(input: ReceiptInput, userId: string): Promise<ReceiptResult> {
    const product = await prisma.product.findUnique({ where: { id: input.productId } });
    if (!product) throw new InventoryError('Товар табылган жок', 404);

    await prisma.$transaction(async (tx) => {
      await StockService.adjustStock({
        productId: input.productId,
        delta: input.quantity,
        type: StockMovementType.RECEIPT,
        userId,
        reason: input.reason ?? 'Товар келди',
        reference: input.reference,
        unitCost: input.unitCost,
        tx,
      });

      const updateData: Record<string, unknown> = { arrivalDate: new Date() };
      if (input.supplier) updateData.supplier = input.supplier.trim();
      if (input.unitCost != null) updateData.costPrice = input.unitCost;

      await tx.product.update({ where: { id: input.productId }, data: updateData });
    });

    const updatedProduct = await prisma.product.findUniqueOrThrow({ where: { id: input.productId } });

    const movement = await prisma.stockMovement.findFirst({
      where: { productId: input.productId, type: StockMovementType.RECEIPT },
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: { id: true, nameKy: true, nameRu: true, unit: true, barcode: true } },
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    const labelBatch = this.buildLabelBatch(updatedProduct, input.quantity, input.printLabels);

    return {
      movement: this.toMovement(movement!),
      labelBatch,
    };
  }

  /** Этикетка партиясын түзүү */
  static buildLabelBatch(
    product: {
      id: string;
      nameKy: string;
      nameRu: string;
      price: { toNumber?: () => number } | number;
      barcode: string | null;
      qrCode: string | null;
      unit: string;
    },
    quantity: number,
    printLabels = true
  ): PriceLabelBatch {
    const count = printLabels ? Math.max(1, Math.round(quantity)) : 0;
    return {
      label: {
        productId: product.id,
        nameKy: product.nameKy,
        nameRu: product.nameRu,
        price: toNum(product.price),
        barcode: product.barcode,
        qrCode: product.qrCode,
        unit: product.unit,
      },
      count,
    };
  }

  /** Товар чыгуу */
  static async writeOff(input: WriteOffInput, userId: string): Promise<StockMovement> {
    await StockService.adjustStock({
      productId: input.productId,
      delta: -input.quantity,
      type: StockMovementType.WRITE_OFF,
      userId,
      reason: input.reason,
      reference: input.reference,
    });

    const movement = await prisma.stockMovement.findFirst({
      where: { productId: input.productId, type: StockMovementType.WRITE_OFF },
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: { id: true, nameKy: true, nameRu: true, unit: true, barcode: true } },
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return this.toMovement(movement!);
  }

  /** Запас эскертүүлөрү */
  static async getAlerts(): Promise<StockAlert[]> {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true, nameKy: true, nameRu: true, stock: true, minStock: true,
        unit: true, expiryDate: true, shelfLocation: true,
      },
      orderBy: { stock: 'asc' },
    });

    const now = new Date();
    const soon = new Date(); soon.setDate(soon.getDate() + 7);
    const alerts: StockAlert[] = [];

    for (const p of products) {
      const stock = toNum(p.stock);
      const minStock = toNum(p.minStock);

      if (stock <= 0) {
        alerts.push({
          id: `${p.id}-out`, productId: p.id, nameKy: p.nameKy, nameRu: p.nameRu,
          stock, minStock, unit: p.unit, alertType: 'OUT_OF_STOCK',
          expiryDate: p.expiryDate?.toISOString() ?? null, shelfLocation: p.shelfLocation,
        });
      } else if (stock <= minStock) {
        alerts.push({
          id: `${p.id}-low`, productId: p.id, nameKy: p.nameKy, nameRu: p.nameRu,
          stock, minStock, unit: p.unit, alertType: 'LOW_STOCK',
          expiryDate: p.expiryDate?.toISOString() ?? null, shelfLocation: p.shelfLocation,
        });
      }

      if (p.expiryDate) {
        if (p.expiryDate < now) {
          alerts.push({
            id: `${p.id}-expired`, productId: p.id, nameKy: p.nameKy, nameRu: p.nameRu,
            stock, minStock, unit: p.unit, alertType: 'EXPIRED',
            expiryDate: p.expiryDate.toISOString(), shelfLocation: p.shelfLocation,
          });
        } else if (p.expiryDate <= soon) {
          alerts.push({
            id: `${p.id}-expiry`, productId: p.id, nameKy: p.nameKy, nameRu: p.nameRu,
            stock, minStock, unit: p.unit, alertType: 'EXPIRY_SOON',
            expiryDate: p.expiryDate.toISOString(), shelfLocation: p.shelfLocation,
          });
        }
      }
    }

    const priority = { OUT_OF_STOCK: 0, LOW_STOCK: 1, EXPIRED: 2, EXPIRY_SOON: 3 };
    return alerts.sort((a, b) => priority[a.alertType] - priority[b.alertType]);
  }

  /** Инвентаризация тизмеси */
  static async getCounts(query: CountQuery): Promise<PaginatedResponse<InventoryCount>> {
    const { page, limit, status } = query;
    const skip = (page - 1) * limit;
    const where = status ? { status: status as InventoryCountStatus } : {};

    const [items, total] = await Promise.all([
      prisma.inventoryCount.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          startedBy: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { items: true } },
          items: { select: { variance: true } },
        },
      }),
      prisma.inventoryCount.count({ where }),
    ]);

    return {
      items: items.map((c) => ({
        id: c.id,
        countNumber: c.countNumber,
        status: c.status as InventoryCount['status'],
        notes: c.notes,
        startedById: c.startedById,
        startedBy: c.startedBy,
        completedAt: c.completedAt?.toISOString() ?? null,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
        itemCount: c._count.items,
        varianceCount: c.items.filter((i) => toNum(i.variance) !== 0).length,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /** Бир инвентаризация */
  static async getCountById(id: string): Promise<InventoryCount> {
    const count = await prisma.inventoryCount.findUnique({
      where: { id },
      include: {
        startedBy: { select: { id: true, firstName: true, lastName: true } },
        items: {
          include: {
            product: { select: { id: true, nameKy: true, nameRu: true, unit: true, barcode: true } },
          },
          orderBy: { product: { nameKy: 'asc' } },
        },
      },
    });
    if (!count) throw new InventoryError('Инвентаризация табылган жок', 404);
    return this.toCount(count, true);
  }

  /** Жаңы инвентаризация баштоо */
  static async createCount(input: CreateCountInput, userId: string): Promise<InventoryCount> {
    const countNumber = await this.generateCountNumber();

    const where: Record<string, unknown> = { isActive: true };
    if (input.categoryId) where.categoryId = input.categoryId;

    const products = await prisma.product.findMany({
      where,
      select: { id: true, stock: true },
      orderBy: { nameKy: 'asc' },
    });

    const count = await prisma.inventoryCount.create({
      data: {
        countNumber,
        status: InventoryCountStatus.IN_PROGRESS,
        notes: input.notes?.trim() || null,
        startedById: userId,
        items: {
          create: products.map((p) => ({
            productId: p.id,
            expectedQty: p.stock,
            countedQty: p.stock,
            variance: 0,
          })),
        },
      },
      include: {
        startedBy: { select: { id: true, firstName: true, lastName: true } },
        items: {
          include: {
            product: { select: { id: true, nameKy: true, nameRu: true, unit: true, barcode: true } },
          },
        },
      },
    });

    return this.toCount(count, true);
  }

  /** Эсептелген саны жаңылоо */
  static async updateCountItems(
    id: string,
    input: UpdateCountItemsInput
  ): Promise<InventoryCount> {
    const count = await prisma.inventoryCount.findUnique({ where: { id } });
    if (!count) throw new InventoryError('Инвентаризация табылган жок', 404);
    if (count.status === InventoryCountStatus.COMPLETED || count.status === InventoryCountStatus.CANCELLED) {
      throw new InventoryError('Аякталган инвентаризацияны өзгөртүүгө болбойт', 400);
    }

    await prisma.$transaction(async (tx) => {
      for (const item of input.items) {
        const existing = await tx.inventoryCountItem.findUnique({
          where: { inventoryCountId_productId: { inventoryCountId: id, productId: item.productId } },
        });
        if (!existing) continue;

        const variance = item.countedQty - toNum(existing.expectedQty);
        await tx.inventoryCountItem.update({
          where: { id: existing.id },
          data: { countedQty: item.countedQty, variance },
        });
      }

      if (count.status === InventoryCountStatus.DRAFT) {
        await tx.inventoryCount.update({
          where: { id },
          data: { status: InventoryCountStatus.IN_PROGRESS },
        });
      }
    });

    return this.getCountById(id);
  }

  /** Инвентаризацияны аяктоо — запас өзгөрөт */
  static async completeCount(id: string, userId: string): Promise<InventoryCount> {
    const count = await prisma.inventoryCount.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!count) throw new InventoryError('Инвентаризация табылган жок', 404);
    if (count.status === InventoryCountStatus.COMPLETED) {
      throw new InventoryError('Инвентаризация мурунтан аяктаган', 400);
    }
    if (count.status === InventoryCountStatus.CANCELLED) {
      throw new InventoryError('Жокко чыгарылган инвентаризацияны аяктоого болбойт', 400);
    }

    const variances = count.items.filter((i) => toNum(i.variance) !== 0);

    await prisma.$transaction(async (tx) => {
      for (const item of variances) {
        const variance = toNum(item.variance);
        await StockService.adjustStock({
          productId: item.productId,
          delta: variance,
          type: StockMovementType.COUNT,
          userId,
          reason: `Инвентаризация ${count.countNumber}`,
          reference: count.countNumber,
          tx,
        });
      }

      await tx.inventoryCount.update({
        where: { id },
        data: { status: InventoryCountStatus.COMPLETED, completedAt: new Date() },
      });
    });

    return this.getCountById(id);
  }

  /** Инвентаризацияны жокко чыгаруу */
  static async cancelCount(id: string): Promise<void> {
    const count = await prisma.inventoryCount.findUnique({ where: { id } });
    if (!count) throw new InventoryError('Инвентаризация табылган жок', 404);
    if (count.status === InventoryCountStatus.COMPLETED) {
      throw new InventoryError('Аякталган инвентаризацияны жокко чыгарууга болбойт', 400);
    }

    await prisma.inventoryCount.update({
      where: { id },
      data: { status: InventoryCountStatus.CANCELLED },
    });
  }

  private static async generateCountNumber(): Promise<string> {
    const today = new Date();
    const prefix = `IC-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`;
    const last = await prisma.inventoryCount.findFirst({
      where: { countNumber: { startsWith: prefix } },
      orderBy: { countNumber: 'desc' },
    });
    const seq = last ? parseInt(last.countNumber.split('-').pop() ?? '0', 10) + 1 : 1;
    return `${prefix}-${String(seq).padStart(4, '0')}`;
  }

  private static toMovement(m: {
    id: string; productId: string; type: StockMovementType;
    quantity: { toNumber?: () => number } | number;
    stockBefore: { toNumber?: () => number } | number;
    stockAfter: { toNumber?: () => number } | number;
    unitCost: { toNumber?: () => number } | number | null;
    reason: string | null; reference: string | null; saleId: string | null;
    userId: string; createdAt: Date;
    product?: { id: string; nameKy: string; nameRu: string; unit: string; barcode: string | null };
    user?: { id: string; firstName: string; lastName: string };
  }): StockMovement {
    return {
      id: m.id,
      productId: m.productId,
      product: m.product ?? undefined,
      type: m.type as StockMovement['type'],
      quantity: toNum(m.quantity),
      stockBefore: toNum(m.stockBefore),
      stockAfter: toNum(m.stockAfter),
      unitCost: m.unitCost != null ? toNum(m.unitCost) : null,
      reason: m.reason,
      reference: m.reference,
      saleId: m.saleId,
      userId: m.userId,
      user: m.user,
      createdAt: m.createdAt.toISOString(),
    };
  }

  private static toCount(
    c: {
      id: string; countNumber: string; status: InventoryCountStatus;
      notes: string | null; startedById: string; completedAt: Date | null;
      createdAt: Date; updatedAt: Date;
      startedBy?: { id: string; firstName: string; lastName: string };
      items?: Array<{
        id: string; inventoryCountId: string; productId: string;
        expectedQty: { toNumber?: () => number } | number;
        countedQty: { toNumber?: () => number } | number;
        variance: { toNumber?: () => number } | number;
        product?: { id: string; nameKy: string; nameRu: string; unit: string; barcode: string | null };
      }>;
    },
    includeItems = false
  ): InventoryCount {
    return {
      id: c.id,
      countNumber: c.countNumber,
      status: c.status as InventoryCount['status'],
      notes: c.notes,
      startedById: c.startedById,
      startedBy: c.startedBy,
      completedAt: c.completedAt?.toISOString() ?? null,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      items: includeItems && c.items
        ? c.items.map((i): InventoryCountItem => ({
            id: i.id,
            inventoryCountId: i.inventoryCountId,
            productId: i.productId,
            product: i.product ?? undefined,
            expectedQty: toNum(i.expectedQty),
            countedQty: toNum(i.countedQty),
            variance: toNum(i.variance),
          }))
        : undefined,
    };
  }
}

export { StockError };

import { StockMovementType, SaleStatus } from '@prisma/client';
import { prisma } from '../../config/database';
import { StockService, StockError, toNum } from '../stock/stock.service';
import type { Sale, PaginatedResponse } from '@magazin/shared';
import type { CreateSaleInput, SaleQuery } from './sales.schema';

export class SaleError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = 'SaleError';
  }
}

export class SalesService {
  /** Сатуу түзүү — запас автоматтык азаят */
  static async create(input: CreateSaleInput, cashierId: string): Promise<Sale> {
    const productIds = input.items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
    });

    if (products.length !== productIds.length) {
      throw new SaleError('Кээ бир товарлар табылган жок же активдүү эмес', 400);
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    let subtotal = 0;
    const itemData: { productId: string; quantity: number; unitPrice: number; discount: number; total: number }[] = [];

    for (const item of input.items) {
      const product = productMap.get(item.productId)!;
      const stock = toNum(product.stock);
      if (stock < item.quantity) {
        throw new SaleError(
          `Жетишсиз запас: ${product.nameKy} (камда ${stock} ${product.unit})`,
          400
        );
      }

      const unitPrice = toNum(product.price);
      const lineTotal = unitPrice * item.quantity - (item.discount ?? 0);
      subtotal += lineTotal;

      itemData.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
        discount: item.discount ?? 0,
        total: lineTotal,
      });
    }

    const total = subtotal - (input.discount ?? 0);
    const saleNumber = await this.generateSaleNumber();

    const sale = await prisma.$transaction(async (tx) => {
      const created = await tx.sale.create({
        data: {
          saleNumber,
          subtotal,
          discount: input.discount ?? 0,
          total,
          paymentMethod: input.paymentMethod,
          status: SaleStatus.COMPLETED,
          cashierId,
          items: { create: itemData },
        },
        include: {
          items: { include: { product: { select: { nameKy: true, nameRu: true } } } },
        },
      });

      for (const item of input.items) {
        await StockService.adjustStock({
          productId: item.productId,
          delta: -item.quantity,
          type: StockMovementType.SALE,
          userId: cashierId,
          reason: 'Сатуу',
          reference: saleNumber,
          saleId: created.id,
          tx,
        });
      }

      return created;
    });

    return this.toSale(sale);
  }

  /** Сатуулар тизмеси */
  static async findAll(query: SaleQuery): Promise<PaginatedResponse<Sale>> {
    const { page, limit, dateFrom, dateTo } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { status: SaleStatus.COMPLETED };
    if (dateFrom || dateTo) {
      where.createdAt = {
        ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
        ...(dateTo ? { lte: new Date(dateTo + 'T23:59:59') } : {}),
      };
    }

    const [items, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          items: { include: { product: { select: { nameKy: true, nameRu: true } } } },
        },
      }),
      prisma.sale.count({ where }),
    ]);

    return {
      items: items.map(this.toSale),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /** Бир сатууну алуу */
  static async findById(id: string): Promise<Sale> {
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        items: { include: { product: { select: { nameKy: true, nameRu: true } } } },
      },
    });
    if (!sale) throw new SaleError('Сатуу табылган жок', 404);
    return this.toSale(sale);
  }

  private static async generateSaleNumber(): Promise<string> {
    const today = new Date();
    const prefix = `S-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`;
    const last = await prisma.sale.findFirst({
      where: { saleNumber: { startsWith: prefix } },
      orderBy: { saleNumber: 'desc' },
    });
    const seq = last ? parseInt(last.saleNumber.split('-').pop() ?? '0', 10) + 1 : 1;
    return `${prefix}-${String(seq).padStart(4, '0')}`;
  }

  private static toSale(sale: {
    id: string;
    saleNumber: string;
    subtotal: { toNumber?: () => number } | number;
    discount: { toNumber?: () => number } | number;
    total: { toNumber?: () => number } | number;
    paymentMethod: string;
    status: string;
    cashierId: string;
    createdAt: Date;
    items: Array<{
      productId: string;
      quantity: { toNumber?: () => number } | number;
      unitPrice: { toNumber?: () => number } | number;
      discount: { toNumber?: () => number } | number;
      total: { toNumber?: () => number } | number;
      product: { nameKy: string; nameRu: string };
    }>;
  }): Sale {
    return {
      id: sale.id,
      saleNumber: sale.saleNumber,
      items: sale.items.map((i) => ({
        productId: i.productId,
        productName: i.product.nameKy,
        quantity: toNum(i.quantity),
        unitPrice: toNum(i.unitPrice),
        discount: toNum(i.discount),
        total: toNum(i.total),
      })),
      subtotal: toNum(sale.subtotal),
      discount: toNum(sale.discount),
      total: toNum(sale.total),
      paymentMethod: sale.paymentMethod as Sale['paymentMethod'],
      status: sale.status as Sale['status'],
      cashierId: sale.cashierId,
      createdAt: sale.createdAt.toISOString(),
    };
  }
}

export { StockError };

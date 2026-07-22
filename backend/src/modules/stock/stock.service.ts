import { Prisma, StockMovementType } from '@prisma/client';
import { prisma } from '../../config/database';

export class StockError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = 'StockError';
  }
}

export function toNum(val: { toNumber?: () => number } | number | null | undefined): number {
  if (val == null) return 0;
  if (typeof val === 'number') return val;
  return val.toNumber?.() ?? Number(val);
}

export interface AdjustStockParams {
  productId: string;
  delta: number;
  type: StockMovementType;
  userId: string;
  reason?: string;
  reference?: string;
  unitCost?: number;
  saleId?: string;
  allowNegative?: boolean;
  tx?: Prisma.TransactionClient;
}

/**
 * Бардык запас өзгөрүүлөрү бул сервис аркылуу өтөт
 */
export class StockService {
  static async adjustStock(params: AdjustStockParams): Promise<number> {
    const run = async (tx: Prisma.TransactionClient) => {
      const product = await tx.product.findUnique({ where: { id: params.productId } });
      if (!product) throw new StockError('Товар табылган жок', 404);
      if (!product.isActive) throw new StockError('Товар активдүү эмес', 400);

      const stockBefore = toNum(product.stock);
      const stockAfter = stockBefore + params.delta;

      if (!params.allowNegative && stockAfter < 0) {
        throw new StockError(`Жетишсиз запас: ${product.nameKy} (${stockBefore} ${product.unit})`, 400);
      }

      await tx.product.update({
        where: { id: params.productId },
        data: { stock: stockAfter },
      });

      await tx.stockMovement.create({
        data: {
          productId: params.productId,
          type: params.type,
          quantity: params.delta,
          stockBefore,
          stockAfter,
          unitCost: params.unitCost ?? null,
          reason: params.reason ?? null,
          reference: params.reference ?? null,
          saleId: params.saleId ?? null,
          userId: params.userId,
        },
      });

      return stockAfter;
    };

    if (params.tx) return run(params.tx);
    return prisma.$transaction(run);
  }

  static async adjustStockBatch(
    items: Omit<AdjustStockParams, 'tx'>[],
    tx?: Prisma.TransactionClient
  ): Promise<void> {
    const run = async (client: Prisma.TransactionClient) => {
      for (const item of items) {
        await StockService.adjustStock({ ...item, tx: client });
      }
    };
    if (tx) return run(tx);
    await prisma.$transaction(run);
  }
}

import { z } from 'zod';

export const createSaleSchema = z.object({
  items: z.array(z.object({
    productId: z.string().min(1),
    quantity: z.coerce.number().positive(),
    discount: z.coerce.number().min(0).default(0),
  })).min(1, 'Кеминде бир товар талап кылынат'),
  discount: z.coerce.number().min(0).default(0),
  paymentMethod: z.enum(['CASH', 'CARD', 'QR', 'MIXED']),
});

export const saleQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export const saleIdSchema = z.object({
  id: z.string().min(1),
});

export type CreateSaleInput = z.infer<typeof createSaleSchema>;
export type SaleQuery = z.infer<typeof saleQuerySchema>;

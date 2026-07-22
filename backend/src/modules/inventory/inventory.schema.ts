import { z } from 'zod';

export const movementQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  productId: z.string().optional(),
  type: z.enum(['RECEIPT', 'WRITE_OFF', 'ADJUSTMENT', 'SALE', 'REFUND', 'COUNT']).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export const receiptSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().positive('Саны 0дөн чоң болушу керек'),
  unitCost: z.coerce.number().min(0).optional(),
  supplier: z.string().optional(),
  reason: z.string().optional(),
  reference: z.string().optional(),
  printLabels: z.coerce.boolean().default(true),
});

export const writeOffSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().positive('Саны 0дөн чоң болушу керек'),
  reason: z.string().min(1, 'Себеп талап кылынат'),
  reference: z.string().optional(),
});

export const countQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  status: z.enum(['DRAFT', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
});

export const createCountSchema = z.object({
  notes: z.string().optional(),
  categoryId: z.string().optional(),
});

export const updateCountItemsSchema = z.object({
  items: z.array(z.object({
    productId: z.string().min(1),
    countedQty: z.coerce.number().min(0),
  })).min(1),
});

export const countIdSchema = z.object({
  id: z.string().min(1),
});

export type MovementQuery = z.infer<typeof movementQuerySchema>;
export type ReceiptInput = z.infer<typeof receiptSchema>;
export type WriteOffInput = z.infer<typeof writeOffSchema>;
export type CountQuery = z.infer<typeof countQuerySchema>;
export type CreateCountInput = z.infer<typeof createCountSchema>;
export type UpdateCountItemsInput = z.infer<typeof updateCountItemsSchema>;

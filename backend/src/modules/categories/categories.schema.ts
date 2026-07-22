import { z } from 'zod';

/** Категория түзүү/өзгөртүү схемасы */
export const categorySchema = z.object({
  nameKy: z.string().min(1, 'Кыргызча аталыш талап кылынат').max(100),
  nameRu: z.string().min(1, 'Орусча аталыш талап кылынат').max(100),
  description: z.string().max(500).optional(),
  isActive: z.boolean().optional().default(true),
});

/** ID параметри */
export const categoryIdSchema = z.object({
  id: z.string().min(1),
});

export type CategoryInput = z.infer<typeof categorySchema>;

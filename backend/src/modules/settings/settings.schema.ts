import { z } from 'zod';

export const storeSettingsSchema = z.object({
  storeNameKy: z.string().min(1).max(200),
  storeNameRu: z.string().min(1).max(200),
  addressKy: z.string().max(500).optional(),
  addressRu: z.string().max(500).optional(),
  phone: z.string().max(50).optional(),
  email: z.string().email().optional().or(z.literal('')),
  taxId: z.string().max(50).optional(),
  taxName: z.string().max(200).optional(),
  taxRate: z.number().min(0).max(100).nullable().optional(),
  receiptHeaderKy: z.string().max(500).optional(),
  receiptHeaderRu: z.string().max(500).optional(),
  receiptFooterKy: z.string().max(500).optional(),
  receiptFooterRu: z.string().max(500).optional(),
  receiptShowLogo: z.boolean().optional(),
  receiptShowTax: z.boolean().optional(),
  defaultLocale: z.enum(['ky', 'ru']).optional(),
  currency: z.string().max(10).optional(),
  backupAutoEnabled: z.boolean().optional(),
  backupIntervalHours: z.number().int().min(1).max(168).optional(),
  backupRetentionCount: z.number().int().min(1).max(100).optional(),
});

export type StoreSettingsInput = z.infer<typeof storeSettingsSchema>;

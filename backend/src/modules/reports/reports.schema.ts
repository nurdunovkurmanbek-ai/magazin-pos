import { z } from 'zod';
import type { ReportPeriod } from '@magazin/shared';

export const reportQuerySchema = z.object({
  period: z.enum(['daily', 'weekly', 'monthly', 'yearly']).default('daily'),
  date: z.string().optional(),
});

export type ReportQuery = {
  period: ReportPeriod;
  date?: string;
};

export const productsReportQuerySchema = reportQuerySchema.extend({
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

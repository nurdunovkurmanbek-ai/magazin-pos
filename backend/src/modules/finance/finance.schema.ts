import { z } from 'zod';

export const reportQuerySchema = z.object({
  period: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  date: z.string().optional(),
});

export const expenseQuerySchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const expenseSchema = z.object({
  title: z.string().min(1, 'Аталышы талап кылынат'),
  amount: z.coerce.number().positive('Сумма 0дөн чоң болушу керек'),
  category: z.enum(['RENT', 'SALARY', 'UTILITIES', 'SUPPLIES', 'MARKETING', 'OTHER']),
  description: z.string().optional(),
  expenseDate: z.string().min(1),
});

export const expenseIdSchema = z.object({
  id: z.string().min(1),
});

export type ReportQuery = z.infer<typeof reportQuerySchema>;
export type ExpenseQuery = z.infer<typeof expenseQuerySchema>;
export type ExpenseInput = z.infer<typeof expenseSchema>;

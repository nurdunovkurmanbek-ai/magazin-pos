import type { PaymentChartPoint } from './dashboard';

/** Отчёт мезгили */
export type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

/** Чыгым категориясы */export enum ExpenseCategory {
  RENT = 'RENT',
  SALARY = 'SALARY',
  UTILITIES = 'UTILITIES',
  SUPPLIES = 'SUPPLIES',
  MARKETING = 'MARKETING',
  OTHER = 'OTHER',
}

/** Финансылык жыйынтык */
export interface FinancialSummary {
  revenue: number;
  cogs: number;
  operatingExpenses: number;
  totalExpenses: number;
  profit: number;
  salesCount: number;
  profitMargin: number;
}

/** Отчёт пункту */
export interface ReportPeriodPoint {
  key: string;
  label: string;
  revenue: number;
  cogs: number;
  operatingExpenses: number;
  totalExpenses: number;
  profit: number;
  salesCount: number;
  profitMargin: number;
}

/** Чыгым категориясы боюнча */
export interface ExpenseCategoryPoint {
  category: ExpenseCategory;
  amount: number;
  sharePercent: number;
}

/** Финансылык отчёт */
export interface FinancialReport {
  period: ReportPeriod;
  dateFrom: string;
  dateTo: string;
  summary: FinancialSummary;
  breakdown: ReportPeriodPoint[];
  expensesByCategory: ExpenseCategoryPoint[];
  paymentMethods: PaymentChartPoint[];
}

/** Операциялык чыгым */
export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  description?: string | null;
  expenseDate: string;
  createdById: string;
  createdBy?: { firstName: string; lastName: string };
  createdAt: string;
}

/** Чыгым киргизүү */
export interface ExpenseInput {
  title: string;
  amount: number;
  category: ExpenseCategory;
  description?: string;
  expenseDate: string;
}

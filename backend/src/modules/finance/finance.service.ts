import { prisma } from '../../config/database';
import type {
  FinancialReport,
  FinancialSummary,
  ReportPeriod,
  ReportPeriodPoint,
  Expense,
  PaginatedResponse,
} from '@magazin/shared';
import type { ExpenseQuery, ExpenseInput } from './finance.schema';
import { ReportsService } from '../reports/reports.service';

export class FinanceError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = 'FinanceError';
  }
}

export function toNum(val: { toNumber?: () => number } | number | null | undefined): number {
  if (val == null) return 0;
  if (typeof val === 'number') return val;
  return val.toNumber?.() ?? Number(val);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function buildSummary(
  revenue: number,
  cogs: number,
  operatingExpenses: number,
  salesCount: number
): FinancialSummary {
  const totalExpenses = cogs + operatingExpenses;
  const profit = revenue - totalExpenses;
  return {
    revenue: round2(revenue),
    cogs: round2(cogs),
    operatingExpenses: round2(operatingExpenses),
    totalExpenses: round2(totalExpenses),
    profit: round2(profit),
    salesCount,
    profitMargin: revenue > 0 ? round2((profit / revenue) * 100) : 0,
  };
}

/** Мезгил чектерин аныктоо */
export function getPeriodRange(period: ReportPeriod, refDate = new Date()): {
  from: Date;
  to: Date;
  breakdownRanges: { key: string; label: string; from: Date; to: Date }[];
} {
  const d = new Date(refDate);
  d.setHours(0, 0, 0, 0);

  if (period === 'daily') {
    const from = new Date(d);
    const to = new Date(d);
    to.setDate(to.getDate() + 1);
    const breakdownRanges = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(d);
      day.setDate(day.getDate() - i);
      const next = new Date(day);
      next.setDate(next.getDate() + 1);
      breakdownRanges.push({
        key: day.toISOString().split('T')[0],
        label: day.toLocaleDateString('ky-KG', { weekday: 'short', day: 'numeric', month: 'short' }),
        from: day,
        to: next,
      });
    }
    return { from, to, breakdownRanges };
  }

  if (period === 'weekly') {
    const day = d.getDay();
    const diff = day === 0 ? 6 : day - 1;
    const from = new Date(d);
    from.setDate(from.getDate() - diff);
    const to = new Date(from);
    to.setDate(to.getDate() + 7);
    const breakdownRanges = [];
    for (let i = 0; i < 7; i++) {
      const dayStart = new Date(from);
      dayStart.setDate(dayStart.getDate() + i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      breakdownRanges.push({
        key: dayStart.toISOString().split('T')[0],
        label: dayStart.toLocaleDateString('ky-KG', { weekday: 'short', day: 'numeric' }),
        from: dayStart,
        to: dayEnd,
      });
    }
    return { from, to, breakdownRanges };
  }

  if (period === 'monthly') {
    const from = new Date(d.getFullYear(), d.getMonth(), 1);
    const to = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    const breakdownRanges = [];
    const weeksCount = Math.ceil(daysInMonth / 7);
    for (let w = 0; w < weeksCount; w++) {
      const weekStart = new Date(from);
      weekStart.setDate(weekStart.getDate() + w * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      if (weekEnd > to) weekEnd.setTime(to.getTime());
      breakdownRanges.push({
        key: `W${w + 1}`,
        label: `${w + 1}-апта`,
        from: weekStart,
        to: weekEnd,
      });
    }
    return { from, to, breakdownRanges };
  }

  // yearly
  const from = new Date(d.getFullYear(), 0, 1);
  const to = new Date(d.getFullYear() + 1, 0, 1);
  const breakdownRanges = [];
  for (let m = 0; m < 12; m++) {
    const monthStart = new Date(d.getFullYear(), m, 1);
    const monthEnd = new Date(d.getFullYear(), m + 1, 1);
    breakdownRanges.push({
      key: `${d.getFullYear()}-${String(m + 1).padStart(2, '0')}`,
      label: monthStart.toLocaleDateString('ky-KG', { month: 'short' }),
      from: monthStart,
      to: monthEnd,
    });
  }
  return { from, to, breakdownRanges };
}

export class FinanceService {
  /** Финансылык отчёт */
  static async getReport(period: ReportPeriod, dateStr?: string): Promise<FinancialReport> {
    const refDate = dateStr ? new Date(dateStr) : new Date();
    const { from, to, breakdownRanges } = getPeriodRange(period, refDate);

    const summary = await this.calcForRange(from, to);
    const extras = await ReportsService.getFinanceExtras(from, to);

    const breakdown: ReportPeriodPoint[] = [];
    for (const range of breakdownRanges) {
      const metrics = await this.calcForRange(range.from, range.to);
      breakdown.push({
        key: range.key,
        label: range.label,
        ...metrics,
      });
    }

    return {
      period,
      dateFrom: from.toISOString(),
      dateTo: to.toISOString(),
      summary,
      breakdown,
      expensesByCategory: extras.expensesByCategory,
      paymentMethods: extras.paymentMethods,
    };
  }

  /** Мезгил үчүн метрикалар */
  static async calcForRange(from: Date, to: Date): Promise<FinancialSummary> {
    const [sales, operatingTotal] = await Promise.all([
      prisma.sale.findMany({
        where: { status: 'COMPLETED', createdAt: { gte: from, lt: to } },
        include: {
          items: { include: { product: { select: { costPrice: true } } } },
        },
      }),
      prisma.expense.aggregate({
        where: { expenseDate: { gte: from, lt: to } },
        _sum: { amount: true },
      }),
    ]);

    let revenue = 0;
    let cogs = 0;
    for (const sale of sales) {
      revenue += toNum(sale.total);
      for (const item of sale.items) {
        cogs += toNum(item.quantity) * toNum(item.product.costPrice);
      }
    }

    const operatingExpenses = toNum(operatingTotal._sum.amount);
    return buildSummary(revenue, cogs, operatingExpenses, sales.length);
  }

  /** Чыгымдар тизмеси */
  static async getExpenses(query: ExpenseQuery): Promise<PaginatedResponse<Expense>> {
    const { page, limit, dateFrom, dateTo } = query;
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = {};
    if (dateFrom || dateTo) {
      where.expenseDate = {
        ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
        ...(dateTo ? { lte: new Date(dateTo + 'T23:59:59') } : {}),
      };
    }

    const [items, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        orderBy: { expenseDate: 'desc' },
        skip,
        take: limit,
        include: { createdBy: { select: { firstName: true, lastName: true } } },
      }),
      prisma.expense.count({ where }),
    ]);

    return {
      items: items.map(this.toExpense),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async createExpense(input: ExpenseInput, userId: string): Promise<Expense> {
    const expense = await prisma.expense.create({
      data: {
        title: input.title.trim(),
        amount: input.amount,
        category: input.category,
        description: input.description?.trim() || null,
        expenseDate: new Date(input.expenseDate),
        createdById: userId,
      },
      include: { createdBy: { select: { firstName: true, lastName: true } } },
    });
    return this.toExpense(expense);
  }

  static async updateExpense(id: string, input: ExpenseInput): Promise<Expense> {
    const existing = await prisma.expense.findUnique({ where: { id } });
    if (!existing) throw new FinanceError('Чыгым табылган жок', 404);

    const expense = await prisma.expense.update({
      where: { id },
      data: {
        title: input.title.trim(),
        amount: input.amount,
        category: input.category,
        description: input.description?.trim() || null,
        expenseDate: new Date(input.expenseDate),
      },
      include: { createdBy: { select: { firstName: true, lastName: true } } },
    });
    return this.toExpense(expense);
  }

  static async deleteExpense(id: string): Promise<void> {
    const existing = await prisma.expense.findUnique({ where: { id } });
    if (!existing) throw new FinanceError('Чыгым табылган жок', 404);
    await prisma.expense.delete({ where: { id } });
  }

  private static toExpense(e: {
    id: string;
    title: string;
    amount: { toNumber?: () => number } | number;
    category: string;
    description: string | null;
    expenseDate: Date;
    createdById: string;
    createdAt: Date;
    createdBy?: { firstName: string; lastName: string };
  }): Expense {
    return {
      id: e.id,
      title: e.title,
      amount: toNum(e.amount),
      category: e.category as Expense['category'],
      description: e.description,
      expenseDate: e.expenseDate.toISOString(),
      createdById: e.createdById,
      createdBy: e.createdBy,
      createdAt: e.createdAt.toISOString(),
    };
  }
}

import { prisma } from '../../config/database';
import { getPeriodRange, toNum } from '../finance/finance.service';
import type {
  SalesReport,
  SalesReportSummary,
  SalesBreakdownPoint,
  ProductsReport,
  ProductRankingItem,
  EmployeesReport,
  EmployeePerformance,
  ReportPeriod,
  PaymentChartPoint,
  ExpenseCategory,
} from '@magazin/shared';

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

const PAYMENT_LABELS: Record<string, string> = {
  CASH: 'Накталай',
  CARD: 'Карта',
  QR: 'QR',
  MIXED: 'Аралаш',
};

type SaleWithDetails = Awaited<ReturnType<typeof fetchSalesInRange>>[number];

async function fetchSalesInRange(from: Date, to: Date) {
  return prisma.sale.findMany({
    where: { status: 'COMPLETED', createdAt: { gte: from, lt: to } },
    include: {
      items: { include: { product: { select: { id: true, nameKy: true, nameRu: true, costPrice: true } } } },
      cashier: { select: { id: true, firstName: true, lastName: true, role: true } },
    },
  });
}

function calcSalesSummary(sales: SaleWithDetails[]): SalesReportSummary {
  let revenue = 0;
  let discounts = 0;
  let itemsSold = 0;
  for (const sale of sales) {
    revenue += toNum(sale.total);
    discounts += toNum(sale.discount);
    for (const item of sale.items) {
      itemsSold += toNum(item.quantity);
    }
  }
  const salesCount = sales.length;
  return {
    salesCount,
    revenue: round2(revenue),
    discounts: round2(discounts),
    avgTicket: salesCount > 0 ? round2(revenue / salesCount) : 0,
    itemsSold: round2(itemsSold),
  };
}

function calcPaymentMethodsFromTotals(
  rows: { paymentMethod: string; total: { toNumber?: () => number } | number }[]
): PaymentChartPoint[] {
  const map = new Map<string, { value: number; count: number }>();
  for (const s of rows) {
    const cur = map.get(s.paymentMethod) ?? { value: 0, count: 0 };
    cur.value += toNum(s.total);
    cur.count += 1;
    map.set(s.paymentMethod, cur);
  }
  return Array.from(map.entries()).map(([method, data]) => ({
    method,
    label: PAYMENT_LABELS[method] ?? method,
    value: round2(data.value),
    count: data.count,
  }));
}

function aggregateProducts(sales: SaleWithDetails[]): ProductRankingItem[] {
  const map = new Map<string, ProductRankingItem & { saleIds: Set<string> }>();

  for (const sale of sales) {
    for (const item of sale.items) {
      const pid = item.productId;
      const qty = toNum(item.quantity);
      const rev = toNum(item.total);
      const cost = qty * toNum(item.product.costPrice);

      let entry = map.get(pid);
      if (!entry) {
        entry = {
          productId: pid,
          nameKy: item.product.nameKy,
          nameRu: item.product.nameRu,
          quantitySold: 0,
          revenue: 0,
          profit: 0,
          salesCount: 0,
          saleIds: new Set(),
        };
        map.set(pid, entry);
      }
      entry.quantitySold += qty;
      entry.revenue += rev;
      entry.profit += rev - cost;
      entry.saleIds.add(sale.id);
    }
  }

  return Array.from(map.values()).map(({ saleIds, ...rest }) => ({
    ...rest,
    quantitySold: round2(rest.quantitySold),
    revenue: round2(rest.revenue),
    profit: round2(rest.profit),
    salesCount: saleIds.size,
  }));
}

function aggregateEmployees(sales: SaleWithDetails[]): EmployeePerformance[] {
  const map = new Map<string, EmployeePerformance & { itemsSold: number }>();

  for (const sale of sales) {
    const c = sale.cashier;
    let entry = map.get(c.id);
    if (!entry) {
      entry = {
        userId: c.id,
        firstName: c.firstName,
        lastName: c.lastName,
        role: c.role,
        salesCount: 0,
        revenue: 0,
        avgTicket: 0,
        itemsSold: 0,
      };
      map.set(c.id, entry);
    }
    entry.salesCount += 1;
    entry.revenue += toNum(sale.total);
    for (const item of sale.items) {
      entry.itemsSold += toNum(item.quantity);
    }
  }

  return Array.from(map.values())
    .map((e) => ({
      ...e,
      revenue: round2(e.revenue),
      itemsSold: round2(e.itemsSold),
      avgTicket: e.salesCount > 0 ? round2(e.revenue / e.salesCount) : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

export class ReportsService {
  static async getSalesReport(period: ReportPeriod, dateStr?: string): Promise<SalesReport> {
    const refDate = dateStr ? new Date(dateStr) : new Date();
    const { from, to, breakdownRanges } = getPeriodRange(period, refDate);

    const allSales = await fetchSalesInRange(from, to);
    const summary = calcSalesSummary(allSales);

    const breakdown: SalesBreakdownPoint[] = [];
    for (const range of breakdownRanges) {
      const rangeSales = allSales.filter(
        (s) => s.createdAt >= range.from && s.createdAt < range.to
      );
      const s = calcSalesSummary(rangeSales);
      breakdown.push({
        key: range.key,
        label: range.label,
        salesCount: s.salesCount,
        revenue: s.revenue,
        avgTicket: s.avgTicket,
      });
    }

    return {
      period,
      dateFrom: from.toISOString(),
      dateTo: to.toISOString(),
      summary,
      breakdown,
      byPaymentMethod: calcPaymentMethodsFromTotals(allSales),
    };
  }

  static async getProductsReport(
    period: ReportPeriod,
    dateStr?: string,
    limit = 10
  ): Promise<ProductsReport> {
    const refDate = dateStr ? new Date(dateStr) : new Date();
    const { from, to } = getPeriodRange(period, refDate);
    const sales = await fetchSalesInRange(from, to);
    const items = aggregateProducts(sales);

    const byQty = [...items].sort((a, b) => b.quantitySold - a.quantitySold);
    const top = byQty.slice(0, limit);
    const bottom = [...byQty].reverse().slice(0, limit);

    return {
      period,
      dateFrom: from.toISOString(),
      dateTo: to.toISOString(),
      top,
      bottom,
    };
  }

  static async getEmployeesReport(period: ReportPeriod, dateStr?: string): Promise<EmployeesReport> {
    const refDate = dateStr ? new Date(dateStr) : new Date();
    const { from, to } = getPeriodRange(period, refDate);
    const sales = await fetchSalesInRange(from, to);

    return {
      period,
      dateFrom: from.toISOString(),
      dateTo: to.toISOString(),
      employees: aggregateEmployees(sales),
    };
  }

  static async getFinanceExtras(from: Date, to: Date) {
    const [expenseGroups, sales] = await Promise.all([
      prisma.expense.groupBy({
        by: ['category'],
        where: { expenseDate: { gte: from, lt: to } },
        _sum: { amount: true },
      }),
      prisma.sale.findMany({
        where: { status: 'COMPLETED', createdAt: { gte: from, lt: to } },
        select: { paymentMethod: true, total: true },
      }),
    ]);

    const totalExp = expenseGroups.reduce((s, g) => s + toNum(g._sum.amount), 0);
    const expensesByCategory = expenseGroups.map((g) => ({
      category: g.category as ExpenseCategory,
      amount: round2(toNum(g._sum.amount)),
      sharePercent: totalExp > 0 ? round2((toNum(g._sum.amount) / totalExp) * 100) : 0,
    }));

    return {
      expensesByCategory,
      paymentMethods: calcPaymentMethodsFromTotals(sales),
    };
  }
}

import { prisma } from '../../config/database';
import { FinanceService, toNum } from '../finance/finance.service';
import type {
  DashboardStats,
  DashboardCharts,
  DashboardChanges,
  LowStockProduct,
  DashboardRecentSale,
  DailyChartPoint,
  PaymentChartPoint,
} from '@magazin/shared';

/** Аз калган товар порогу — эми ар бир товардын minStock талаасы колдонулат */

/** Бүгүнкү күнүн башталышы */
function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Кечээкүнүн башталышы */
function startOfYesterday(): Date {
  const d = startOfToday();
  d.setDate(d.getDate() - 1);
  return d;
}

function endOfYesterday(): Date {
  return startOfToday();
}

/** Decimal → number */
function toNumLocal(val: { toNumber?: () => number } | number | null | undefined): number {
  return toNum(val);
}

/**
 * Dashboard бизнес-логикасы
 */
export class DashboardService {
  /** Негизги статистика */
  static async getStats(): Promise<DashboardStats> {
    const todayStart = startOfToday();
    const yesterdayStart = startOfYesterday();
    const yesterdayEnd = endOfYesterday();

    const [
      stockProductsCount,
      lowStockProducts,
      recentSalesRaw,
    ] = await Promise.all([
      prisma.product.count({ where: { isActive: true, stock: { gt: 0 } } }),
      prisma.product.findMany({
        where: { isActive: true },
        orderBy: { stock: 'asc' },
        select: { id: true, nameKy: true, nameRu: true, stock: true, unit: true, minStock: true },
      }),
      prisma.sale.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          cashier: { select: { firstName: true, lastName: true } },
          items: { select: { id: true } },
        },
      }),
    ]);

    const todayMetrics = await FinanceService.calcForRange(todayStart, new Date());
    const yesterdayMetrics = await FinanceService.calcForRange(yesterdayStart, yesterdayEnd);

    const changes: DashboardChanges = {
      salesCount: this.calcChange(todayMetrics.salesCount, yesterdayMetrics.salesCount),
      revenue: this.calcChange(todayMetrics.revenue, yesterdayMetrics.revenue),
      profit: this.calcChange(todayMetrics.profit, yesterdayMetrics.profit),
    };

    const lowStockFiltered = lowStockProducts.filter(
      (p) => toNumLocal(p.stock) <= toNumLocal(p.minStock)
    );

    const lowStock: LowStockProduct[] = lowStockFiltered.slice(0, 10).map((p) => ({
      id: p.id,
      nameKy: p.nameKy,
      nameRu: p.nameRu,
      stock: toNumLocal(p.stock),
      unit: p.unit,
      minStock: toNumLocal(p.minStock),
    }));

    const recentSales: DashboardRecentSale[] = recentSalesRaw.map((s) => ({
      id: s.id,
      saleNumber: s.saleNumber,
      total: toNumLocal(s.total),
      paymentMethod: s.paymentMethod,
      status: s.status,
      cashierName: `${s.cashier.firstName} ${s.cashier.lastName}`,
      itemsCount: s.items.length,
      createdAt: s.createdAt.toISOString(),
    }));

    return {
      todaySalesCount: todayMetrics.salesCount,
      todayRevenue: todayMetrics.revenue,
      todayProfit: todayMetrics.profit,
      todayExpenses: todayMetrics.totalExpenses,
      stockProductsCount,
      lowStockCount: lowStockFiltered.length,
      lowStockProducts: lowStock,
      recentSales,
      changes,
    };
  }

  /** График маалыматтары */
  static async getCharts(): Promise<DashboardCharts> {
    const days = 7;
    const daily: DailyChartPoint[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const metrics = await FinanceService.calcForRange(date, nextDate);

      daily.push({
        date: date.toISOString().split('T')[0],
        label: date.toLocaleDateString('ky-KG', { weekday: 'short', day: 'numeric', month: 'short' }),
        salesCount: metrics.salesCount,
        revenue: metrics.revenue,
        profit: metrics.profit,
        expenses: metrics.totalExpenses,
      });
    }

    // Бүгүнкү төлөм ыкмалары
    const todaySales = await prisma.sale.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: startOfToday() },
      },
      select: { paymentMethod: true, total: true },
    });

    const paymentMap = new Map<string, { value: number; count: number }>();
    for (const s of todaySales) {
      const cur = paymentMap.get(s.paymentMethod) ?? { value: 0, count: 0 };
      cur.value += toNumLocal(s.total);
      cur.count += 1;
      paymentMap.set(s.paymentMethod, cur);
    }

    const paymentLabels: Record<string, string> = {
      CASH: 'Накталай',
      CARD: 'Карта',
      QR: 'QR',
      MIXED: 'Аралаш',
    };

    const payments: PaymentChartPoint[] = Array.from(paymentMap.entries()).map(
      ([method, data]) => ({
        method,
        label: paymentLabels[method] ?? method,
        value: Math.round(data.value * 100) / 100,
        count: data.count,
      })
    );

    return { daily, payments };
  }

  /** Процент өзгөрүү */
  private static calcChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 1000) / 10;
  }
}

import { useTranslation } from 'react-i18next';
import {
  ShoppingBag,
  Banknote,
  TrendingUp,
  TrendingDown,
  Package,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { StatCard, formatCurrency, formatNumber } from '@/components/dashboard/StatCard';
import { DashboardChartsSection } from '@/components/dashboard/DashboardCharts';
import { LowStockTable } from '@/components/dashboard/LowStockTable';
import { RecentSalesTable } from '@/components/dashboard/RecentSalesTable';
import { useDashboardStats, useDashboardCharts } from '@/hooks/useDashboard';
import { useAuthStore } from '@/store/auth.store';

/**
 * Башкы панель — статистика, графиктер, акыркы сатуулар
 */
export function DashboardPage() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useDashboardStats();
  const { data: charts, isLoading: chartsLoading, refetch: refetchCharts } = useDashboardCharts();

  const handleRefresh = () => {
    refetchStats();
    refetchCharts();
  };

  const statCards = [
    {
      key: 'todaySales',
      title: t('dashboard.todaySales'),
      value: stats ? formatNumber(stats.todaySalesCount) : '—',
      icon: ShoppingBag,
      change: stats?.changes.salesCount,
      variant: 'default' as const,
    },
    {
      key: 'todayRevenue',
      title: t('dashboard.todayRevenue'),
      value: stats ? formatCurrency(stats.todayRevenue) : '—',
      icon: Banknote,
      change: stats?.changes.revenue,
      variant: 'success' as const,
    },
    {
      key: 'profit',
      title: t('dashboard.profit'),
      value: stats ? formatCurrency(stats.todayProfit) : '—',
      icon: TrendingUp,
      change: stats?.changes.profit,
      variant: 'info' as const,
    },
    {
      key: 'expenses',
      title: t('dashboard.expenses'),
      value: stats ? formatCurrency(stats.todayExpenses) : '—',
      icon: TrendingDown,
      variant: 'warning' as const,
    },
    {
      key: 'stockProducts',
      title: t('dashboard.stockProducts'),
      value: stats ? formatNumber(stats.stockProductsCount) : '—',
      icon: Package,
      variant: 'default' as const,
    },
    {
      key: 'lowStock',
      title: t('dashboard.lowStockCount'),
      value: stats ? formatNumber(stats.lowStockCount) : '—',
      icon: AlertTriangle,
      variant: 'destructive' as const,
    },
  ];

  return (
    <AppLayout title={t('nav.dashboard')}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {t('auth.welcomeBack')}, {user?.firstName}!
          </h2>
          <p className="text-muted-foreground mt-1">{t('dashboard.subtitle')}</p>
        </div>
        <Button variant="outline" size="touch" onClick={handleRefresh} className="shrink-0">
          <RefreshCw className="h-4 w-4" />
          {t('dashboard.refresh')}
        </Button>
      </div>

      {/* Stat cards — 6 карточка */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        {statCards.map((card) => (
          <StatCard
            key={card.key}
            title={card.title}
            value={card.value}
            icon={card.icon}
            change={card.change}
            variant={card.variant}
            loading={statsLoading}
          />
        ))}
      </div>

      {/* Charts */}
      <div className="mb-6">
        <DashboardChartsSection data={charts} loading={chartsLoading} />
      </div>

      {/* Low stock + Recent sales */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <LowStockTable
          products={stats?.lowStockProducts ?? []}
          loading={statsLoading}
        />
        <RecentSalesTable
          sales={stats?.recentSales ?? []}
          loading={statsLoading}
        />
      </div>
    </AppLayout>
  );
}

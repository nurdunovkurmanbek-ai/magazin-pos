import { useTranslation } from 'react-i18next';
import {
  ShoppingCart, Package, Users, Wallet, Loader2, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useReports, type ReportTab } from '@/hooks/useReports';
import { usePermissions } from '@/hooks/usePermissions';
import { Permission } from '@magazin/shared';
import { SalesReportTab } from '@/components/reports/SalesReportTab';
import { ProductsReportTab } from '@/components/reports/ProductsReportTab';
import { EmployeesReportTab } from '@/components/reports/EmployeesReportTab';
import { FinanceReportTab } from '@/components/reports/FinanceReportTab';
import { cn } from '@/lib/utils';

const PERIODS = ['daily', 'weekly', 'monthly', 'yearly'] as const;

const TABS: { id: ReportTab; icon: typeof ShoppingCart; labelKey: string }[] = [
  { id: 'sales', icon: ShoppingCart, labelKey: 'reports.tabSales' },
  { id: 'products', icon: Package, labelKey: 'reports.tabProducts' },
  { id: 'employees', icon: Users, labelKey: 'reports.tabEmployees' },
  { id: 'finance', icon: Wallet, labelKey: 'reports.tabFinance' },
];

export function ReportsPage() {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const canManage = can(Permission.REPORTS_FINANCIAL);

  const {
    salesReport, productsReport, employeesReport, financeReport, expenses,
    isLoading, error, period, setPeriod, refDate, setRefDate,
    activeTab, setActiveTab,
    createExpense, updateExpense, deleteExpense,
  } = useReports();

  const shiftDate = (dir: -1 | 1) => {
    const d = new Date(refDate);
    if (period === 'daily') d.setDate(d.getDate() + dir);
    else if (period === 'weekly') d.setDate(d.getDate() + dir * 7);
    else if (period === 'monthly') d.setMonth(d.getMonth() + dir);
    else d.setFullYear(d.getFullYear() + dir);
    setRefDate(d.toISOString().split('T')[0]);
  };

  return (
    <AppLayout title={t('reports.title')}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{t('reports.title')}</h1>
          <p className="text-muted-foreground">{t('reports.subtitle')}</p>
        </div>

        {/* Мезгил тандагыч */}
        <div className="flex flex-wrap items-center gap-2">
          {PERIODS.map((p) => (
            <Button key={p} variant={period === p ? 'default' : 'outline'} size="touch" onClick={() => setPeriod(p)}>
              {t(`reports.period_${p}`)}
            </Button>
          ))}
          <div className="flex items-center gap-1 ml-auto">
            <Button variant="outline" size="icon-touch" onClick={() => shiftDate(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Input type="date" value={refDate} onChange={(e) => setRefDate(e.target.value)} className="w-40 h-touch" />
            <Button variant="outline" size="icon-touch" onClick={() => shiftDate(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Табдар */}
        <div className="flex flex-wrap gap-2 border-b pb-2">
          {TABS.map(({ id, icon: Icon, labelKey }) => (
            <Button
              key={id}
              variant={activeTab === id ? 'default' : 'ghost'}
              size="touch"
              onClick={() => setActiveTab(id)}
              className={cn('gap-2')}
            >
              <Icon className="h-4 w-4" />
              {t(labelKey)}
            </Button>
          ))}
        </div>

        {error && (
          <p className="text-sm text-destructive text-center">{t('reports.loadError')}</p>
        )}

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {activeTab === 'sales' && salesReport && (
              <SalesReportTab report={salesReport} period={period} />
            )}
            {activeTab === 'products' && productsReport && (
              <ProductsReportTab report={productsReport} />
            )}
            {activeTab === 'employees' && employeesReport && (
              <EmployeesReportTab report={employeesReport} />
            )}
            {activeTab === 'finance' && financeReport && (
              <FinanceReportTab
                report={financeReport}
                expenses={expenses}
                period={period}
                canManage={canManage}
                refDate={refDate}
                onCreateExpense={createExpense}
                onUpdateExpense={updateExpense}
                onDeleteExpense={deleteExpense}
              />
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}

import { useTranslation } from 'react-i18next';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, Line, ComposedChart,
} from 'recharts';
import { ShoppingCart, Package, Receipt } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard, formatCurrency } from '@/components/dashboard/StatCard';
import type { SalesReport } from '@magazin/shared';
import { getPaymentLabel } from '@/lib/locale';

const COLORS = ['hsl(152, 69%, 31%)', 'hsl(217, 91%, 60%)', 'hsl(38, 92%, 50%)', 'hsl(280, 60%, 50%)'];

interface SalesReportTabProps {
  report: SalesReport;
  period: string;
}

export function SalesReportTab({ report, period }: SalesReportTabProps) {
  const { t } = useTranslation();
  const { summary, breakdown, byPaymentMethod } = report;

  const chartData = breakdown.map((b) => ({
    name: b.label,
    revenue: b.revenue,
    salesCount: b.salesCount,
    avgTicket: b.avgTicket,
  }));

  const paymentChart = byPaymentMethod.map((p) => ({
    ...p,
    label: getPaymentLabel(p.method, t),
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={t('reports.salesCount')} value={String(summary.salesCount)} icon={ShoppingCart} />
        <StatCard title={t('reports.revenue')} value={formatCurrency(summary.revenue)} icon={Receipt} variant="success" />
        <StatCard title={t('reports.avgTicket')} value={formatCurrency(summary.avgTicket)} icon={Receipt} />
        <StatCard title={t('reports.itemsSold')} value={String(summary.itemsSold)} icon={Package} variant="info" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>{t('reports.salesRevenueChart')}</CardTitle>
            <CardDescription>{t(`reports.period_${period}`)}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip formatter={(v, name) => [
                  name === 'salesCount' ? String(v) : formatCurrency(Number(v)),
                  name === 'salesCount' ? t('reports.salesCount') : t('reports.revenue'),
                ]} />
                <Legend />
                <Bar yAxisId="left" dataKey="revenue" name={t('reports.revenue')} fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="salesCount" name={t('reports.salesCount')} stroke="hsl(var(--primary))" strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('reports.paymentMethods')}</CardTitle>
            <CardDescription>{t('reports.paymentMethodsDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            {paymentChart.length === 0 ? (
              <p className="text-center text-muted-foreground py-16">{t('common.noData')}</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={paymentChart}
                    dataKey="value"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    outerRadius={95}
                    label={({ name, percent }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {paymentChart.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('reports.salesCountChart')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => [String(v), t('reports.salesCount')]} />
              <Bar dataKey="salesCount" name={t('reports.salesCount')} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

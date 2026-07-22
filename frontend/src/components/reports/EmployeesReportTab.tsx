import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { StatCard, formatCurrency } from '@/components/dashboard/StatCard';
import type { EmployeesReport } from '@magazin/shared';

interface EmployeesReportTabProps {
  report: EmployeesReport;
}

export function EmployeesReportTab({ report }: EmployeesReportTabProps) {
  const { t } = useTranslation();
  const { employees } = report;

  const chartData = employees.map((e) => ({
    name: `${e.firstName} ${e.lastName.charAt(0)}.`,
    revenue: e.revenue,
    salesCount: e.salesCount,
  }));

  const totalRevenue = employees.reduce((s, e) => s + e.revenue, 0);
  const totalSales = employees.reduce((s, e) => s + e.salesCount, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title={t('reports.employeesCount')} value={String(employees.length)} icon={Users} />
        <StatCard title={t('reports.salesCount')} value={String(totalSales)} icon={Users} variant="info" />
        <StatCard title={t('reports.revenue')} value={formatCurrency(totalRevenue)} icon={Users} variant="success" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('reports.employeeRevenueChart')}</CardTitle>
          <CardDescription>{t('reports.employeeRevenueChartDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <p className="text-center text-muted-foreground py-16">{t('common.noData')}</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v, name) => [
                  name === 'salesCount' ? String(v) : formatCurrency(Number(v)),
                  name === 'salesCount' ? t('reports.salesCount') : t('reports.revenue'),
                ]} />
                <Bar dataKey="revenue" name={t('reports.revenue')} fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('reports.employeesTable')}</CardTitle>
        </CardHeader>
        <CardContent>
          {employees.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">{t('common.noData')}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('reports.employeeName')}</TableHead>
                  <TableHead>{t('reports.role')}</TableHead>
                  <TableHead className="text-right">{t('reports.salesCount')}</TableHead>
                  <TableHead className="text-right">{t('reports.revenue')}</TableHead>
                  <TableHead className="text-right">{t('reports.avgTicket')}</TableHead>
                  <TableHead className="text-right">{t('reports.itemsSold')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((e) => (
                  <TableRow key={e.userId}>
                    <TableCell className="font-medium">{e.firstName} {e.lastName}</TableCell>
                    <TableCell><Badge variant="outline">{t(`roles.${e.role.toLowerCase()}`)}</Badge></TableCell>
                    <TableCell className="text-right tabular-nums">{e.salesCount}</TableCell>
                    <TableCell className="text-right tabular-nums font-semibold">{formatCurrency(e.revenue)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(e.avgTicket)}</TableCell>
                    <TableCell className="text-right tabular-nums">{e.itemsSold}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/components/dashboard/StatCard';
import type { ProductsReport } from '@magazin/shared';
import { getLocalizedName } from '@/lib/locale';

interface ProductsReportTabProps {
  report: ProductsReport;
}

export function ProductsReportTab({ report }: ProductsReportTabProps) {
  const { t, i18n } = useTranslation();

  const topChart = report.top.map((p) => ({
    name: getLocalizedName(p.nameKy, p.nameRu, i18n.language).slice(0, 20),
    quantity: p.quantitySold,
    revenue: p.revenue,
  }));

  const bottomChart = report.bottom.map((p) => ({
    name: getLocalizedName(p.nameKy, p.nameRu, i18n.language).slice(0, 20),
    quantity: p.quantitySold,
  }));

  const renderTable = (items: ProductsReport['top'], title: string) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">{t('common.noData')}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>{t('reports.productName')}</TableHead>
                <TableHead className="text-right">{t('reports.qtySold')}</TableHead>
                <TableHead className="text-right">{t('reports.revenue')}</TableHead>
                <TableHead className="text-right">{t('reports.profit')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((p, i) => (
                <TableRow key={p.productId}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell className="font-medium">{getLocalizedName(p.nameKy, p.nameRu, i18n.language)}</TableCell>
                  <TableCell className="text-right tabular-nums">{p.quantitySold}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(p.revenue)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(p.profit)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-success" />
              {t('reports.topProducts')}
            </CardTitle>
            <CardDescription>{t('reports.topProductsDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            {topChart.length === 0 ? (
              <p className="text-center text-muted-foreground py-16">{t('common.noData')}</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={topChart} layout="vertical" margin={{ left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [String(v), t('reports.qtySold')]} />
                  <Bar dataKey="quantity" fill="hsl(var(--success))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-destructive" />
              {t('reports.bottomProducts')}
            </CardTitle>
            <CardDescription>{t('reports.bottomProductsDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            {bottomChart.length === 0 ? (
              <p className="text-center text-muted-foreground py-16">{t('common.noData')}</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={bottomChart} layout="vertical" margin={{ left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [String(v), t('reports.qtySold')]} />
                  <Bar dataKey="quantity" fill="hsl(var(--destructive))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {renderTable(report.top, t('reports.topProducts'))}
        {renderTable(report.bottom, t('reports.bottomProducts'))}
      </div>
    </div>
  );
}

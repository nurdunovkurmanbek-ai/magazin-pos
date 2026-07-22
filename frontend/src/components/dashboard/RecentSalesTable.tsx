import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { DashboardRecentSale } from '@magazin/shared';
import { formatCurrency } from '@/components/dashboard/StatCard';
import { formatDateTime, getPaymentLabel } from '@/lib/locale';

const statusVariant: Record<string, 'success' | 'warning' | 'destructive' | 'muted'> = {
  COMPLETED: 'success',
  PENDING: 'warning',
  CANCELLED: 'destructive',
  REFUNDED: 'muted',
};

interface RecentSalesTableProps {
  sales: DashboardRecentSale[];
  loading?: boolean;
}

/** Акыркы сатуулар таблицасы */
export function RecentSalesTable({ sales, loading }: RecentSalesTableProps) {
  const { t, i18n } = useTranslation();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="h-64 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dashboard.recentSales')}</CardTitle>
        <CardDescription>{t('dashboard.recentSalesDesc')}</CardDescription>
      </CardHeader>
      <CardContent>
        {sales.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            {t('common.noData')}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('dashboard.saleId')}</TableHead>
                <TableHead>{t('dashboard.cashier')}</TableHead>
                <TableHead className="text-right">{t('dashboard.items')}</TableHead>
                <TableHead className="text-right">{t('dashboard.amount')}</TableHead>
                <TableHead>{t('dashboard.payment')}</TableHead>
                <TableHead>{t('dashboard.status')}</TableHead>
                <TableHead>{t('dashboard.time')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell className="font-medium">{sale.saleNumber}</TableCell>
                  <TableCell>{sale.cashierName}</TableCell>
                  <TableCell className="text-right tabular-nums">{sale.itemsCount}</TableCell>
                  <TableCell className="text-right tabular-nums font-medium">
                    {formatCurrency(sale.total)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {getPaymentLabel(sale.paymentMethod, t)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[sale.status] ?? 'muted'}>
                      {t(`dashboard.status_${sale.status.toLowerCase()}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDateTime(sale.createdAt, i18n.language)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

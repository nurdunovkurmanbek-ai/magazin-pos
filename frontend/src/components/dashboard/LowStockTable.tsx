import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
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
import type { LowStockProduct } from '@magazin/shared';
import { formatNumber } from '@/components/dashboard/StatCard';
import { getLocalizedName } from '@/lib/locale';

interface LowStockTableProps {
  products: LowStockProduct[];
  loading?: boolean;
}

/** Аз калган товарлар таблицасы */
export function LowStockTable({ products, loading }: LowStockTableProps) {
  const { t, i18n } = useTranslation();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="h-48 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-warning" />
          <CardTitle>{t('dashboard.lowStock')}</CardTitle>
        </div>
        <CardDescription>{t('dashboard.lowStockDesc')}</CardDescription>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            {t('dashboard.noLowStock')}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('dashboard.product')}</TableHead>
                <TableHead className="text-right">{t('dashboard.stock')}</TableHead>
                <TableHead>{t('dashboard.status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">
                    {getLocalizedName(p.nameKy, p.nameRu, i18n.language)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(p.stock)} {p.unit}
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.stock === 0 ? 'destructive' : 'warning'}>
                      {p.stock === 0
                        ? t('dashboard.outOfStock')
                        : t('dashboard.lowStockBadge')}
                    </Badge>
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

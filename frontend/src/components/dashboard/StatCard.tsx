import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  change?: number;
  variant?: 'default' | 'success' | 'warning' | 'info' | 'destructive';
  loading?: boolean;
}

const variantStyles = {
  default: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  info: 'bg-info/10 text-info',
  destructive: 'bg-destructive/10 text-destructive',
};

/**
 * Статистика карточкасы
 */
export function StatCard({
  title,
  value,
  icon: Icon,
  change,
  variant = 'default',
  loading,
}: StatCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm text-muted-foreground truncate">{title}</p>
            {loading ? (
              <div className="h-8 w-24 bg-muted animate-pulse rounded mt-1" />
            ) : (
              <p className="text-2xl font-bold tabular-nums mt-1">{value}</p>
            )}
            {change !== undefined && !loading && (
              <Badge
                variant={change >= 0 ? 'success' : 'destructive'}
                className="mt-2 text-xs"
              >
                {change >= 0 ? '+' : ''}
                {change}%
              </Badge>
            )}
          </div>
          <div
            className={cn(
              'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',
              variantStyles[variant]
            )}
          >
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/** Сом форматтоо — учурдагы тилге ылайык */
export { formatCurrency, formatNumber } from '@/lib/locale';

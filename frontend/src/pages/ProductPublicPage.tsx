import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Loader2, Store, Package, Calendar, Truck, MapPin,
  Barcode, AlertTriangle, ShieldCheck,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { usePublicProduct } from '@/hooks/usePublicProduct';
import { formatCurrency } from '@/components/dashboard/StatCard';
import { buildProductQrUrl } from '@magazin/shared';
import { getLocalizedName, formatDate } from '@/lib/locale';
import { cn } from '@/lib/utils';

/**
 * QR сканер баракчасы — кардар жана кызматкер режимдери
 */
export function ProductPublicPage() {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const { data, isLoading, error } = usePublicProduct(id);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center relative">
        <div className="absolute top-4 right-4 flex items-center gap-1">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
        <Package className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-xl font-bold">{t('productPublic.notFound')}</h1>
        <p className="text-muted-foreground mt-2">{t('productPublic.notFoundDesc')}</p>
      </div>
    );
  }

  const { customer, staff } = data;
  const name = getLocalizedName(customer.nameKy, customer.nameRu, i18n.language);
  const categoryName = customer.category
    ? getLocalizedName(customer.category.nameKy, customer.category.nameRu, i18n.language)
    : null;

  const expiryDate = customer.expiryDate ? new Date(customer.expiryDate) : null;
  const isExpired = expiryDate ? expiryDate < new Date() : false;
  const isExpiringSoon = expiryDate && !isExpired
    ? expiryDate.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000
    : false;

  const qrUrl = customer.qrUrl || buildProductQrUrl(customer.id, window.location.origin);

  const formatDateValue = (iso?: string | null) => {
    if (!iso) return '—';
    return formatDate(iso, i18n.language);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
            <Store className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm">{t('common.appName')}</p>
            <p className="text-xs text-muted-foreground">{t('productPublic.subtitle')}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4 space-y-4 pb-8">
        {/* Кардар режими */}
        <Card className="overflow-hidden">
          {customer.imageUrl && (
            <div className="aspect-video bg-muted">
              <img
                src={customer.imageUrl}
                alt={name}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <CardContent className="pt-5 space-y-4">
            <div>
              {categoryName && (
                <Badge variant="secondary" className="mb-2">{categoryName}</Badge>
              )}
              <h1 className="text-2xl font-bold leading-tight">{name}</h1>
              {customer.brand && (
                <p className="text-muted-foreground mt-1">{customer.brand}</p>
              )}
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-primary tabular-nums">
                {formatCurrency(customer.price)}
              </span>
              <span className="text-muted-foreground">/ {customer.unit}</span>
            </div>

            {customer.description && (
              <p className="text-sm text-muted-foreground">{customer.description}</p>
            )}

            {expiryDate && (
              <div className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm',
                isExpired ? 'bg-destructive/10 text-destructive' :
                isExpiringSoon ? 'bg-warning/10 text-warning' : 'bg-muted'
              )}>
                <Calendar className="h-4 w-4 shrink-0" />
                <span>
                  {t('productPublic.expiry')}: {formatDateValue(customer.expiryDate)}
                  {isExpired && ` — ${t('productPublic.expired')}`}
                  {isExpiringSoon && !isExpired && ` — ${t('productPublic.expiringSoon')}`}
                </span>
              </div>
            )}

            <div className="flex justify-center pt-2">
              <div className="text-center">
                <QRCodeSVG value={qrUrl} size={100} level="M" />
                <p className="text-xs text-muted-foreground mt-1 font-mono break-all max-w-[200px]">
                  {qrUrl.replace(/^https?:\/\//, '')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Кызматкер режими */}
        {staff && (
          <Card className="border-primary/30">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-5 w-5 text-primary" />
                {t('productPublic.staffMode')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <InfoRow
                  icon={Barcode}
                  label={t('productPublic.barcode')}
                  value={staff.barcode ?? '—'}
                />
                <InfoRow
                  icon={Package}
                  label={t('productPublic.stock')}
                  value={`${staff.stock} ${customer.unit}`}
                  highlight={staff.isLowStock}
                />
                <InfoRow
                  label={t('productPublic.costPrice')}
                  value={formatCurrency(staff.costPrice)}
                />
                <InfoRow
                  label={t('productPublic.minStock')}
                  value={`${staff.minStock} ${customer.unit}`}
                />
                <InfoRow
                  icon={Truck}
                  label={t('productPublic.supplier')}
                  value={staff.supplier ?? '—'}
                />
                <InfoRow
                  icon={Calendar}
                  label={t('productPublic.arrivalDate')}
                  value={formatDateValue(staff.arrivalDate)}
                />
                <InfoRow
                  icon={MapPin}
                  label={t('productPublic.shelf')}
                  value={staff.shelfLocation ?? '—'}
                  className="col-span-2"
                />
              </div>

              {staff.isLowStock && (
                <div className="flex items-center gap-2 text-sm text-warning bg-warning/10 rounded-lg px-3 py-2">
                  <AlertTriangle className="h-4 w-4" />
                  {t('productPublic.lowStock')}
                </div>
              )}

              <Button asChild variant="outline" size="touch" className="w-full">
                <Link to="/products">{t('productPublic.goToProducts')}</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {!staff && (
          <p className="text-center text-xs text-muted-foreground">
            {t('productPublic.customerHint')}
          </p>
        )}
      </main>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  highlight,
  className,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  highlight?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('space-y-0.5', className)}>
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </p>
      <p className={cn('font-medium tabular-nums', highlight && 'text-warning')}>{value}</p>
    </div>
  );
}

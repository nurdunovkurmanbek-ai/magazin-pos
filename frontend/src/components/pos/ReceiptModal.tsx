import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { QRCodeSVG } from 'qrcode.react';
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Modal, ModalContent, ModalDescription, ModalFooter, ModalHeader, ModalTitle,
} from '@/components/ui/modal';
import { formatCurrency } from '@/components/dashboard/StatCard';
import { useStoreSettings } from '@/providers/StoreSettingsProvider';
import { resolveMediaUrl } from '@/lib/media';
import { getLocalizedName, getPaymentLabel, formatDateTime } from '@/lib/locale';
import type { Sale, PaymentMethod } from '@magazin/shared';
import type { CartItem } from '@/hooks/usePos';

interface ReceiptData {
  sale: Sale;
  cartSnapshot: CartItem[];
  cashierName: string;
  paymentMethod: PaymentMethod;
  amountReceived?: number;
  change?: number;
}

interface ReceiptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receipt: ReceiptData | null;
}

export function ReceiptModal({ open, onOpenChange, receipt }: ReceiptModalProps) {
  const { t, i18n } = useTranslation();
  const { settings } = useStoreSettings();
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!printRef.current) return;
    const content = printRef.current.innerHTML;
    const win = window.open('', '_blank', 'width=320,height=600');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${receipt?.sale.saleNumber ?? 'Receipt'}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Courier New', monospace; font-size: 12px; width: 280px; margin: 0 auto; padding: 8px; }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .line { border-top: 1px dashed #000; margin: 6px 0; }
            .row { display: flex; justify-content: space-between; margin: 2px 0; }
            .item { margin: 4px 0; }
            .total { font-size: 16px; font-weight: bold; }
            img { max-height: 48px; margin: 0 auto 4px; display: block; }
            @media print { body { width: 80mm; } }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  if (!receipt || !settings) return null;

  const { sale, cartSnapshot, cashierName, paymentMethod, amountReceived, change } = receipt;
  const items = cartSnapshot.length > 0 ? cartSnapshot : sale.items.map((i) => ({
    productId: i.productId,
    nameKy: i.productName,
    nameRu: i.productName,
    unit: 'шт',
    unitPrice: i.unitPrice,
    quantity: i.quantity,
    stock: 0,
    barcode: null,
  }));

  const storeName = getLocalizedName(settings.storeNameKy, settings.storeNameRu, i18n.language);
  const address = getLocalizedName(settings.addressKy ?? '', settings.addressRu ?? '', i18n.language);
  const header = getLocalizedName(settings.receiptHeaderKy ?? '', settings.receiptHeaderRu ?? '', i18n.language);
  const footer = getLocalizedName(settings.receiptFooterKy ?? '', settings.receiptFooterRu ?? '', i18n.language) || t('pos.thankYou');
  const logoUrl = settings.receiptShowLogo ? resolveMediaUrl(settings.logoUrl) : null;

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-sm">
        <ModalHeader>
          <ModalTitle>{t('pos.receipt')}</ModalTitle>
          <ModalDescription>{sale.saleNumber}</ModalDescription>
        </ModalHeader>

        <div ref={printRef} className="font-mono text-sm space-y-1 p-4 bg-muted/30 rounded-lg">
          {logoUrl && <div className="text-center"><img src={logoUrl} alt="" className="h-12 mx-auto object-contain" /></div>}
          <div className="text-center font-bold text-base">{storeName}</div>
          {address && <div className="text-center text-xs">{address}</div>}
          {settings.phone && <div className="text-center text-xs">{settings.phone}</div>}
          {header && <div className="text-center text-xs mt-1">{header}</div>}
          <div className="text-center text-xs text-muted-foreground">
            {formatDateTime(sale.createdAt, i18n.language)}
          </div>
          <div className="text-center text-xs">{t('pos.cashier')}: {cashierName}</div>
          <div className="text-center text-xs">{sale.saleNumber}</div>
          <div className="border-t border-dashed border-border my-2" />

          {items.map((item) => (
            <div key={item.productId} className="text-xs">
              <div className="font-medium">
                {getLocalizedName(item.nameKy, item.nameRu, i18n.language)}
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>{item.quantity} x {formatCurrency(item.unitPrice)}</span>
                <span>{formatCurrency(item.unitPrice * item.quantity)}</span>
              </div>
            </div>
          ))}

          <div className="border-t border-dashed border-border my-2" />
          <div className="flex justify-between text-xs">
            <span>{t('pos.subtotal')}</span>
            <span>{formatCurrency(sale.subtotal)}</span>
          </div>
          {sale.discount > 0 && (
            <div className="flex justify-between text-xs">
              <span>{t('pos.discount')}</span>
              <span>-{formatCurrency(sale.discount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-base mt-1">
            <span>{t('pos.total')}</span>
            <span>{formatCurrency(sale.total)}</span>
          </div>
          <div className="flex justify-between text-xs mt-1">
            <span>{t('pos.paymentMethod')}</span>
            <span>{getPaymentLabel(paymentMethod, t)}</span>
          </div>
          {paymentMethod === 'CASH' && amountReceived != null && (
            <>
              <div className="flex justify-between text-xs">
                <span>{t('pos.received')}</span>
                <span>{formatCurrency(amountReceived)}</span>
              </div>
              <div className="flex justify-between text-xs font-semibold">
                <span>{t('pos.change')}</span>
                <span>{formatCurrency(change ?? 0)}</span>
              </div>
            </>
          )}
          {settings.receiptShowTax && settings.taxId && (
            <div className="text-center text-xs mt-2 text-muted-foreground">
              {settings.taxName && <div>{settings.taxName}</div>}
              <div>{t('settings.taxId')}: {settings.taxId}</div>
              {settings.taxRate != null && <div>{t('settings.taxRate')}: {settings.taxRate}%</div>}
            </div>
          )}
          <div className="text-center text-xs mt-3">{footer}</div>
        </div>

        <ModalFooter>
          <Button variant="outline" size="touch" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button size="touch" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            {t('pos.print')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

interface QrPaymentProps {
  total: number;
  saleRef: string;
}

export function QrPaymentDisplay({ total, saleRef }: QrPaymentProps) {
  const { t } = useTranslation();
  const { settings } = useStoreSettings();
  const payload = JSON.stringify({
    type: 'magazin_payment',
    amount: total,
    ref: saleRef,
    currency: settings?.currency ?? 'KGS',
  });

  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <QRCodeSVG value={payload} size={180} level="M" />
      <p className="text-2xl font-bold tabular-nums">{formatCurrency(total)}</p>
      <p className="text-sm text-muted-foreground text-center">{t('pos.qrScanHint')}</p>
    </div>
  );
}

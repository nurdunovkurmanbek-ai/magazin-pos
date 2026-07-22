import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ScanBarcode, ShoppingCart, Trash2, Plus, Minus, CreditCard,
  Banknote, QrCode, Loader2, X,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Modal, ModalContent, ModalDescription, ModalFooter, ModalHeader, ModalTitle,
} from '@/components/ui/modal';
import { usePos } from '@/hooks/usePos';
import { ReceiptModal, QrPaymentDisplay } from '@/components/pos/ReceiptModal';
import { formatCurrency } from '@/components/dashboard/StatCard';
import { useAuthStore } from '@/store/auth.store';
import { PaymentMethod, sanitizeScanInput, type Sale } from '@magazin/shared';
import { cn } from '@/lib/utils';

export function PosPage() {
  const { t, i18n } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const locale = i18n.language;

  const {
    cart, discount, setDiscount, subtotal, total, isProcessing,
    scanBarcode, updateQuantity, removeItem, clearCart, completeSale,
  } = usePos();

  const scanRef = useRef<HTMLInputElement>(null);
  const [scanValue, setScanValue] = useState('');
  const [scanError, setScanError] = useState('');
  const [scanLoading, setScanLoading] = useState(false);

  const [payOpen, setPayOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [amountReceived, setAmountReceived] = useState('');
  const [payError, setPayError] = useState('');

  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<{
    sale: Sale;
    cartSnapshot: typeof cart;
    paymentMethod: PaymentMethod;
    amountReceived?: number;
    change?: number;
  } | null>(null);

  const focusScanner = useCallback(() => {
    scanRef.current?.focus();
  }, []);

  useEffect(() => {
    focusScanner();
  }, [focusScanner, cart]);

  const productName = (ky: string, ru: string) => (locale === 'ru' ? ru : ky);

  const handleScan = async (code?: string) => {
    const value = sanitizeScanInput(code ?? scanValue);
    if (!value) return;

    setScanLoading(true);
    setScanError('');
    try {
      await scanBarcode(value);
      setScanValue('');
    } catch (err: unknown) {
      const key = (err as Error).message;
      if (key === 'notFound') setScanError(t('pos.productNotFound'));
      else if (key === 'outOfStock') setScanError(t('pos.outOfStock'));
      else if (key === 'insufficientStock') setScanError(t('pos.insufficientStock'));
      else setScanError(t('pos.scanError'));
    } finally {
      setScanLoading(false);
      focusScanner();
    }
  };

  const handleScanKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleScan();
    }
  };

  const openPayment = () => {
    if (cart.length === 0) return;
    setPaymentMethod(null);
    setAmountReceived('');
    setPayError('');
    setPayOpen(true);
  };

  const handlePay = async () => {
    if (!paymentMethod) return;

    if (paymentMethod === PaymentMethod.CASH) {
      const received = parseFloat(amountReceived) || 0;
      if (received < total) {
        setPayError(t('pos.insufficientAmount'));
        return;
      }
    }

    setPayError('');
    const cartSnapshot = [...cart];

    try {
      const sale = await completeSale(paymentMethod);
      const received = paymentMethod === PaymentMethod.CASH ? parseFloat(amountReceived) || 0 : undefined;

      setReceiptData({
        sale,
        cartSnapshot,
        paymentMethod,
        amountReceived: received,
        change: received != null ? received - sale.total : undefined,
      });

      setPayOpen(false);
      setReceiptOpen(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setPayError(msg || t('pos.payError'));
    }
  };

  const cashierName = user ? `${user.firstName} ${user.lastName}` : '';

  return (
    <AppLayout title={t('pos.title')}>
      <div className="grid lg:grid-cols-3 gap-4 h-[calc(100vh-8rem)]">
        {/* Сол жак — сканер жана себет */}
        <div className="lg:col-span-2 flex flex-col gap-4 min-h-0">
          {/* Сканер */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <ScanBarcode className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    ref={scanRef}
                    data-barcode-scanner="true"
                    value={scanValue}
                    onChange={(e) => setScanValue(e.target.value)}
                    onKeyDown={handleScanKeyDown}
                    placeholder={t('pos.scanBarcode')}
                    className="pl-10 h-touch text-lg font-mono tracking-wide"
                    autoComplete="off"
                    autoFocus
                    disabled={scanLoading}
                  />
                </div>
                <Button
                  size="touch"
                  onClick={() => handleScan()}
                  disabled={scanLoading || !scanValue.trim()}
                >
                  {scanLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : t('common.search')}
                </Button>
              </div>
              {scanError && (
                <p className="text-sm text-destructive mt-2">{scanError}</p>
              )}
            </CardContent>
          </Card>

          {/* Себет */}
          <Card className="flex-1 min-h-0 flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between py-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShoppingCart className="h-5 w-5" />
                {t('pos.cart')}
                {cart.length > 0 && (
                  <Badge variant="secondary">{cart.length}</Badge>
                )}
              </CardTitle>
              {cart.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearCart} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-1" />
                  {t('pos.clearCart')}
                </Button>
              )}
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto pb-4">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-12">
                  <ShoppingCart className="h-16 w-16 mb-4 opacity-30" />
                  <p className="text-lg">{t('pos.emptyCart')}</p>
                  <p className="text-sm mt-1">{t('pos.scanToAdd')}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {cart.map((item) => (
                    <div
                      key={item.productId}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {productName(item.nameKy, item.nameRu)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(item.unitPrice)} / {item.unit}
                          {item.barcode && (
                            <span className="ml-2 font-mono text-xs">{item.barcode}</span>
                          )}
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline" size="icon-touch"
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-10 text-center font-semibold tabular-nums">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline" size="icon-touch"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          disabled={item.quantity >= item.stock}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="w-24 text-right font-semibold tabular-nums">
                        {formatCurrency(item.unitPrice * item.quantity)}
                      </div>

                      <Button
                        variant="ghost" size="icon-touch"
                        onClick={() => removeItem(item.productId)}
                        className="text-destructive shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Оң жак — сумма жана төлөө */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>{t('pos.payment')}</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-4">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('pos.items')}</span>
                <span className="font-medium">{cart.reduce((s, i) => s + i.quantity, 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('pos.subtotal')}</span>
                <span className="font-medium tabular-nums">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground shrink-0">{t('pos.discount')}</span>
                <Input
                  type="number" min="0" step="1"
                  value={discount || ''}
                  onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="h-10 text-right tabular-nums"
                  placeholder="0"
                />
              </div>
              <div className="border-t pt-3 flex justify-between items-center">
                <span className="text-lg font-semibold">{t('pos.total')}</span>
                <span className="text-3xl font-bold tabular-nums text-primary">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>

            <div className="mt-auto space-y-2">
              <Button
                size="touch"
                className="w-full text-lg h-14"
                disabled={cart.length === 0 || isProcessing}
                onClick={openPayment}
              >
                {isProcessing ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  t('pos.pay')
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Төлөө модалы */}
      <Modal open={payOpen} onOpenChange={setPayOpen}>
        <ModalContent className="max-w-md">
          <ModalHeader>
            <ModalTitle>{t('pos.selectPayment')}</ModalTitle>
            <ModalDescription>
              {t('pos.total')}: <strong>{formatCurrency(total)}</strong>
            </ModalDescription>
          </ModalHeader>

          <div className="grid grid-cols-3 gap-3">
            {([
              { method: PaymentMethod.CASH, icon: Banknote, label: 'pos.cash' },
              { method: PaymentMethod.QR, icon: QrCode, label: 'pos.qr' },
              { method: PaymentMethod.CARD, icon: CreditCard, label: 'pos.card' },
            ] as const).map(({ method, icon: Icon, label }) => (
              <button
                key={method}
                type="button"
                onClick={() => setPaymentMethod(method)}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors touch-manipulation',
                  paymentMethod === method
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <Icon className="h-8 w-8" />
                <span className="text-sm font-medium">{t(label)}</span>
              </button>
            ))}
          </div>

          {paymentMethod === PaymentMethod.CASH && (
            <div className="space-y-2 mt-2">
              <label className="text-sm font-medium">{t('pos.amountReceived')}</label>
              <Input
                type="number" min="0" step="1"
                value={amountReceived}
                onChange={(e) => setAmountReceived(e.target.value)}
                className="h-touch text-xl text-right tabular-nums"
                placeholder="0"
                autoFocus
              />
              {parseFloat(amountReceived) >= total && (
                <p className="text-sm text-muted-foreground">
                  {t('pos.change')}: <strong className="text-foreground">
                    {formatCurrency(parseFloat(amountReceived) - total)}
                  </strong>
                </p>
              )}
            </div>
          )}

          {paymentMethod === PaymentMethod.QR && (
            <QrPaymentDisplay total={total} saleRef={`PENDING-${Date.now()}`} />
          )}

          {paymentMethod === PaymentMethod.CARD && (
            <p className="text-sm text-muted-foreground text-center py-4">
              {t('pos.cardHint')}
            </p>
          )}

          {payError && <p className="text-sm text-destructive">{payError}</p>}

          <ModalFooter>
            <Button variant="outline" size="touch" onClick={() => setPayOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              size="touch"
              disabled={!paymentMethod || isProcessing}
              onClick={handlePay}
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t('pos.confirmPay')
              )}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <ReceiptModal
        open={receiptOpen}
        onOpenChange={setReceiptOpen}
        receipt={receiptData ? {
          ...receiptData,
          cashierName,
        } : null}
      />
    </AppLayout>
  );
}

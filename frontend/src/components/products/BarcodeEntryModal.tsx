import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScanBarcode, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from '@/components/ui/modal';
import api from '@/lib/api';
import type { ApiResponse, BarcodeLookupResult, Product } from '@magazin/shared';
import { sanitizeScanInput } from '@magazin/shared';

interface BarcodeEntryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Штрихкод базада бар — товарды ачуу */
  onExisting: (product: Product) => void;
  /** Жаңы штрихкод — товар түзүү формасын ачуу */
  onNew: (barcode: string) => void;
}

/**
 * Товар кошуунун биринчи кадамы: штрихкодду сканерлөө/киргизүү.
 */
export function BarcodeEntryModal({
  open,
  onOpenChange,
  onExisting,
  onNew,
}: BarcodeEntryModalProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [skipBarcode, setSkipBarcode] = useState(false);

  useEffect(() => {
    if (open) {
      setCode('');
      setError('');
      setSkipBarcode(false);
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const lookup = async (raw: string) => {
    const barcode = sanitizeScanInput(raw);
    if (!barcode) {
      setError(t('products.barcodeRequired'));
      return;
    }

    setLoading(true);
    setError('');
    try {
      const { data: res } = await api.get<ApiResponse<BarcodeLookupResult>>(
        `/products/barcode-lookup/${encodeURIComponent(barcode)}`
      );
      if (!res.success || !res.data) throw new Error(res.message);

      if (res.data.exists && res.data.product) {
        onOpenChange(false);
        onExisting(res.data.product);
      } else {
        onOpenChange(false);
        onNew(res.data.barcode);
      }
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? t('products.barcodeLookupError'));
      inputRef.current?.select();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void lookup(code);
  };

  const handleSkip = () => {
    onOpenChange(false);
    onNew('');
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <ModalHeader>
            <ModalTitle className="flex items-center gap-2">
              <ScanBarcode className="h-5 w-5 text-primary" />
              {t('products.scanBarcodeTitle')}
            </ModalTitle>
            <ModalDescription>{t('products.scanBarcodeDesc')}</ModalDescription>
          </ModalHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('products.barcode')}</Label>
              <Input
                ref={inputRef}
                data-barcode-scanner="true"
                autoFocus
                touch
                className="font-mono text-lg tracking-wide"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="4601234567890"
                disabled={loading}
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">{t('products.scannerHint')}</p>
            </div>

            <label className="flex items-start gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4"
                checked={skipBarcode}
                onChange={(e) => setSkipBarcode(e.target.checked)}
              />
              <span>{t('products.noFactoryBarcodeHint')}</span>
            </label>

            {error && <p className="text-sm text-destructive text-center">{error}</p>}
          </div>

          <ModalFooter>
            <Button type="button" variant="outline" size="touch" onClick={() => onOpenChange(false)} disabled={loading}>
              {t('common.cancel')}
            </Button>
            {skipBarcode ? (
              <Button type="button" size="touch" onClick={handleSkip} disabled={loading}>
                {t('products.continueWithoutBarcode')}
              </Button>
            ) : (
              <Button type="submit" size="touch" disabled={loading || !code.trim()}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('products.lookupBarcode')}
              </Button>
            )}
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}

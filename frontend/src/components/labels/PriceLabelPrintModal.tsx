import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { createRoot } from 'react-dom/client';
import JsBarcode from 'jsbarcode';
import { Printer, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Modal, ModalContent, ModalDescription, ModalFooter, ModalHeader, ModalTitle,
} from '@/components/ui/modal';
import { PriceLabel } from '@/components/labels/PriceLabel';
import type { PriceLabelBatch } from '@magazin/shared';

interface PriceLabelPrintModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batch: PriceLabelBatch | null;
  autoPrint?: boolean;
}

const PRINT_STYLES = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; background: white; }
  .labels-page { display: flex; flex-wrap: wrap; gap: 2mm; padding: 4mm; }
  .price-label {
    width: 58mm; height: 40mm; border: 1px dashed #999; background: white; color: black;
    display: flex; flex-direction: column; align-items: center; justify-content: space-between;
    padding: 2mm; overflow: hidden; page-break-inside: avoid;
  }
  @media print {
    @page { size: A4; margin: 5mm; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
`;

function printAllLabels(batch: PriceLabelBatch, locale: string, title: string) {
  const host = document.createElement('div');
  host.style.position = 'fixed';
  host.style.left = '-9999px';
  document.body.appendChild(host);

  const root = createRoot(host);
  root.render(
    <div className="labels-page">
      {Array.from({ length: batch.count }).map((_, i) => (
        <PriceLabel key={i} data={batch.label} locale={locale} />
      ))}
    </div>
  );

  setTimeout(() => {
    const html = host.innerHTML;
    root.unmount();
    document.body.removeChild(host);

    const win = window.open('', '_blank');
    if (!win) return;

    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head><title>${title}</title><style>${PRINT_STYLES}</style></head>
        <body><div class="labels-page">${html}</div></body>
      </html>
    `);
    win.document.close();

    if (batch.label.barcode) {
      win.document.querySelectorAll('svg').forEach((svg) => {
        try {
          JsBarcode(svg, batch.label.barcode!, {
            format: 'CODE128', displayValue: true, fontSize: 10, height: 32, margin: 0, width: 1.2,
          });
        } catch {
          try {
            JsBarcode(svg, batch.label.barcode!, {
              format: 'EAN13', displayValue: true, fontSize: 10, height: 32, margin: 0, width: 1.2,
            });
          } catch { /* skip */ }
        }
      });
    }

    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 400);
  }, 400);
}

export function PriceLabelPrintModal({
  open,
  onOpenChange,
  batch,
  autoPrint = false,
}: PriceLabelPrintModalProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const didAutoPrint = useRef(false);

  const handlePrint = () => {
    if (!batch || batch.count === 0) return;
    const name = locale === 'ru' ? batch.label.nameRu : batch.label.nameKy;
    printAllLabels(batch, locale, `${t('labels.title')} — ${name}`);
  };

  useEffect(() => {
    if (!open) {
      didAutoPrint.current = false;
      return;
    }
    if (!batch || batch.count === 0 || !autoPrint || didAutoPrint.current) return;
    didAutoPrint.current = true;
    const name = locale === 'ru' ? batch.label.nameRu : batch.label.nameKy;
    const timer = setTimeout(
      () => printAllLabels(batch, locale, `${t('labels.title')} — ${name}`),
      600
    );
    return () => clearTimeout(timer);
  }, [open, batch, autoPrint, locale, t]);

  if (!batch || batch.count === 0) return null;

  const name = locale === 'ru' ? batch.label.nameRu : batch.label.nameKy;
  const previewCount = Math.min(batch.count, 12);

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <ModalHeader>
          <ModalTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            {t('labels.title')}
          </ModalTitle>
          <ModalDescription>
            {t('labels.ready', { name, count: batch.count })}
          </ModalDescription>
        </ModalHeader>

        <div className="flex flex-wrap gap-2 justify-center p-4 bg-muted/20 rounded-lg">
          {Array.from({ length: previewCount }).map((_, i) => (
            <PriceLabel key={i} data={batch.label} locale={locale} />
          ))}
          {batch.count > previewCount && (
            <p className="w-full text-center text-sm text-muted-foreground">
              {t('labels.moreLabels', { count: batch.count - previewCount })}
            </p>
          )}
        </div>

        <ModalFooter>
          <Button variant="outline" size="touch" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button size="touch" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            {t('labels.print', { count: batch.count })}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

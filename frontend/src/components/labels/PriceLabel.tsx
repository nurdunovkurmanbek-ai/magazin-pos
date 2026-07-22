import { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { QRCodeSVG } from 'qrcode.react';
import { formatCurrency } from '@/components/dashboard/StatCard';
import { buildProductQrUrl } from '@magazin/shared';
import type { PriceLabelData } from '@magazin/shared';

interface PriceLabelProps {
  data: PriceLabelData;
  locale?: string;
  className?: string;
}

/** Бир баа этикеткасы — 58x40mm */
export function PriceLabel({ data, locale = 'ky', className }: PriceLabelProps) {
  const barcodeRef = useRef<SVGSVGElement>(null);
  const name = locale === 'ru' ? data.nameRu : data.nameKy;
  const qrUrl = buildProductQrUrl(data.productId, typeof window !== 'undefined' ? window.location.origin : '');

  useEffect(() => {
    if (barcodeRef.current && data.barcode) {
      try {
        JsBarcode(barcodeRef.current, data.barcode, {
          format: 'EAN13',
          displayValue: true,
          fontSize: 10,
          height: 32,
          margin: 0,
          width: 1.2,
        });
      } catch {
        try {
          JsBarcode(barcodeRef.current, data.barcode, {
            format: 'CODE128',
            displayValue: true,
            fontSize: 10,
            height: 32,
            margin: 0,
            width: 1.2,
          });
        } catch {
          /* skip invalid barcode */
        }
      }
    }
  }, [data.barcode]);

  return (
    <div
      className={`price-label border border-dashed border-gray-400 bg-white text-black flex flex-col items-center justify-between p-1.5 overflow-hidden ${className ?? ''}`}
      style={{ width: '58mm', height: '40mm', boxSizing: 'border-box' }}
    >
      <div className="w-full text-center leading-tight">
        <p className="text-[9px] font-semibold line-clamp-2 min-h-[22px]">{name}</p>
        <p className="text-lg font-bold tabular-nums mt-0.5">{formatCurrency(data.price)}</p>
        <p className="text-[7px] text-gray-600">/{data.unit}</p>
      </div>

      <div className="flex items-end justify-center gap-1 w-full mt-auto">
        {data.barcode ? (
          <svg ref={barcodeRef} className="max-w-[38mm] h-[10mm]" />
        ) : (
          <span className="text-[8px] font-mono">{data.barcode ?? ''}</span>
        )}
        <QRCodeSVG value={qrUrl} size={36} level="M" className="shrink-0" />
      </div>
    </div>
  );
}

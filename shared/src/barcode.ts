/**
 * Заводдук / ички штрихкод утилиталары
 */

export enum BarcodeType {
  FACTORY = 'FACTORY',
  INTERNAL = 'INTERNAL',
}

export function normalizeBarcode(code: string | null | undefined): string {
  return (code ?? '').trim();
}

/** USB/Bluetooth сканерлерден келген кодду тазалоо */
export function sanitizeScanInput(raw: string): string {
  return raw.replace(/[\r\n\t]/g, '').trim();
}

/** EAN-13 check digit */
export function ean13CheckDigit(digits12: string): string {
  const nums = digits12.split('').map((d) => parseInt(d, 10));
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += nums[i] * (i % 2 === 0 ? 1 : 3);
  }
  return String((10 - (sum % 10)) % 10);
}

export function isValidEan13(code: string): boolean {
  if (!/^\d{13}$/.test(code)) return false;
  return ean13CheckDigit(code.slice(0, 12)) === code[12];
}

/** Ички штрихкод керекпи (заводдук жок / салмак / өз таңгак) */
export function allowsInternalBarcode(flags: {
  soldByWeight?: boolean;
  isSelfPacked?: boolean;
  noFactoryBarcode?: boolean;
}): boolean {
  return !!(flags.soldByWeight || flags.isSelfPacked || flags.noFactoryBarcode);
}

/**
 * Ички EAN-13 түзүү (2xxxxxx...) — өзгөчө учурлар үчүн гана.
 * Заводдук штрихкоддорго колдонулбайт.
 */
export function generateInternalBarcode(seed?: string): string {
  const base = (seed ?? Date.now().toString()).replace(/\D/g, '');
  const body = (`200${base}${Math.floor(Math.random() * 1e6)}`).slice(0, 12).padEnd(12, '0');
  return body + ean13CheckDigit(body);
}

export function resolveBarcodeType(input: {
  barcode?: string | null;
  barcodeType?: BarcodeType | string | null;
  soldByWeight?: boolean;
  isSelfPacked?: boolean;
  noFactoryBarcode?: boolean;
  generateInternalBarcode?: boolean;
}): BarcodeType {
  if (input.barcodeType === BarcodeType.INTERNAL || input.barcodeType === 'INTERNAL') {
    return BarcodeType.INTERNAL;
  }
  if (input.generateInternalBarcode || allowsInternalBarcode(input)) {
    if (!normalizeBarcode(input.barcode) || input.generateInternalBarcode) {
      return BarcodeType.INTERNAL;
    }
  }
  return BarcodeType.FACTORY;
}

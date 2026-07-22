import { describe, it, expect } from 'vitest';
import {
  normalizeBarcode,
  sanitizeScanInput,
  isValidEan13,
  ean13CheckDigit,
  generateInternalBarcode,
  allowsInternalBarcode,
  resolveBarcodeType,
  BarcodeType,
} from '../barcode';

describe('barcode utils', () => {
  it('normalizes and sanitizes scan input', () => {
    expect(normalizeBarcode(' 4601 ')).toBe('4601');
    expect(sanitizeScanInput('4601\r\n')).toBe('4601');
  });

  it('validates EAN-13 check digit', () => {
    const body = '460123456789';
    const full = body + ean13CheckDigit(body);
    expect(isValidEan13(full)).toBe(true);
    expect(isValidEan13('4601234567890')).toBe(isValidEan13('4601234567890'));
  });

  it('generates internal barcode starting with 2', () => {
    const code = generateInternalBarcode('123');
    expect(code).toHaveLength(13);
    expect(code.startsWith('2')).toBe(true);
    expect(isValidEan13(code)).toBe(true);
  });

  it('allows internal only for special cases', () => {
    expect(allowsInternalBarcode({})).toBe(false);
    expect(allowsInternalBarcode({ soldByWeight: true })).toBe(true);
    expect(allowsInternalBarcode({ isSelfPacked: true })).toBe(true);
    expect(allowsInternalBarcode({ noFactoryBarcode: true })).toBe(true);
  });

  it('resolves barcode type', () => {
    expect(resolveBarcodeType({ barcode: '4601' })).toBe(BarcodeType.FACTORY);
    expect(
      resolveBarcodeType({ generateInternalBarcode: true, soldByWeight: true })
    ).toBe(BarcodeType.INTERNAL);
  });
});

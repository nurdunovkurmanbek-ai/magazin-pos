/** Товар QR URL жолу */
export function buildProductPublicPath(productId: string): string {
  return `/p/${productId}`;
}

/** Толук QR URL */
export function buildProductQrUrl(productId: string, origin = ''): string {
  const base = origin.replace(/\/$/, '');
  return `${base}/p/${productId}`;
}

/** QR токен — базада сакталат */
export function buildProductQrToken(productId: string): string {
  return `P:${productId}`;
}

/** Сканер кодун парсинг кылуу */
export function parseProductScanCode(code: string): {
  type: 'id' | 'barcode';
  value: string;
} {
  const trimmed = code.trim();

  const urlMatch = trimmed.match(/\/p\/([a-zA-Z0-9_-]+)/);
  if (urlMatch) return { type: 'id', value: urlMatch[1] };

  if (trimmed.startsWith('P:')) return { type: 'id', value: trimmed.slice(2) };

  return { type: 'barcode', value: trimmed };
}

/** Кардарга көрүнүүчү товар маалыматы */
export interface PublicProductInfo {
  id: string;
  nameKy: string;
  nameRu: string;
  price: number;
  unit: string;
  brand?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  expiryDate?: string | null;
  category?: { nameKy: string; nameRu: string } | null;
  qrUrl: string;
}

/** Кызматкерлер үчүн кеңейтилген маалымат */
export interface StaffProductInfo {
  barcode?: string | null;
  costPrice: number;
  stock: number;
  minStock: number;
  supplier?: string | null;
  arrivalDate?: string | null;
  shelfLocation?: string | null;
  isLowStock: boolean;
  isActive: boolean;
}

/** QR сканер жообу */
export interface ProductScanResult {
  customer: PublicProductInfo;
  staff?: StaffProductInfo;
}

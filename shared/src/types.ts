/**
 * Орточо типтер — backend жана frontend ортосунда бөлүшүлөт
 */

export {
  UserRole,
  Permission,
  ROLE_PERMISSIONS,
  getPermissionsForRole,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  ROLE_LABELS,
  NAV_PERMISSIONS,
} from './permissions';

import { UserRole, Permission } from './permissions';

/** Төлөм ыкмасы */
export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  QR = 'QR',
  MIXED = 'MIXED',
}

/** Сатуунун статусу */
export enum SaleStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

/** API жоопунун стандарттык форматы */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

/** Пагинация параметрлери */
export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
}

/** Пагинация жообу */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** JWT payload */
export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}

/** Токен жообу */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/** Колдонуучу профили (сезгич маалыматсыз) */
export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  permissions: Permission[];
  isActive: boolean;
  createdAt: string;
}

/** Категория */
export interface Category {
  id: string;
  nameKy: string;
  nameRu: string;
  description?: string | null;
  isActive: boolean;
  productCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

/** Категория түзүү/өзгөртүү */
export interface CategoryInput {
  nameKy: string;
  nameRu: string;
  description?: string;
  isActive?: boolean;
}

/** Продукт */
export interface Product {
  id: string;
  barcode?: string | null;
  barcodeType?: 'FACTORY' | 'INTERNAL';
  soldByWeight?: boolean;
  isSelfPacked?: boolean;
  noFactoryBarcode?: boolean;
  qrCode?: string | null;
  nameKy: string;
  nameRu: string;
  brand?: string | null;
  description?: string | null;
  price: number;
  costPrice: number;
  stock: number;
  minStock: number;
  unit: string;
  supplier?: string | null;
  arrivalDate?: string | null;
  expiryDate?: string | null;
  imageUrl?: string | null;
  shelfLocation?: string | null;
  categoryId: string;
  category?: { id: string; nameKy: string; nameRu: string };
  isActive: boolean;
  isLowStock?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/** Продукт түзүү/өзгөртүү */
export interface ProductInput {
  barcode?: string | null;
  barcodeType?: 'FACTORY' | 'INTERNAL';
  soldByWeight?: boolean;
  isSelfPacked?: boolean;
  noFactoryBarcode?: boolean;
  generateInternalBarcode?: boolean;
  qrCode?: string | null;
  nameKy: string;
  nameRu: string;
  brand?: string;
  description?: string;
  price: number;
  costPrice: number;
  stock: number;
  minStock?: number;
  unit?: string;
  supplier?: string;
  arrivalDate?: string;
  expiryDate?: string;
  shelfLocation?: string;
  categoryId: string;
  isActive?: boolean;
}

/** Штрихкод боюнча издөө жоопу */
export interface BarcodeLookupResult {
  exists: boolean;
  barcode: string;
  product: Product | null;
}

/** Сатуудагы позиция */
export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

/** Сатуунун толук маалыматы */
export interface Sale {
  id: string;
  saleNumber: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  status: SaleStatus;
  cashierId: string;
  createdAt: string;
}

/** Колдоого алынган тилдер */
export type SupportedLocale = 'ky' | 'ru';

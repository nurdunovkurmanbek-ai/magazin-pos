/** Запас кыймылынын түрү */
export enum StockMovementType {
  RECEIPT = 'RECEIPT',
  WRITE_OFF = 'WRITE_OFF',
  ADJUSTMENT = 'ADJUSTMENT',
  SALE = 'SALE',
  REFUND = 'REFUND',
  COUNT = 'COUNT',
}

/** Инвентаризация статусу */
export enum InventoryCountStatus {
  DRAFT = 'DRAFT',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

/** Запас кыймылы */
export interface StockMovement {
  id: string;
  productId: string;
  product?: { id: string; nameKy: string; nameRu: string; unit: string; barcode?: string | null };
  type: StockMovementType;
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  unitCost?: number | null;
  reason?: string | null;
  reference?: string | null;
  saleId?: string | null;
  userId: string;
  user?: { id: string; firstName: string; lastName: string };
  createdAt: string;
}

/** Товар келүү (кирүү) */
export interface StockReceiptInput {
  productId: string;
  quantity: number;
  unitCost?: number;
  supplier?: string;
  reason?: string;
  reference?: string;
  printLabels?: boolean;
}

/** Товар чыгуу */
export interface StockWriteOffInput {
  productId: string;
  quantity: number;
  reason: string;
  reference?: string;
}

/** Инвентаризация */
export interface InventoryCount {
  id: string;
  countNumber: string;
  status: InventoryCountStatus;
  notes?: string | null;
  startedById: string;
  startedBy?: { id: string; firstName: string; lastName: string };
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  items?: InventoryCountItem[];
  itemCount?: number;
  varianceCount?: number;
}

/** Инвентаризация позициясы */
export interface InventoryCountItem {
  id: string;
  inventoryCountId: string;
  productId: string;
  product?: { id: string; nameKy: string; nameRu: string; unit: string; barcode?: string | null };
  expectedQty: number;
  countedQty: number;
  variance: number;
}

/** Инвентаризация позициясын жаңылоо */
export interface InventoryCountItemInput {
  productId: string;
  countedQty: number;
}

/** Запас эскертүүсү */
export interface StockAlert {
  id: string;
  productId: string;
  nameKy: string;
  nameRu: string;
  stock: number;
  minStock: number;
  unit: string;
  alertType: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'EXPIRY_SOON' | 'EXPIRED';
  expiryDate?: string | null;
  shelfLocation?: string | null;
}

/** Сатуу түзүү (POS) */
export interface CreateSaleInput {
  items: { productId: string; quantity: number; discount?: number }[];
  discount?: number;
  paymentMethod: 'CASH' | 'CARD' | 'QR' | 'MIXED';
}

import type { StockMovement } from './inventory';

/** Баа этикеткасынын маалыматы */
export interface PriceLabelData {
  productId: string;
  nameKy: string;
  nameRu: string;
  price: number;
  barcode?: string | null;
  qrCode?: string | null;
  unit: string;
}

/** Этикетка партиясы — receipt санына жараша */
export interface PriceLabelBatch {
  label: PriceLabelData;
  count: number;
}

/** Товар кирүү жообу */
export interface ReceiptResult {
  movement: StockMovement;
  labelBatch: PriceLabelBatch;
}

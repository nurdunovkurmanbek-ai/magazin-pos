/** Дүкөн жөндөөлөрү */
export interface StoreSettings {
  id: string;
  storeNameKy: string;
  storeNameRu: string;
  logoUrl: string | null;
  addressKy: string | null;
  addressRu: string | null;
  phone: string | null;
  email: string | null;
  taxId: string | null;
  taxName: string | null;
  taxRate: number | null;
  receiptHeaderKy: string | null;
  receiptHeaderRu: string | null;
  receiptFooterKy: string | null;
  receiptFooterRu: string | null;
  receiptShowLogo: boolean;
  receiptShowTax: boolean;
  defaultLocale: 'ky' | 'ru';
  currency: string;
  backupAutoEnabled: boolean;
  backupIntervalHours: number;
  backupRetentionCount: number;
  updatedAt: string;
}

/** Жөндөөлөрдү жаңылоо */
export interface StoreSettingsInput {
  storeNameKy: string;
  storeNameRu: string;
  addressKy?: string;
  addressRu?: string;
  phone?: string;
  email?: string;
  taxId?: string;
  taxName?: string;
  taxRate?: number | null;
  receiptHeaderKy?: string;
  receiptHeaderRu?: string;
  receiptFooterKy?: string;
  receiptFooterRu?: string;
  receiptShowLogo?: boolean;
  receiptShowTax?: boolean;
  defaultLocale?: 'ky' | 'ru';
  currency?: string;
  backupAutoEnabled?: boolean;
  backupIntervalHours?: number;
  backupRetentionCount?: number;
}

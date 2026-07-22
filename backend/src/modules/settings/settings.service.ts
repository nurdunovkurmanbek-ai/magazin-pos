import { prisma } from '../../config/database';
import type { StoreSettings, StoreSettingsInput } from '@magazin/shared';

export class SettingsError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = 'SettingsError';
  }
}

const DEFAULT_ID = 'default';

function toNum(val: { toNumber?: () => number } | number | null | undefined): number | null {
  if (val == null) return null;
  if (typeof val === 'number') return val;
  return val.toNumber?.() ?? Number(val);
}

const DEFAULTS = {
  storeNameKy: 'Магазин POS',
  storeNameRu: 'Магазин POS',
  receiptFooterKy: 'Сатып алганыңыз үчүн рахмат!',
  receiptFooterRu: 'Спасибо за покупку!',
};

export class SettingsService {
  /** Жөндөөлөрдү алуу (жок болсо түзүлөт) */
  static async get(): Promise<StoreSettings> {
    let row = await prisma.storeSettings.findUnique({ where: { id: DEFAULT_ID } });
    if (!row) {
      row = await prisma.storeSettings.create({
        data: {
          id: DEFAULT_ID,
          ...DEFAULTS,
        },
      });
    }
    return this.toSettings(row);
  }

  /** Жөндөөлөрдү жаңылоо */
  static async update(input: StoreSettingsInput): Promise<StoreSettings> {
    await this.get();
    const row = await prisma.storeSettings.update({
      where: { id: DEFAULT_ID },
      data: {
        storeNameKy: input.storeNameKy.trim(),
        storeNameRu: input.storeNameRu.trim(),
        addressKy: input.addressKy?.trim() || null,
        addressRu: input.addressRu?.trim() || null,
        phone: input.phone?.trim() || null,
        email: input.email?.trim() || null,
        taxId: input.taxId?.trim() || null,
        taxName: input.taxName?.trim() || null,
        taxRate: input.taxRate ?? null,
        receiptHeaderKy: input.receiptHeaderKy?.trim() || null,
        receiptHeaderRu: input.receiptHeaderRu?.trim() || null,
        receiptFooterKy: input.receiptFooterKy?.trim() || null,
        receiptFooterRu: input.receiptFooterRu?.trim() || null,
        ...(input.receiptShowLogo !== undefined && { receiptShowLogo: input.receiptShowLogo }),
        ...(input.receiptShowTax !== undefined && { receiptShowTax: input.receiptShowTax }),
        ...(input.defaultLocale !== undefined && { defaultLocale: input.defaultLocale }),
        ...(input.currency !== undefined && { currency: input.currency.trim() || 'KGS' }),
        ...(input.backupAutoEnabled !== undefined && { backupAutoEnabled: input.backupAutoEnabled }),
        ...(input.backupIntervalHours !== undefined && { backupIntervalHours: input.backupIntervalHours }),
        ...(input.backupRetentionCount !== undefined && { backupRetentionCount: input.backupRetentionCount }),
      },
    });
    return this.toSettings(row);
  }

  /** Логотип жүктөө */
  static async updateLogo(logoUrl: string): Promise<StoreSettings> {
    await this.get();
    const row = await prisma.storeSettings.update({
      where: { id: DEFAULT_ID },
      data: { logoUrl },
    });
    return this.toSettings(row);
  }

  /** Логотипти өчүрүү */
  static async removeLogo(): Promise<StoreSettings> {
    await this.get();
    const row = await prisma.storeSettings.update({
      where: { id: DEFAULT_ID },
      data: { logoUrl: null },
    });
    return this.toSettings(row);
  }

  private static toSettings(row: {
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
    taxRate: { toNumber?: () => number } | number | null;
    receiptHeaderKy: string | null;
    receiptHeaderRu: string | null;
    receiptFooterKy: string | null;
    receiptFooterRu: string | null;
    receiptShowLogo: boolean;
    receiptShowTax: boolean;
    defaultLocale: string;
    currency: string;
    backupAutoEnabled: boolean;
    backupIntervalHours: number;
    backupRetentionCount: number;
    updatedAt: Date;
  }): StoreSettings {
    return {
      id: row.id,
      storeNameKy: row.storeNameKy,
      storeNameRu: row.storeNameRu,
      logoUrl: row.logoUrl,
      addressKy: row.addressKy,
      addressRu: row.addressRu,
      phone: row.phone,
      email: row.email,
      taxId: row.taxId,
      taxName: row.taxName,
      taxRate: toNum(row.taxRate),
      receiptHeaderKy: row.receiptHeaderKy,
      receiptHeaderRu: row.receiptHeaderRu,
      receiptFooterKy: row.receiptFooterKy,
      receiptFooterRu: row.receiptFooterRu,
      receiptShowLogo: row.receiptShowLogo,
      receiptShowTax: row.receiptShowTax,
      defaultLocale: row.defaultLocale as 'ky' | 'ru',
      currency: row.currency,
      backupAutoEnabled: row.backupAutoEnabled,
      backupIntervalHours: row.backupIntervalHours,
      backupRetentionCount: row.backupRetentionCount,
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}

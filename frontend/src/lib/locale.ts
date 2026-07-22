import type { TFunction } from 'i18next';
import i18n from '@/i18n';

export type AppLocale = 'ky' | 'ru';

/** i18n тилин нормализациялоо */
export function normalizeLocale(lang?: string): AppLocale {
  return lang?.startsWith('ru') ? 'ru' : 'ky';
}

/** Intl формат үчүн locale */
export function getIntlLocale(lang?: string): string {
  return normalizeLocale(lang ?? i18n.language) === 'ru' ? 'ru-RU' : 'ky-KG';
}

/** Эки тилдүү аталыш */
export function getLocalizedName(
  nameKy: string,
  nameRu: string,
  lang?: string
): string {
  return normalizeLocale(lang ?? i18n.language) === 'ru' ? nameRu : nameKy;
}

/** Төлөм ыкмасынын котормосу */
export function getPaymentLabel(method: string, t: TFunction): string {
  const keys: Record<string, string> = {
    CASH: 'pos.cash',
    CARD: 'pos.card',
    QR: 'pos.qr',
    MIXED: 'pos.mixed',
  };
  const key = keys[method];
  return key ? t(key) : method;
}

/** Күнү/убакыт форматтоо */
export function formatDate(
  value: string | Date,
  lang?: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return date.toLocaleDateString(getIntlLocale(lang), options);
}

/** Күнү жана убакыт */
export function formatDateTime(
  value: string | Date,
  lang?: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return date.toLocaleString(getIntlLocale(lang), options ?? {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Валюта форматтоо */
export function formatCurrency(amount: number, lang?: string): string {
  return `${new Intl.NumberFormat(getIntlLocale(lang), {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)} сом`;
}

/** Сан форматтоо */
export function formatNumber(n: number, lang?: string): string {
  return new Intl.NumberFormat(getIntlLocale(lang)).format(n);
}

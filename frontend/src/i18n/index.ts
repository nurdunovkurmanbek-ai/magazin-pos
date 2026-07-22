import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ky from './locales/ky.json';
import ru from './locales/ru.json';
import type { SupportedLocale } from '@magazin/shared';

const savedLocale = (localStorage.getItem('locale') as SupportedLocale) ?? 'ky';

/**
 * i18next конфигурациясы — Кыргызча жана Русский
 */
i18n.use(initReactI18next).init({
  resources: {
    ky: { translation: ky },
    ru: { translation: ru },
  },
  lng: savedLocale,
  fallbackLng: 'ky',
  supportedLngs: ['ky', 'ru'],
  nonExplicitSupportedLngs: false,
  interpolation: {
    escapeValue: false,
  },
});

document.documentElement.lang = savedLocale;

/** Тилди өзгөртүү */
export function changeLanguage(locale: SupportedLocale): void {
  void i18n.changeLanguage(locale);
  localStorage.setItem('locale', locale);
  document.documentElement.lang = locale;
}

/** Учурдагы тил активдүүбү */
export function isActiveLocale(locale: SupportedLocale): boolean {
  return i18n.language?.startsWith(locale) ?? false;
}

export default i18n;

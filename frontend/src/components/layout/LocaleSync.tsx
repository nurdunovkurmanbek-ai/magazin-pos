import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { normalizeLocale, getLocalizedName } from '@/lib/locale';
import { useStoreSettings } from '@/providers/StoreSettingsProvider';

/** HTML lang жана document title синхронизациясы */
export function LocaleSync() {
  const { i18n, t } = useTranslation();
  const { settings } = useStoreSettings();

  useEffect(() => {
    const sync = (lng: string) => {
      const locale = normalizeLocale(lng);
      document.documentElement.lang = locale;
      const title = settings
        ? getLocalizedName(settings.storeNameKy, settings.storeNameRu, lng)
        : t('common.appName');
      document.title = title;
    };

    sync(i18n.language);
    i18n.on('languageChanged', sync);
    return () => { i18n.off('languageChanged', sync); };
  }, [i18n, t, settings]);

  return null;
}

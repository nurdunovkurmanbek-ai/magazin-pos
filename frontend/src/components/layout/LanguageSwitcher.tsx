import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { changeLanguage, isActiveLocale } from '@/i18n';
import { cn } from '@/lib/utils';
import type { SupportedLocale } from '@magazin/shared';

/**
 * Тил тандагыч — touch-friendly, ар кандай барактарда иштейт
 */
export function LanguageSwitcher({ showLabel = false }: { showLabel?: boolean }) {
  const { t } = useTranslation();
  const locales: SupportedLocale[] = ['ky', 'ru'];
  const current = locales.find((l) => isActiveLocale(l)) ?? 'ky';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size={showLabel ? 'touch' : 'icon-touch'} aria-label={t('ui.language')} className="gap-2">
          <Globe className="h-5 w-5" />
          {showLabel && <span className="text-sm font-medium">{t(`language.${current}`)}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[160px]">
        {locales.map((locale) => (
          <DropdownMenuItem
            key={locale}
            onClick={() => changeLanguage(locale)}
            className={cn(
              'min-h-touch cursor-pointer text-sm',
              isActiveLocale(locale) && 'bg-accent font-medium'
            )}
          >
            {t(`language.${locale}`)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

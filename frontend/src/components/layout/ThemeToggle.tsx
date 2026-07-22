import { Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/providers/ThemeProvider';

/**
 * Light / Dark Mode которгуч
 */
export function ThemeToggle() {
  const { t } = useTranslation();
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon-touch"
      onClick={toggleTheme}
      aria-label={t('ui.toggleTheme')}
    >
      {resolvedTheme === 'dark' ? (
        <Sun className="h-5 w-5 transition-transform" />
      ) : (
        <Moon className="h-5 w-5 transition-transform" />
      )}
    </Button>
  );
}

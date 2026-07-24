import { useTranslation } from 'react-i18next';
import { Bell, LogOut, Menu, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { useAuthStore } from '@/store/auth.store';

interface NavbarProps {
  title?: string;
  sidebarCollapsed: boolean;
  showSearch?: boolean;
  onSearch?: (value: string) => void;
  /** Телефондо каптал менюну ачуу */
  onMenuClick?: () => void;
}

/**
 * Navbar — үстүнкү панель, издөө жана тез аракеттер
 */
export function Navbar({
  title,
  sidebarCollapsed,
  showSearch = false,
  onSearch,
  onMenuClick,
}: NavbarProps) {
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    window.location.replace('/login');
  };

  return (
    <header
      className={cn(
        'fixed top-0 right-0 left-0 z-30 flex h-navbar items-center gap-2 border-b bg-card/80 backdrop-blur-md px-2 sm:gap-3 sm:px-4',
        'transition-all duration-200',
        sidebarCollapsed ? 'lg:left-sidebar-collapsed' : 'lg:left-sidebar'
      )}
    >
      {/* Меню — телефондо гана */}
      <Button
        variant="ghost"
        size="icon-touch"
        onClick={onMenuClick}
        className="shrink-0 lg:hidden"
        aria-label={t('ui.openMenu')}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Title */}
      {title && <h1 className="text-lg font-semibold truncate hidden sm:block">{title}</h1>}

      {/* Search */}
      {showSearch && (
        <div className="relative flex-1 min-w-0 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder={t('common.search')}
            className="pl-9 h-10"
            onChange={(e) => onSearch?.(e.target.value)}
          />
        </div>
      )}

      <div className="flex-1" />

      {/* Actions — телефондо орун аз, экинчи даражадагылар жашырылат.
          Тил алмаштыруу каптал менюнун ылдый жагында калат. */}
      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        {user && (
          <Badge variant="secondary" className="hidden md:inline-flex">
            {t(`roles.${user.role.toLowerCase()}`)}
          </Badge>
        )}

        <Button
          variant="ghost"
          size="icon-touch"
          aria-label={t('ui.notifications')}
          className="hidden sm:inline-flex"
        >
          <Bell className="h-5 w-5" />
        </Button>

        <ThemeToggle />
        <div className="hidden sm:block">
          <LanguageSwitcher />
        </div>

        <Button
          variant="ghost"
          size="icon-touch"
          onClick={handleLogout}
          aria-label={t('auth.logout')}
          className="text-muted-foreground hover:text-destructive"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}

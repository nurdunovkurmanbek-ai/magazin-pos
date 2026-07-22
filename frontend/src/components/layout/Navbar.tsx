import { useTranslation } from 'react-i18next';
import { Bell, LogOut, Search } from 'lucide-react';
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
}

/**
 * Navbar — үстүнкү панель, издөө жана тез аракеттер
 */
export function Navbar({ title, sidebarCollapsed, showSearch = false, onSearch }: NavbarProps) {
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    window.location.replace('/login');
  };

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-30 flex h-navbar items-center gap-3 border-b bg-card/80 backdrop-blur-md px-4',
        'transition-all duration-200',
        sidebarCollapsed ? 'left-sidebar-collapsed' : 'left-sidebar'
      )}
    >
      {/* Title */}
      {title && (
        <h1 className="text-lg font-semibold truncate shrink-0 hidden sm:block">{title}</h1>
      )}

      {/* Search */}
      {showSearch && (
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder={t('common.search')}
            className="pl-9 h-10"
            onChange={(e) => onSearch?.(e.target.value)}
          />
        </div>
      )}

      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-1 sm:gap-2">
        {user && (
          <Badge variant="secondary" className="hidden md:inline-flex">
            {t(`roles.${user.role.toLowerCase()}`)}
          </Badge>
        )}

        <Button variant="ghost" size="icon-touch" aria-label={t('ui.notifications')}>
          <Bell className="h-5 w-5" />
        </Button>

        <ThemeToggle />
        <LanguageSwitcher />

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

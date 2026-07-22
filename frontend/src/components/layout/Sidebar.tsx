import type { ComponentType } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Tags,
  Warehouse,
  Receipt,
  BarChart3,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Store,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { useStoreSettings } from '@/providers/StoreSettingsProvider';
import { resolveMediaUrl } from '@/lib/media';
import { getLocalizedName } from '@/lib/locale';
import { useAuthStore } from '@/store/auth.store';
import { usePermissions } from '@/hooks/usePermissions';
import { NAV_PERMISSIONS } from '@magazin/shared';

export interface NavItem {
  key: string;
  icon: ComponentType<{ className?: string }>;
  href: string;
}

const navItems: NavItem[] = [
  { key: 'dashboard', icon: LayoutDashboard, href: '/' },
  { key: 'pos', icon: ShoppingCart, href: '/pos' },
  { key: 'products', icon: Package, href: '/products' },
  { key: 'categories', icon: Tags, href: '/categories' },
  { key: 'inventory', icon: Warehouse, href: '/inventory' },
  { key: 'sales', icon: Receipt, href: '/sales' },
  { key: 'reports', icon: BarChart3, href: '/reports' },
  { key: 'users', icon: Users, href: '/users' },
  { key: 'settings', icon: Settings, href: '/settings' },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

/**
 * Sidebar — негизги навигация, сенсордук экрандарга ыңгайлуу
 */
export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { t, i18n } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const { can } = usePermissions();
  const { settings } = useStoreSettings();

  const storeName = settings
    ? getLocalizedName(settings.storeNameKy, settings.storeNameRu, i18n.language)
    : t('common.appName');
  const logoUrl = resolveMediaUrl(settings?.logoUrl);

  const visibleNavItems = navItems.filter(({ key }) => {
    const perm = NAV_PERMISSIONS[key];
    return perm ? can(perm) : true;
  });

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col',
        'bg-sidebar text-sidebar-foreground border-r border-sidebar-border',
        'transition-all duration-200 ease-in-out',
        collapsed ? 'w-sidebar-collapsed' : 'w-sidebar'
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          'flex h-navbar items-center border-b border-sidebar-border shrink-0',
          collapsed ? 'justify-center px-2' : 'px-4 gap-3'
        )}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground overflow-hidden">
          {logoUrl ? (
            <img src={logoUrl} alt="" className="h-full w-full object-contain bg-white" />
          ) : (
            <Store className="h-5 w-5" />
          )}
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">{storeName}</p>
            {user && (
              <p className="truncate text-xs text-muted-foreground">
                {user.firstName} {user.lastName}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-1">
        {visibleNavItems.map(({ key, icon: Icon, href }) => (
          <NavLink
            key={key}
            to={href}
            end={href === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md font-medium transition-colors touch-manipulation',
                'min-h-touch select-none active:scale-[0.98]',
                collapsed ? 'justify-center px-2' : 'px-3',
                isActive
                  ? 'bg-sidebar-active text-sidebar-active-foreground'
                  : 'text-sidebar-foreground hover:bg-accent hover:text-accent-foreground'
              )
            }
            title={collapsed ? t(`nav.${key}`) : undefined}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span className="text-sm">{t(`nav.${key}`)}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Тил жана жыйыштыруу */}
      <div className="border-t border-sidebar-border p-2 shrink-0 space-y-1">
        <div className={cn('flex', collapsed ? 'justify-center' : 'px-1')}>
          <LanguageSwitcher showLabel={!collapsed} />
        </div>
        <Button
          variant="ghost"
          size={collapsed ? 'icon-touch' : 'touch'}
          onClick={onToggle}
          className={cn('w-full', collapsed && 'px-0')}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <>
              <ChevronLeft className="h-5 w-5" />
              <span className="text-sm">{t('ui.collapse')}</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}

export { navItems };

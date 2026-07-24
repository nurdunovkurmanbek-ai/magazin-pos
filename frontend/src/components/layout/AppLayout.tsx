import { useEffect, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  showSearch?: boolean;
  onSearch?: (value: string) => void;
}

/**
 * AppLayout — Sidebar + Navbar + контент
 * POS интерфейси үчүн негизги каптал
 *
 * lg'ден кичине экрандарда (телефон, планшет) каптал панель жашырылып,
 * Navbar'дагы меню баскычы менен ачылат.
 */
export function AppLayout({ children, title, showSearch, onSearch }: AppLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Панель ачык турганда арткы барактын жылышын токтотуу
  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  // Escape менен жабуу
  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileOpen]);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Караңгы фон — панель ачык турганда, телефондо гана */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm animate-fade-in lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <Navbar
        title={title}
        sidebarCollapsed={collapsed}
        showSearch={showSearch}
        onSearch={onSearch}
        onMenuClick={() => setMobileOpen(true)}
      />

      <main
        className={cn(
          'min-h-screen pt-navbar transition-all duration-200',
          collapsed ? 'lg:pl-sidebar-collapsed' : 'lg:pl-sidebar'
        )}
      >
        <div className="p-3 sm:p-4 md:p-6 animate-fade-in">{children}</div>
      </main>
    </div>
  );
}

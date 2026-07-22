import { useState, type ReactNode } from 'react';
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
 */
export function AppLayout({ children, title, showSearch, onSearch }: AppLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <Navbar
        title={title}
        sidebarCollapsed={collapsed}
        showSearch={showSearch}
        onSearch={onSearch}
      />

      <main
        className={cn(
          'min-h-screen pt-navbar transition-all duration-200',
          collapsed ? 'pl-sidebar-collapsed' : 'pl-sidebar'
        )}
      >
        <div className="p-4 md:p-6 animate-fade-in">{children}</div>
      </main>
    </div>
  );
}

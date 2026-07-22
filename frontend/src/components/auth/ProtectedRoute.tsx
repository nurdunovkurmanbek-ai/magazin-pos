import { useEffect, useState, type ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import type { Permission } from '@magazin/shared';
import { usePermissions } from '@/hooks/usePermissions';

function FullPageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

/**
 * Persist hydrate + токен текшерүү аяктаганга чейин күтөт.
 * Биринчи ачылышта redirect loop болбошу үчүн керек.
 */
export function AuthInitializer({ children }: { children: ReactNode }) {
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const clearSession = useAuthStore((s) => s.clearSession);
  const [ready, setReady] = useState(() => useAuthStore.persist.hasHydrated());

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        clearSession();
        if (!cancelled) setReady(true);
        return;
      }

      try {
        await fetchMe();
      } finally {
        if (!cancelled) setReady(true);
      }
    };

    const start = () => {
      void bootstrap();
    };

    if (useAuthStore.persist.hasHydrated()) {
      start();
    } else {
      const unsub = useAuthStore.persist.onFinishHydration(() => {
        start();
      });
      return () => {
        cancelled = true;
        unsub();
      };
    }

    return () => {
      cancelled = true;
    };
  }, [fetchMe, clearSession]);

  if (!ready) return <FullPageLoader />;
  return <>{children}</>;
}

/** Аутентификация талап кылынат */
export function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const user = useAuthStore((s) => s.user);
  const accessToken = localStorage.getItem('accessToken');

  if (isLoading) return <FullPageLoader />;

  if (!isAuthenticated || !user || !accessToken) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

/** Конок маршруттары */
export function GuestRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const accessToken = localStorage.getItem('accessToken');

  if (isAuthenticated && user && accessToken) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

/** Уруксат негизинде коргоо */
export function PermissionRoute({
  permission,
  permissions,
  requireAll = false,
  fallback = '/login',
}: {
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
  fallback?: string;
}) {
  const user = useAuthStore((s) => s.user);
  const { canAny, canAll } = usePermissions();

  if (!user?.role) {
    return <Navigate to="/login" replace />;
  }

  const perms = permissions ?? (permission ? [permission] : []);
  if (perms.length === 0) return <Outlet />;

  const allowed = requireAll ? canAll(perms) : canAny(perms);
  if (!allowed) {
    return <Navigate to={fallback} replace />;
  }

  return <Outlet />;
}

/** Роль негизинде коргоо */
export function RoleRoute({
  roles,
  fallback = '/login',
}: {
  roles: import('@magazin/shared').UserRole[];
  fallback?: string;
}) {
  const user = useAuthStore((s) => s.user);

  if (!user?.role || !roles.includes(user.role)) {
    return <Navigate to={fallback} replace />;
  }

  return <Outlet />;
}

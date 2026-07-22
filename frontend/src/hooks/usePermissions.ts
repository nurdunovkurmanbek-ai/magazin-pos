import { useAuthStore } from '@/store/auth.store';
import type { Permission, UserRole } from '@magazin/shared';
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getPermissionsForRole,
} from '@magazin/shared';

/**
 * Уруксаттарды текшерүү hook
 */
export function usePermissions() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role;

  return {
    role,
    permissions: user?.permissions ?? [],
    can: (permission: Permission) => (role ? hasPermission(role, permission) : false),
    canAny: (permissions: Permission[]) =>
      role ? hasAnyPermission(role, permissions) : false,
    canAll: (permissions: Permission[]) =>
      role ? hasAllPermissions(role, permissions) : false,
    isRole: (...roles: UserRole[]) => (role ? roles.includes(role) : false),
    getRolePermissions: () => (role ? getPermissionsForRole(role) : []),
  };
}

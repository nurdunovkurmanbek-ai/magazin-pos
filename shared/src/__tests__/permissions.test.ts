import { describe, it, expect } from 'vitest';
import {
  UserRole,
  Permission,
  getPermissionsForRole,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
} from '../permissions';

describe('permissions', () => {
  it('admin has all permissions', () => {
    const perms = getPermissionsForRole(UserRole.ADMIN);
    expect(perms).toContain(Permission.SETTINGS_MANAGE);
    expect(perms).toContain(Permission.USERS_MANAGE);
    expect(perms.length).toBe(Object.values(Permission).length);
  });

  it('cashier can access POS but not settings', () => {
    expect(hasPermission(UserRole.CASHIER, Permission.POS_ACCESS)).toBe(true);
    expect(hasPermission(UserRole.CASHIER, Permission.SETTINGS_MANAGE)).toBe(false);
  });

  it('storekeeper can manage inventory', () => {
    expect(hasPermission(UserRole.STOREKEEPER, Permission.INVENTORY_MANAGE)).toBe(true);
    expect(hasPermission(UserRole.STOREKEEPER, Permission.REPORTS_FINANCIAL)).toBe(false);
  });

  it('accountant can view financial reports', () => {
    expect(hasPermission(UserRole.ACCOUNTANT, Permission.REPORTS_FINANCIAL)).toBe(true);
    expect(hasPermission(UserRole.ACCOUNTANT, Permission.POS_ACCESS)).toBe(false);
  });

  it('hasAnyPermission works', () => {
    expect(
      hasAnyPermission(UserRole.CASHIER, [Permission.SETTINGS_VIEW, Permission.POS_ACCESS])
    ).toBe(true);
    expect(
      hasAnyPermission(UserRole.CASHIER, [Permission.SETTINGS_VIEW, Permission.USERS_MANAGE])
    ).toBe(false);
  });

  it('hasAllPermissions works', () => {
    expect(
      hasAllPermissions(UserRole.ADMIN, [Permission.POS_ACCESS, Permission.SETTINGS_MANAGE])
    ).toBe(true);
    expect(
      hasAllPermissions(UserRole.CASHIER, [Permission.POS_ACCESS, Permission.SETTINGS_MANAGE])
    ).toBe(false);
  });
});

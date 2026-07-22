/**
 * Колдонуучу ролдору
 * Админ | Кассир | Кампачы | Бухгалтер
 */
export enum UserRole {
  ADMIN = 'ADMIN',
  CASHIER = 'CASHIER',
  STOREKEEPER = 'STOREKEEPER',
  ACCOUNTANT = 'ACCOUNTANT',
}

/**
 * Система уруксаттары — RBAC
 */
export enum Permission {
  DASHBOARD_VIEW = 'dashboard:view',

  POS_ACCESS = 'pos:access',
  POS_CREATE_SALE = 'pos:create_sale',
  POS_REFUND = 'pos:refund',

  PRODUCTS_VIEW = 'products:view',
  PRODUCTS_CREATE = 'products:create',
  PRODUCTS_EDIT = 'products:edit',
  PRODUCTS_DELETE = 'products:delete',

  CATEGORIES_VIEW = 'categories:view',
  CATEGORIES_MANAGE = 'categories:manage',

  INVENTORY_VIEW = 'inventory:view',
  INVENTORY_MANAGE = 'inventory:manage',

  SALES_VIEW = 'sales:view',
  SALES_VIEW_ALL = 'sales:view_all',
  SALES_EXPORT = 'sales:export',

  REPORTS_VIEW = 'reports:view',
  REPORTS_FINANCIAL = 'reports:financial',

  USERS_VIEW = 'users:view',
  USERS_MANAGE = 'users:manage',

  SETTINGS_VIEW = 'settings:view',
  SETTINGS_MANAGE = 'settings:manage',
}

/** Ар бир ролдун уруксаттары */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: Object.values(Permission),

  [UserRole.CASHIER]: [
    Permission.DASHBOARD_VIEW,
    Permission.POS_ACCESS,
    Permission.POS_CREATE_SALE,
    Permission.PRODUCTS_VIEW,
    Permission.CATEGORIES_VIEW,
    Permission.SALES_VIEW,
  ],

  [UserRole.STOREKEEPER]: [
    Permission.DASHBOARD_VIEW,
    Permission.PRODUCTS_VIEW,
    Permission.PRODUCTS_CREATE,
    Permission.PRODUCTS_EDIT,
    Permission.PRODUCTS_DELETE,
    Permission.CATEGORIES_VIEW,
    Permission.CATEGORIES_MANAGE,
    Permission.INVENTORY_VIEW,
    Permission.INVENTORY_MANAGE,
    Permission.SALES_VIEW,
    Permission.REPORTS_VIEW,
  ],

  [UserRole.ACCOUNTANT]: [
    Permission.DASHBOARD_VIEW,
    Permission.PRODUCTS_VIEW,
    Permission.CATEGORIES_VIEW,
    Permission.SALES_VIEW,
    Permission.SALES_VIEW_ALL,
    Permission.SALES_EXPORT,
    Permission.REPORTS_VIEW,
    Permission.REPORTS_FINANCIAL,
  ],
};

/** Роль үчүн уруксаттарды алуу */
export function getPermissionsForRole(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

/** Колдонуучунун уруксаты барбы текшерүү */
export function hasPermission(
  role: UserRole,
  permission: Permission
): boolean {
  return getPermissionsForRole(role).includes(permission);
}

/** Бир нече уруксаттардын бирөөсү барбы */
export function hasAnyPermission(
  role: UserRole,
  permissions: Permission[]
): boolean {
  const rolePerms = getPermissionsForRole(role);
  return permissions.some((p) => rolePerms.includes(p));
}

/** Бардык уруксаттар барбы */
export function hasAllPermissions(
  role: UserRole,
  permissions: Permission[]
): boolean {
  const rolePerms = getPermissionsForRole(role);
  return permissions.every((p) => rolePerms.includes(p));
}

/** Роль аталышы (i18n key) */
export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'roles.admin',
  [UserRole.CASHIER]: 'roles.cashier',
  [UserRole.STOREKEEPER]: 'roles.storekeeper',
  [UserRole.ACCOUNTANT]: 'roles.accountant',
};

/** Навигация пункттары үчүн талап кылынган уруксат */
export const NAV_PERMISSIONS: Record<string, Permission> = {
  dashboard: Permission.DASHBOARD_VIEW,
  pos: Permission.POS_ACCESS,
  products: Permission.PRODUCTS_VIEW,
  categories: Permission.CATEGORIES_VIEW,
  sales: Permission.SALES_VIEW,
  inventory: Permission.INVENTORY_VIEW,
  reports: Permission.REPORTS_VIEW,
  users: Permission.USERS_VIEW,
  settings: Permission.SETTINGS_VIEW,
};

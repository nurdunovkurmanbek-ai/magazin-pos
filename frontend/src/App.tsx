import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LocaleSync } from '@/components/layout/LocaleSync';
import { LoginPage } from '@/pages/LoginPage';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/ResetPasswordPage';
import { ProductsPage } from '@/pages/ProductsPage';
import { CategoriesPage } from '@/pages/CategoriesPage';
import { InventoryPage } from '@/pages/InventoryPage';
import { PosPage } from '@/pages/PosPage';
import { ProductPublicPage } from '@/pages/ProductPublicPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { DashboardPage } from '@/pages/DashboardPage';
import {
  AuthInitializer,
  ProtectedRoute,
  GuestRoute,
  PermissionRoute,
} from '@/components/auth/ProtectedRoute';
import { Permission } from '@magazin/shared';

export function AppRouter() {
  return (
    <BrowserRouter>
      <LocaleSync />
      <AuthInitializer>
        <Routes>
          {/* QR сканер — ачык барак */}
          <Route path="/p/:id" element={<ProductPublicPage />} />

          {/* Конок маршруттары */}
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
          </Route>

          {/* Корголгон маршруттар */}
          <Route element={<ProtectedRoute />}>
            <Route
              element={<PermissionRoute permission={Permission.DASHBOARD_VIEW} />}
            >
              <Route path="/" element={<DashboardPage />} />
            </Route>

            {/* Келечек барактар — уруксат менен корголот */}
            <Route
              element={<PermissionRoute permission={Permission.POS_ACCESS} />}
            >
              <Route path="/pos" element={<PosPage />} />
            </Route>
            <Route
              element={<PermissionRoute permission={Permission.CATEGORIES_VIEW} />}
            >
              <Route path="/categories" element={<CategoriesPage />} />
            </Route>
            <Route
              element={<PermissionRoute permission={Permission.PRODUCTS_VIEW} />}
            >
              <Route path="/products" element={<ProductsPage />} />
            </Route>
            <Route
              element={<PermissionRoute permission={Permission.INVENTORY_VIEW} />}
            >
              <Route path="/inventory" element={<InventoryPage />} />
            </Route>
            <Route
              element={<PermissionRoute permission={Permission.REPORTS_VIEW} />}
            >
              <Route path="/reports" element={<ReportsPage />} />
            </Route>
            <Route
              element={<PermissionRoute permission={Permission.SETTINGS_VIEW} />}
            >
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
            <Route
              element={<PermissionRoute permission={Permission.USERS_VIEW} />}
            >
              <Route path="/users" element={<DashboardPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthInitializer>
    </BrowserRouter>
  );
}

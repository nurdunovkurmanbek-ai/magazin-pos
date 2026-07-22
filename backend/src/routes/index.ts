import { Router } from 'express';
import { prisma } from '../config/database';
import authRoutes from '../modules/auth/auth.routes';
import dashboardRoutes from '../modules/dashboard/dashboard.routes';
import categoriesRoutes from '../modules/categories/categories.routes';
import productsRoutes from '../modules/products/products.routes';
import inventoryRoutes from '../modules/inventory/inventory.routes';
import salesRoutes from '../modules/sales/sales.routes';
import publicRoutes from '../modules/public/public.routes';
import financeRoutes from '../modules/finance/finance.routes';
import reportsRoutes from '../modules/reports/reports.routes';
import settingsRoutes from '../modules/settings/settings.routes';
import backupRoutes from '../modules/backup/backup.routes';

const router = Router();

router.use('/public', publicRoutes);
router.use('/finance', financeRoutes);
router.use('/reports', reportsRoutes);
router.use('/settings', settingsRoutes);
router.use('/backups', backupRoutes);
router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/categories', categoriesRoutes);
router.use('/products', productsRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/sales', salesRoutes);

/** Система статусу — база байланышын текшерет */
router.get('/health', async (_req, res) => {
  let dbStatus: 'ok' | 'error' = 'ok';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = 'error';
  }

  const healthy = dbStatus === 'ok';
  res.status(healthy ? 200 : 503).json({
    success: healthy,
    data: {
      status: healthy ? 'ok' : 'degraded',
      database: dbStatus,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    },
  });
});

export default router;

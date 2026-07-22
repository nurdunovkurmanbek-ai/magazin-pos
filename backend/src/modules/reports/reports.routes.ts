import { Router } from 'express';
import { ReportsController } from './reports.controller';
import { authenticate, requirePermission } from '../../middleware/authenticate';
import { Permission } from '@magazin/shared';

const router = Router();

router.use(authenticate);

router.get('/sales', requirePermission(Permission.REPORTS_VIEW), ReportsController.getSalesReport);
router.get('/products', requirePermission(Permission.REPORTS_VIEW), ReportsController.getProductsReport);
router.get('/employees', requirePermission(Permission.REPORTS_VIEW), ReportsController.getEmployeesReport);

export default router;

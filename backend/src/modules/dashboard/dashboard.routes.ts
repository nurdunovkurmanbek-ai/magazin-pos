import { Router } from 'express';
import { DashboardController } from './dashboard.controller';
import { authenticate } from '../../middleware/authenticate';
import { requirePermission } from '../../middleware/authenticate';
import { Permission } from '@magazin/shared';

const router = Router();

router.use(authenticate);
router.use(requirePermission(Permission.DASHBOARD_VIEW));

router.get('/stats', DashboardController.stats);
router.get('/charts', DashboardController.charts);

export default router;

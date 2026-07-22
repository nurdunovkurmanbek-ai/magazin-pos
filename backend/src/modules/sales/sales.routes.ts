import { Router } from 'express';
import { SalesController } from './sales.controller';
import { authenticate, requirePermission } from '../../middleware/authenticate';
import { Permission } from '@magazin/shared';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission(Permission.SALES_VIEW), SalesController.list);
router.get('/:id', requirePermission(Permission.SALES_VIEW), SalesController.getOne);
router.post('/', requirePermission(Permission.POS_CREATE_SALE), SalesController.create);

export default router;

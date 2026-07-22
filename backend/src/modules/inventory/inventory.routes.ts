import { Router } from 'express';
import { InventoryController } from './inventory.controller';
import { authenticate, requirePermission } from '../../middleware/authenticate';
import { Permission } from '@magazin/shared';

const router = Router();

router.use(authenticate);

router.get('/alerts', requirePermission(Permission.INVENTORY_VIEW), InventoryController.getAlerts);
router.get('/movements', requirePermission(Permission.INVENTORY_VIEW), InventoryController.getMovements);
router.post('/receipt', requirePermission(Permission.INVENTORY_MANAGE), InventoryController.receipt);
router.post('/write-off', requirePermission(Permission.INVENTORY_MANAGE), InventoryController.writeOff);

router.get('/counts', requirePermission(Permission.INVENTORY_VIEW), InventoryController.getCounts);
router.post('/counts', requirePermission(Permission.INVENTORY_MANAGE), InventoryController.createCount);
router.get('/counts/:id', requirePermission(Permission.INVENTORY_VIEW), InventoryController.getCount);
router.put('/counts/:id/items', requirePermission(Permission.INVENTORY_MANAGE), InventoryController.updateCountItems);
router.post('/counts/:id/complete', requirePermission(Permission.INVENTORY_MANAGE), InventoryController.completeCount);
router.delete('/counts/:id', requirePermission(Permission.INVENTORY_MANAGE), InventoryController.cancelCount);

export default router;

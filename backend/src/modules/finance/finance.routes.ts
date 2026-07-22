import { Router } from 'express';
import { FinanceController } from './finance.controller';
import { authenticate, requirePermission } from '../../middleware/authenticate';
import { Permission } from '@magazin/shared';

const router = Router();

router.use(authenticate);

router.get('/report', requirePermission(Permission.REPORTS_VIEW), FinanceController.getReport);

router.get('/expenses', requirePermission(Permission.REPORTS_VIEW), FinanceController.listExpenses);
router.post('/expenses', requirePermission(Permission.REPORTS_FINANCIAL), FinanceController.createExpense);
router.put('/expenses/:id', requirePermission(Permission.REPORTS_FINANCIAL), FinanceController.updateExpense);
router.delete('/expenses/:id', requirePermission(Permission.REPORTS_FINANCIAL), FinanceController.deleteExpense);

export default router;

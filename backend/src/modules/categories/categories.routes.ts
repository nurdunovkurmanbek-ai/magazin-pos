import { Router } from 'express';
import { CategoriesController } from './categories.controller';
import { authenticate, requirePermission } from '../../middleware/authenticate';
import { Permission } from '@magazin/shared';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission(Permission.CATEGORIES_VIEW), CategoriesController.list);
router.get('/:id', requirePermission(Permission.CATEGORIES_VIEW), CategoriesController.getOne);
router.post('/', requirePermission(Permission.CATEGORIES_MANAGE), CategoriesController.create);
router.put('/:id', requirePermission(Permission.CATEGORIES_MANAGE), CategoriesController.update);
router.delete('/:id', requirePermission(Permission.CATEGORIES_MANAGE), CategoriesController.remove);

export default router;

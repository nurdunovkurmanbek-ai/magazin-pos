import { Router } from 'express';
import { ProductsController } from './products.controller';
import { uploadProductImage } from './upload.middleware';
import { authenticate, requirePermission } from '../../middleware/authenticate';
import { Permission } from '@magazin/shared';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission(Permission.PRODUCTS_VIEW), ProductsController.list);
router.get('/barcode-lookup/:code', requirePermission(Permission.PRODUCTS_VIEW), ProductsController.lookupByBarcode);
router.get('/code/:code', requirePermission(Permission.PRODUCTS_VIEW), ProductsController.findByCode);
router.get('/:id', requirePermission(Permission.PRODUCTS_VIEW), ProductsController.getOne);
router.post('/', requirePermission(Permission.PRODUCTS_CREATE), ProductsController.create);
router.put('/:id', requirePermission(Permission.PRODUCTS_EDIT), ProductsController.update);
router.post(
  '/:id/image',
  requirePermission(Permission.PRODUCTS_EDIT),
  uploadProductImage.single('image'),
  ProductsController.uploadImage
);
router.delete('/:id', requirePermission(Permission.PRODUCTS_DELETE), ProductsController.remove);

export default router;

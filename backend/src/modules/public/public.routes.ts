import { Router } from 'express';
import { PublicController } from './public.controller';
import { optionalAuthenticate } from '../../middleware/optional-authenticate';

const router = Router();

router.use(optionalAuthenticate);

router.get('/products/scan/:code', PublicController.scanProduct);
router.get('/products/:id', PublicController.getProduct);

export default router;

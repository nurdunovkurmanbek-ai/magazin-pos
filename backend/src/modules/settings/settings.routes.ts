import { Router } from 'express';
import { SettingsController } from './settings.controller';
import { authenticate, requirePermission } from '../../middleware/authenticate';
import { uploadStoreLogo } from './settings.upload';
import { Permission } from '@magazin/shared';

const router = Router();

router.use(authenticate);

/** Бардык кирген колдонуучулар окуй алат (чек үчүн) */
router.get('/', SettingsController.get);

router.put('/', requirePermission(Permission.SETTINGS_MANAGE), SettingsController.update);
router.post(
  '/logo',
  requirePermission(Permission.SETTINGS_MANAGE),
  uploadStoreLogo.single('logo'),
  SettingsController.uploadLogo
);
router.delete('/logo', requirePermission(Permission.SETTINGS_MANAGE), SettingsController.removeLogo);

export default router;

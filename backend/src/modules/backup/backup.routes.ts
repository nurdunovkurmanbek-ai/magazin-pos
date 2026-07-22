import { Router } from 'express';
import { BackupController, uploadBackup } from './backup.controller';
import { authenticate, requirePermission } from '../../middleware/authenticate';
import { Permission } from '@magazin/shared';

const router = Router();

router.use(authenticate);
router.use(requirePermission(Permission.SETTINGS_MANAGE));

router.get('/', BackupController.list);
router.post('/', BackupController.create);
router.get('/:id/download', BackupController.download);
router.post('/:id/restore', BackupController.restore);
router.post('/upload-restore', uploadBackup.single('backup'), BackupController.uploadRestore);
router.delete('/:id', BackupController.remove);

export default router;

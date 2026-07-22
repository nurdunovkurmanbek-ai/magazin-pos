import { Request, Response, NextFunction } from 'express';
import path from 'path';
import multer from 'multer';
import fs from 'fs';
import { BackupService, BackupError } from './backup.service';
import { sendSuccess } from '../../utils/api-response';
import { BackupType } from '@magazin/shared';

const uploadDir = path.join(BackupService.getBackupDir(), '_uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const uploadBackup = multer({
  dest: uploadDir,
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/zip' || file.originalname.endsWith('.zip')) {
      cb(null, true);
    } else {
      cb(new Error('Жараксыз файл форматы. ZIP гана'));
    }
  },
});

export { uploadBackup };

export class BackupController {
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const [items, stats] = await Promise.all([
        BackupService.list(),
        BackupService.getStats(),
      ]);
      sendSuccess(res, { items, stats });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await BackupService.create(BackupType.MANUAL, req.user?.userId);
      sendSuccess(res, data, 'Backup түзүлдү');
    } catch (error) {
      next(error);
    }
  }

  static async download(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const record = (await BackupService.list()).find((b) => b.id === id);
      if (!record) throw new BackupError('Backup табылган жок', 404);
      const filePath = BackupService.getFilePath(record.filename);
      res.download(filePath, record.filename);
    } catch (error) {
      next(error);
    }
  }

  static async restore(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const record = (await BackupService.list()).find((b) => b.id === id);
      if (!record) throw new BackupError('Backup табылган жок', 404);
      await BackupService.restore(record.filename, req.user?.userId);
      sendSuccess(res, { restored: true }, 'Маалымат калыбына келтирилди');
    } catch (error) {
      next(error);
    }
  }

  static async uploadRestore(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, message: 'ZIP файлы талап кылынат' });
        return;
      }
      await BackupService.restoreFromUpload(req.file.path, req.user?.userId);
      fs.unlinkSync(req.file.path);
      sendSuccess(res, { restored: true }, 'Маалымат калыбына келтирилди');
    } catch (error) {
      if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      next(error);
    }
  }

  static async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await BackupService.remove(String(req.params.id));
      sendSuccess(res, { deleted: true }, 'Backup өчүрүлдү');
    } catch (error) {
      next(error);
    }
  }
}

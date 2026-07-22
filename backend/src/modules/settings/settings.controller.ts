import { Request, Response, NextFunction } from 'express';
import { SettingsService } from './settings.service';
import { storeSettingsSchema } from './settings.schema';
import { sendSuccess } from '../../utils/api-response';

export class SettingsController {
  static async get(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await SettingsService.get();
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = storeSettingsSchema.parse(req.body);
      const data = await SettingsService.update(input);
      sendSuccess(res, data, 'Жөндөөлөр сакталды');
    } catch (error) {
      next(error);
    }
  }

  static async uploadLogo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, message: 'Логотип файлы талап кылынат' });
        return;
      }
      const logoUrl = `/uploads/store/${req.file.filename}`;
      const data = await SettingsService.updateLogo(logoUrl);
      sendSuccess(res, data, 'Логотип жүктөлдү');
    } catch (error) {
      next(error);
    }
  }

  static async removeLogo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await SettingsService.removeLogo();
      sendSuccess(res, data, 'Логотип өчүрүлдү');
    } catch (error) {
      next(error);
    }
  }
}

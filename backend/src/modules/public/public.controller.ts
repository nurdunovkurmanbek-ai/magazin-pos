import { Request, Response, NextFunction } from 'express';
import { PublicService } from './public.service';
import { sendSuccess } from '../../utils/api-response';

export class PublicController {
  static async getProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const data = await PublicService.getProductById(id, req.user?.role);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  static async scanProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const code = String(req.params.code);
      const data = await PublicService.getProductByCode(code, req.user?.role);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }
}

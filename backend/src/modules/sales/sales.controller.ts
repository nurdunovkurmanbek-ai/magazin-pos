import { Request, Response, NextFunction } from 'express';
import { SalesService } from './sales.service';
import { createSaleSchema, saleQuerySchema, saleIdSchema } from './sales.schema';
import { sendSuccess, sendCreated } from '../../utils/api-response';

export class SalesController {
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = createSaleSchema.parse(req.body);
      const data = await SalesService.create(input, req.user!.userId);
      sendCreated(res, data, 'Сатуу ийгиликтүү');
    } catch (error) {
      next(error);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = saleQuerySchema.parse(req.query);
      const data = await SalesService.findAll(query);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  static async getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = saleIdSchema.parse(req.params);
      const data = await SalesService.findById(id);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }
}

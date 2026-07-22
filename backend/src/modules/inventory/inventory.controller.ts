import { Request, Response, NextFunction } from 'express';
import { InventoryService } from './inventory.service';
import {
  movementQuerySchema,
  receiptSchema,
  writeOffSchema,
  countQuerySchema,
  createCountSchema,
  updateCountItemsSchema,
  countIdSchema,
} from './inventory.schema';
import { sendSuccess, sendCreated, sendNoContent } from '../../utils/api-response';

export class InventoryController {
  static async getAlerts(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await InventoryService.getAlerts();
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  static async getMovements(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = movementQuerySchema.parse(req.query);
      const data = await InventoryService.getMovements(query);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  static async receipt(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = receiptSchema.parse(req.body);
      const data = await InventoryService.receipt(input, req.user!.userId);
      sendCreated(res, data, 'Товар кампага кошулду');
    } catch (error) {
      next(error);
    }
  }

  static async writeOff(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = writeOffSchema.parse(req.body);
      const data = await InventoryService.writeOff(input, req.user!.userId);
      sendCreated(res, data, 'Товар чыгарылды');
    } catch (error) {
      next(error);
    }
  }

  static async getCounts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = countQuerySchema.parse(req.query);
      const data = await InventoryService.getCounts(query);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  static async getCount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = countIdSchema.parse(req.params);
      const data = await InventoryService.getCountById(id);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  static async createCount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = createCountSchema.parse(req.body);
      const data = await InventoryService.createCount(input, req.user!.userId);
      sendCreated(res, data, 'Инвентаризация башталды');
    } catch (error) {
      next(error);
    }
  }

  static async updateCountItems(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = countIdSchema.parse(req.params);
      const input = updateCountItemsSchema.parse(req.body);
      const data = await InventoryService.updateCountItems(id, input);
      sendSuccess(res, data, 'Эсептөө жаңыланды');
    } catch (error) {
      next(error);
    }
  }

  static async completeCount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = countIdSchema.parse(req.params);
      const data = await InventoryService.completeCount(id, req.user!.userId);
      sendSuccess(res, data, 'Инвентаризация аяктады');
    } catch (error) {
      next(error);
    }
  }

  static async cancelCount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = countIdSchema.parse(req.params);
      await InventoryService.cancelCount(id);
      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  }
}

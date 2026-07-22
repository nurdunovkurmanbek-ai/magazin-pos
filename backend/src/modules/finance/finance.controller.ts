import { Request, Response, NextFunction } from 'express';
import { FinanceService } from './finance.service';
import { reportQuerySchema, expenseQuerySchema, expenseSchema, expenseIdSchema } from './finance.schema';
import { sendSuccess, sendCreated, sendNoContent } from '../../utils/api-response';

export class FinanceController {
  static async getReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { period, date } = reportQuerySchema.parse(req.query);
      const data = await FinanceService.getReport(period, date);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  static async listExpenses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = expenseQuerySchema.parse(req.query);
      const data = await FinanceService.getExpenses(query);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  static async createExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = expenseSchema.parse(req.body);
      const data = await FinanceService.createExpense(input, req.user!.userId);
      sendCreated(res, data, 'Чыгым кошулду');
    } catch (error) {
      next(error);
    }
  }

  static async updateExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = expenseIdSchema.parse(req.params);
      const input = expenseSchema.parse(req.body);
      const data = await FinanceService.updateExpense(id, input);
      sendSuccess(res, data, 'Чыгым жаңыланды');
    } catch (error) {
      next(error);
    }
  }

  static async deleteExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = expenseIdSchema.parse(req.params);
      await FinanceService.deleteExpense(id);
      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  }
}

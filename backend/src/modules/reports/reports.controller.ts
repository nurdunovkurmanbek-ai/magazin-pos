import { Request, Response, NextFunction } from 'express';
import { ReportsService } from './reports.service';
import { reportQuerySchema, productsReportQuerySchema } from './reports.schema';
import { sendSuccess } from '../../utils/api-response';

export class ReportsController {
  static async getSalesReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { period, date } = reportQuerySchema.parse(req.query);
      const data = await ReportsService.getSalesReport(period, date);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  static async getProductsReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { period, date, limit } = productsReportQuerySchema.parse(req.query);
      const data = await ReportsService.getProductsReport(period, date, limit);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  static async getEmployeesReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { period, date } = reportQuerySchema.parse(req.query);
      const data = await ReportsService.getEmployeesReport(period, date);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }
}

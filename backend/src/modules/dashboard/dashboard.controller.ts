import { Request, Response, NextFunction } from 'express';
import { DashboardService } from './dashboard.service';
import { sendSuccess } from '../../utils/api-response';

export class DashboardController {
  /** GET /dashboard/stats */
  static async stats(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await DashboardService.getStats();
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  /** GET /dashboard/charts */
  static async charts(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await DashboardService.getCharts();
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }
}

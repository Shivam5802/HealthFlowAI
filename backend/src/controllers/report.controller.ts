import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { reportService } from '../services/report.service.js';
import { sendSuccess } from '../utils/response.js';

export class ReportController {
  async getDailyReport(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const report = await reportService.getDailyReport(req.user!);
      sendSuccess(res, report, 'Daily resource intelligence report generated');
    } catch (error) {
      next(error);
    }
  }

  async getWeeklyReport(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const report = await reportService.getWeeklyReport(req.user!);
      sendSuccess(res, report, 'Weekly operational trend report generated');
    } catch (error) {
      next(error);
    }
  }
}

export const reportController = new ReportController();

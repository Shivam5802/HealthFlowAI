import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { alertService } from '../services/alert.service.js';
import { sendSuccess } from '../utils/response.js';

export class AlertController {
  async getAlerts(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const alerts = await alertService.getAlerts(req.query as any, req.user!);
      sendSuccess(res, alerts, 'Alerts retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getAlertById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const alert = await alertService.getAlertById(id, req.user!);
      sendSuccess(res, alert, 'Alert retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async createAlert(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const created = await alertService.createAlert(req.body, req.user!);
      sendSuccess(res, created, 'Alert generated successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateAlert(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const updated = await alertService.updateAlert(id, req.body, req.user!);
      sendSuccess(res, updated, 'Alert updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async resolveAlert(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const resolved = await alertService.resolveAlert(id, req.user!);
      sendSuccess(res, resolved, 'Alert marked as resolved');
    } catch (error) {
      next(error);
    }
  }
}

export const alertController = new AlertController();

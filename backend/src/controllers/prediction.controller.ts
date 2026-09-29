import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { predictionService } from '../services/prediction.service.js';
import { sendSuccess } from '../utils/response.js';

export class PredictionController {
  async getPredictions(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const facilityId = req.query.facilityId as string | undefined;
      const predictions = await predictionService.getPredictions(facilityId, req.user!);
      sendSuccess(res, predictions, 'Predictions retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getPredictionsByFacility(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const facilityId = req.params.facilityId as string;
      const predictions = await predictionService.getPredictionsByFacility(facilityId, req.user!);
      sendSuccess(res, predictions, 'Facility predictions retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getCriticalRisks(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const risks = await predictionService.getCriticalRisks(req.user!);
      sendSuccess(res, risks, 'Critical facility risks retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async runPredictions(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const facilityId = req.body?.facilityId as string | undefined;
      const result = await predictionService.runPredictions(facilityId, req.user!);
      sendSuccess(res, result, 'Prediction pipeline executed successfully', 201);
    } catch (error) {
      next(error);
    }
  }
}

export const predictionController = new PredictionController();

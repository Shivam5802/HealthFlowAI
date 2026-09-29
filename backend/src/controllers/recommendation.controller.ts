import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { recommendationService } from '../services/recommendation.service.js';
import { sendSuccess } from '../utils/response.js';

export class RecommendationController {
  async getRedistributionRecommendations(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const recommendations = await recommendationService.getRedistributionRecommendations();
      sendSuccess(res, recommendations, 'Resource redistribution recommendations calculated dynamically');
    } catch (error) {
      next(error);
    }
  }
}

export const recommendationController = new RecommendationController();

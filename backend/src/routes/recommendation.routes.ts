import { Router } from 'express';
import { recommendationController } from '../controllers/recommendation.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

// Get dynamic redistribution recommendations
router.get('/redistribution', (req, res, next) =>
  recommendationController.getRedistributionRecommendations(req, res, next)
);

// Backward-compatible fallback for root of namespace
router.get('/', (req, res, next) =>
  recommendationController.getRedistributionRecommendations(req, res, next)
);

export default router;

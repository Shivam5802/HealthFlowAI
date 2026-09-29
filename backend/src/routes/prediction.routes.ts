import { Router } from 'express';
import { predictionController } from '../controllers/prediction.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

// Get predictions (filtered or all in scope)
router.get('/', (req, res, next) => predictionController.getPredictions(req, res, next));

// Run prediction generation pipeline
router.post('/run', (req, res, next) => predictionController.runPredictions(req, res, next));

// Get predictions for specific facility
router.get('/:facilityId', (req, res, next) =>
  predictionController.getPredictionsByFacility(req, res, next)
);

export default router;

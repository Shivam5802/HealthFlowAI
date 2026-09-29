import { Router } from 'express';
import { riskController } from '../controllers/risk.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

// Get all evaluated risks with explainable reasons
router.get('/', (req, res, next) => riskController.getRisks(req, res, next));

// Get risk profile for a specific facility
router.get('/facility/:facilityId', (req, res, next) =>
  riskController.getFacilityRisks(req, res, next)
);

export default router;

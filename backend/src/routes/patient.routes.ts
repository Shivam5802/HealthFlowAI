import { Router } from 'express';
import { patientController } from '../controllers/patient.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createPatientDemandSchema } from '../validators/patient.validator.js';

const router = Router();
router.use(authenticate);

// Get patient demand history (supports from, to, facilityId query filters)
router.get('/demand', (req, res, next) => patientController.getDemand(req, res, next));

// Record patient demand count
router.post(
  '/demand',
  validate({ body: createPatientDemandSchema }),
  (req, res, next) => patientController.createDemand(req, res, next)
);

// Get patient demand by specific facilityId
router.get('/demand/:facilityId', (req, res, next) =>
  patientController.getDemandByFacility(req, res, next)
);

export default router;

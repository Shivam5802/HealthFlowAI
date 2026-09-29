import { Router } from 'express';
import { facilityController } from '../controllers/facility.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireRoles } from '../middleware/rbac.js';
import { requireFacilityAccess } from '../middleware/facilityAuth.js';
import { validate } from '../middleware/validate.js';
import { createFacilitySchema, updateFacilitySchema } from '../validators/facility.validator.js';

const router = Router();
router.use(authenticate);

// List facilities (Hospital Manager restricted to assigned, others see list)
router.get('/', (req, res, next) => facilityController.getFacilities(req, res, next));

// Get single facility
router.get(
  '/:id',
  requireFacilityAccess((req) => req.params.id as string),
  (req, res, next) => facilityController.getFacilityById(req, res, next)
);

// Admin-only mutations
router.post(
  '/',
  requireRoles('ADMIN'),
  validate({ body: createFacilitySchema }),
  (req, res, next) => facilityController.createFacility(req, res, next)
);

router.patch(
  '/:id',
  requireRoles('ADMIN'),
  validate({ body: updateFacilitySchema }),
  (req, res, next) => facilityController.updateFacility(req, res, next)
);

router.delete(
  '/:id',
  requireRoles('ADMIN'),
  (req, res, next) => facilityController.deleteFacility(req, res, next)
);

export default router;

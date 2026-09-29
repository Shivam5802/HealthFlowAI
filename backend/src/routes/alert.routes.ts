import { Router } from 'express';
import { alertController } from '../controllers/alert.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createAlertSchema, updateAlertSchema } from '../validators/alert.validator.js';

const router = Router();
router.use(authenticate);

// Get alerts (supports severity, status, facility, type filters)
router.get('/', (req, res, next) => alertController.getAlerts(req, res, next));

// Get single alert
router.get('/:id', (req, res, next) => alertController.getAlertById(req, res, next));

// Create alert
router.post(
  '/',
  validate({ body: createAlertSchema }),
  (req, res, next) => alertController.createAlert(req, res, next)
);

// Update alert parameters
router.patch(
  '/:id',
  validate({ body: updateAlertSchema }),
  (req, res, next) => alertController.updateAlert(req, res, next)
);

// Resolve alert
router.patch('/:id/resolve', (req, res, next) =>
  alertController.resolveAlert(req, res, next)
);

export default router;

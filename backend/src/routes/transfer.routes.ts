import { Router } from 'express';
import { transferController } from '../controllers/transfer.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createTransferSchema,
  updateTransferSchema,
  updateTransferStatusSchema,
} from '../validators/transfer.validator.js';

const router = Router();
router.use(authenticate);

// List transfers
router.get('/', (req, res, next) => transferController.getTransfers(req, res, next));

// Eligible transfer donor sources (sanitized without admin metrics)
router.get('/transfer-sources', (req, res, next) => transferController.getTransferSources(req, res, next));

// Get transfer by ID
router.get('/:id', (req, res, next) => transferController.getTransferById(req, res, next));

// Create transfer request
router.post(
  '/',
  validate({ body: createTransferSchema }),
  (req, res, next) => transferController.createTransfer(req, res, next)
);

// Update transfer parameters (when REQUESTED)
router.patch(
  '/:id',
  validate({ body: updateTransferSchema }),
  (req, res, next) => transferController.updateTransfer(req, res, next)
);

// Transition transfer status (REQUESTED -> APPROVED -> PACKED -> IN_TRANSIT -> DELIVERED)
router.patch(
  '/:id/status',
  validate({ body: updateTransferStatusSchema }),
  (req, res, next) => transferController.updateStatus(req, res, next)
);

export default router;

import { Router } from 'express';
import { userController } from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireRoles } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import {
  createEmployeeSchema,
  updateUserSchema,
  updateUserStatusSchema,
} from '../validators/user.validator.js';

const router = Router();
router.use(authenticate);

// Admin-only endpoints
router.post(
  '/',
  requireRoles('ADMIN'),
  validate({ body: createEmployeeSchema }),
  (req, res, next) => userController.createEmployee(req, res, next)
);

router.get('/', requireRoles('ADMIN'), (req, res, next) =>
  userController.getAllUsers(req, res, next)
);

// Get user profile by ID (Admin or self)
router.get('/:id', (req, res, next) =>
  userController.getUserById(req, res, next)
);

// Admin update user
router.patch(
  '/:id',
  requireRoles('ADMIN'),
  validate({ body: updateUserSchema }),
  (req, res, next) => userController.updateUser(req, res, next)
);

// Admin change user status
router.patch(
  '/:id/status',
  requireRoles('ADMIN'),
  validate({ body: updateUserStatusSchema }),
  (req, res, next) => userController.updateUserStatus(req, res, next)
);

export default router;

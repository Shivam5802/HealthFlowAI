import { Router } from 'express';
import { auditRepository } from '../repositories/audit.repository.js';
import { authenticate } from '../middleware/auth.js';
import { requireRoles } from '../middleware/rbac.js';
import { sendSuccess } from '../utils/response.js';

const router = Router();
router.use(authenticate, requireRoles('ADMIN'));

router.get('/', async (req, res, next) => {
  try {
    const { action, entityType, userId, limit } = req.query as {
      action?: string;
      entityType?: string;
      userId?: string;
      limit?: string;
    };

    const logs = await auditRepository.findAll({
      action,
      entityType,
      userId,
      limit: limit ? parseInt(limit, 10) : 100,
    });

    sendSuccess(res, logs, 'Audit trail logs retrieved successfully');
  } catch (error) {
    next(error);
  }
});

export default router;

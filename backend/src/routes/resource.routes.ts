import { Router } from 'express';
import { resourceController } from '../controllers/resource.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireRoles } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { createResourceSchema, updateResourceSchema } from '../validators/resource.validator.js';

const router = Router();
router.use(authenticate);

router.get('/', (req, res, next) => resourceController.getResources(req, res, next));
router.get('/:id', (req, res, next) => resourceController.getResourceById(req, res, next));

router.post(
  '/',
  requireRoles('ADMIN'),
  validate({ body: createResourceSchema }),
  (req, res, next) => resourceController.createResource(req, res, next)
);

router.patch(
  '/:id',
  requireRoles('ADMIN'),
  validate({ body: updateResourceSchema }),
  (req, res, next) => resourceController.updateResource(req, res, next)
);

export default router;

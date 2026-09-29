import { Router } from 'express';
import { inventoryController } from '../controllers/inventory.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createInventorySchema,
  updateInventorySchema,
  updateStockSchema,
} from '../validators/inventory.validator.js';

const router = Router();
router.use(authenticate);

// Get inventory (all or filtered by facilityId query parameter)
router.get('/', (req, res, next) => inventoryController.getInventory(req, res, next));

// Get inventory item by ID
router.get('/:id', (req, res, next) => inventoryController.getInventoryById(req, res, next));

// Create new inventory line
router.post(
  '/',
  validate({ body: createInventorySchema }),
  (req, res, next) => inventoryController.createInventory(req, res, next)
);

// Update inventory item by ID
router.patch(
  '/:id',
  validate({ body: updateInventorySchema }),
  (req, res, next) => inventoryController.updateInventory(req, res, next)
);

// Centralized stock update endpoint (/api/inventory/update)
router.post(
  '/update',
  validate({ body: updateStockSchema }),
  (req, res, next) => inventoryController.updateStock(req, res, next)
);

// Delete inventory item
router.delete('/:id', (req, res, next) => inventoryController.deleteInventory(req, res, next));

export default router;

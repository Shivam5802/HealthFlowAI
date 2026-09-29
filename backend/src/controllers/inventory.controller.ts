import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { inventoryService } from '../services/inventory.service.js';
import { sendSuccess } from '../utils/response.js';

export class InventoryController {
  async getInventory(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const facilityId = req.query.facilityId as string | undefined;
      const inventory = await inventoryService.getInventory(facilityId, req.user!);
      sendSuccess(res, inventory, 'Inventory retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getInventoryById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const item = await inventoryService.getInventoryById(id, req.user!);
      sendSuccess(res, item, 'Inventory item retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async createInventory(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const created = await inventoryService.createInventory(req.body, req.user!);
      sendSuccess(res, created, 'Inventory item created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateInventory(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const updated = await inventoryService.updateInventoryById(id, req.body, req.user!);
      sendSuccess(res, updated, 'Inventory record updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async updateStock(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await inventoryService.updateStock(req.body, req.user!);
      sendSuccess(res, updated, 'Stock level updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async deleteInventory(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const result = await inventoryService.deleteInventory(id, req.user!);
      sendSuccess(res, result, 'Inventory record deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const inventoryController = new InventoryController();

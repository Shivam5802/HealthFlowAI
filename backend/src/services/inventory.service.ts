import { inventoryRepository } from '../repositories/inventory.repository.js';
import { auditRepository } from '../repositories/audit.repository.js';
import { riskEngineService } from './riskEngine.service.js';
import { AppError } from '../utils/response.js';
import { AuthenticatedUser } from '../types/index.js';
import { CreateInventoryInput, UpdateInventoryInput, UpdateStockInput } from '../validators/inventory.validator.js';

export class InventoryService {
  private augmentWithCalculatedRisk(inv: any) {
    const risk = riskEngineService.calculateRisk(
      inv.quantity,
      inv.dailyConsumption,
      inv.safetyStock
    );

    return {
      ...inv,
      daysRemaining: risk.daysRemaining,
      riskLevel: risk.riskLevel,
      riskReasons: risk.reasons,
      recommendedAction: risk.recommendedAction,
    };
  }

  async getInventory(facilityId: string | undefined, currentUser: AuthenticatedUser) {
    const targetFacilityId = currentUser.role === 'HOSPITAL_MANAGER' ? currentUser.facilityId : facilityId;

    if (!targetFacilityId && currentUser.role === 'HOSPITAL_MANAGER') {
      throw new AppError('Manager is not assigned to any facility', 400, 'NO_FACILITY_ASSIGNED');
    }

    if (currentUser.role === 'HOSPITAL_MANAGER' && facilityId && facilityId !== currentUser.facilityId) {
      throw new AppError('Access forbidden: Cannot access another facility inventory', 403, 'FACILITY_ACCESS_DENIED');
    }

    const items = targetFacilityId
      ? await inventoryRepository.findByFacility(targetFacilityId)
      : await inventoryRepository.findAll();

    return items.map((item) => this.augmentWithCalculatedRisk(item));
  }

  async getInventoryById(id: string, currentUser: AuthenticatedUser) {
    const item = await inventoryRepository.findById(id);
    if (!item) {
      throw new AppError('Inventory item not found', 404, 'NOT_FOUND');
    }

    if (currentUser.role === 'HOSPITAL_MANAGER' && item.facilityId !== currentUser.facilityId) {
      throw new AppError('Access forbidden: Cannot view another facility inventory', 403, 'FACILITY_ACCESS_DENIED');
    }

    return this.augmentWithCalculatedRisk(item);
  }

  async createInventory(input: CreateInventoryInput, currentUser: AuthenticatedUser) {
    if (currentUser.role === 'HOSPITAL_MANAGER' && currentUser.facilityId !== input.facilityId) {
      throw new AppError('Access forbidden: Cannot create inventory for another facility', 403, 'FACILITY_ACCESS_DENIED');
    }

    const existing = await inventoryRepository.findByFacilityAndResource(input.facilityId, input.resourceId);
    if (existing) {
      throw new AppError('An inventory record for this resource already exists in this facility. Use update instead.', 409, 'ALREADY_EXISTS');
    }

    const created = await inventoryRepository.create({
      facility: { connect: { id: input.facilityId } },
      resource: { connect: { id: input.resourceId } },
      quantity: input.quantity,
      dailyConsumption: input.dailyConsumption,
      safetyStock: input.safetyStock,
    });

    await auditRepository.log({
      userId: currentUser.id,
      action: 'UPDATE_INVENTORY',
      entityType: 'Inventory',
      entityId: created.id,
      metadata: { action: 'CREATE', facilityId: input.facilityId, resourceId: input.resourceId, quantity: input.quantity },
    });

    return this.augmentWithCalculatedRisk(created);
  }

  async updateInventoryById(id: string, input: UpdateInventoryInput, currentUser: AuthenticatedUser) {
    const item = await inventoryRepository.findById(id);
    if (!item) {
      throw new AppError('Inventory record not found', 404, 'NOT_FOUND');
    }

    if (currentUser.role === 'HOSPITAL_MANAGER' && item.facilityId !== currentUser.facilityId) {
      throw new AppError('Access forbidden: Cannot modify inventory for another facility', 403, 'FACILITY_ACCESS_DENIED');
    }

    const updated = await inventoryRepository.update(id, input);

    await auditRepository.log({
      userId: currentUser.id,
      action: 'UPDATE_INVENTORY',
      entityType: 'Inventory',
      entityId: id,
      metadata: { previousQuantity: item.quantity, newQuantity: input.quantity },
    });

    return this.augmentWithCalculatedRisk(updated);
  }

  async updateStock(input: UpdateStockInput, currentUser: AuthenticatedUser) {
    if (currentUser.role === 'HOSPITAL_MANAGER' && currentUser.facilityId !== input.facilityId) {
      throw new AppError('Access forbidden: You cannot modify stock for other facilities', 403, 'FACILITY_ACCESS_DENIED');
    }

    const updated = await inventoryRepository.upsert(input.facilityId, input.resourceId, {
      quantity: input.quantity,
      dailyConsumption: input.dailyConsumption,
      safetyStock: input.safetyStock,
    });

    await auditRepository.log({
      userId: currentUser.id,
      action: 'UPDATE_INVENTORY',
      entityType: 'Inventory',
      entityId: updated.id,
      metadata: {
        facilityId: input.facilityId,
        resourceId: input.resourceId,
        newQuantity: input.quantity,
      },
    });

    return this.augmentWithCalculatedRisk(updated);
  }

  async deleteInventory(id: string, currentUser: AuthenticatedUser) {
    if (currentUser.role !== 'ADMIN') {
      throw new AppError('Only administrators can remove inventory records from the platform', 403, 'FORBIDDEN');
    }

    const item = await inventoryRepository.findById(id);
    if (!item) {
      throw new AppError('Inventory record not found', 404, 'NOT_FOUND');
    }

    await inventoryRepository.delete(id);

    await auditRepository.log({
      userId: currentUser.id,
      action: 'UPDATE_INVENTORY',
      entityType: 'Inventory',
      entityId: id,
      metadata: { action: 'DELETE', facilityId: item.facilityId, resourceId: item.resourceId },
    });

    return { deleted: true, id };
  }
}

export const inventoryService = new InventoryService();

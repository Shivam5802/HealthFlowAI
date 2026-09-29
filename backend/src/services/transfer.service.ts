import { transferRepository } from '../repositories/transfer.repository.js';
import { facilityRepository } from '../repositories/facility.repository.js';
import { inventoryRepository } from '../repositories/inventory.repository.js';
import { auditRepository } from '../repositories/audit.repository.js';
import { AuthenticatedUser } from '../types/index.js';
import { AppError } from '../utils/response.js';
import { CreateTransferInput, UpdateTransferInput, UpdateTransferStatusInput } from '../validators/transfer.validator.js';
import { TransferStatus } from '@prisma/client';

export class TransferService {
  // Finite State Machine definition for valid transfer lifecycles
  private static readonly VALID_TRANSITIONS: Record<TransferStatus, TransferStatus[]> = {
    REQUESTED: ['APPROVED', 'CANCELLED'],
    APPROVED: ['PACKED', 'CANCELLED'],
    PACKED: ['IN_TRANSIT', 'CANCELLED'],
    IN_TRANSIT: ['DELIVERED'],
    DELIVERED: [], // Terminal state
    CANCELLED: [], // Terminal state
  };

  async getTransfers(facilityId: string | undefined, currentUser: AuthenticatedUser) {
    if (currentUser.role === 'HOSPITAL_MANAGER') {
      if (facilityId && facilityId !== currentUser.facilityId) {
        throw new AppError('Unauthorized: Cannot access transfers of another healthcare facility', 403, 'FACILITY_ACCESS_DENIED');
      }
      if (!currentUser.facilityId) return [];
      return transferRepository.findByFacility(currentUser.facilityId);
    }

    if (facilityId) {
      return transferRepository.findByFacility(facilityId);
    }

    return transferRepository.findAll();
  }

  async getTransferSources(currentUser: AuthenticatedUser) {
    const all = await facilityRepository.findAll();
    return all.facilities
      .filter((f) => f.status === 'ACTIVE' && f.id !== currentUser.facilityId)
      .map((f) => ({
        id: f.id,
        name: f.name,
        type: f.type,
        district: f.district,
      }));
  }

  async getTransferById(id: string, currentUser: AuthenticatedUser) {
    const transfer = await transferRepository.findById(id);
    if (!transfer) {
      throw new AppError('Transfer record not found', 404, 'NOT_FOUND');
    }

    if (currentUser.role === 'HOSPITAL_MANAGER') {
      if (
        currentUser.facilityId !== transfer.sourceFacilityId &&
        currentUser.facilityId !== transfer.destinationFacilityId
      ) {
        throw new AppError('Unauthorized: Access restricted to facility transfers', 403, 'FACILITY_ACCESS_DENIED');
      }
    }

    return transfer;
  }

  async createTransfer(input: CreateTransferInput, currentUser: AuthenticatedUser) {
    if (input.sourceFacilityId === input.destinationFacilityId) {
      throw new AppError('Source and destination facility cannot be identical', 400, 'INVALID_FACILITY_PAIR');
    }

    // Hospital Manager can only request transfers involving their assigned facility
    if (currentUser.role === 'HOSPITAL_MANAGER') {
      if (
        currentUser.facilityId !== input.destinationFacilityId &&
        currentUser.facilityId !== input.sourceFacilityId
      ) {
        throw new AppError(
          'Hospital managers can only request transfers concerning their assigned facility',
          403,
          'FORBIDDEN'
        );
      }
    }

    // Verify source facility stock availability
    const sourceInventory = await inventoryRepository.findByFacilityAndResource(
      input.sourceFacilityId,
      input.resourceId
    );

    if (!sourceInventory || sourceInventory.quantity < input.quantity) {
      throw new AppError(
        `Source facility does not hold sufficient stock for this transfer request. Available: ${sourceInventory?.quantity ?? 0}, Requested: ${input.quantity}`,
        400,
        'INSUFFICIENT_STOCK'
      );
    }

    const transfer = await transferRepository.create({
      sourceFacility: { connect: { id: input.sourceFacilityId } },
      destinationFacility: { connect: { id: input.destinationFacilityId } },
      resource: { connect: { id: input.resourceId } },
      quantity: input.quantity,
      priority: input.priority,
      status: 'REQUESTED',
      requester: { connect: { id: currentUser.id } },
    });

    await auditRepository.log({
      userId: currentUser.id,
      action: 'CREATE_TRANSFER',
      entityType: 'Transfer',
      entityId: transfer.id,
      metadata: {
        sourceFacilityId: input.sourceFacilityId,
        destinationFacilityId: input.destinationFacilityId,
        resourceId: input.resourceId,
        quantity: input.quantity,
        priority: input.priority,
      },
    });

    return transfer;
  }

  async updateTransfer(id: string, input: UpdateTransferInput, currentUser: AuthenticatedUser) {
    const transfer = await this.getTransferById(id, currentUser);

    if (transfer.status !== 'REQUESTED') {
      throw new AppError('Only transfers in REQUESTED status can be modified', 400, 'IMMUTABLE_TRANSFER');
    }

    const updated = await transferRepository.update(id, {
      ...(input.quantity ? { quantity: input.quantity } : {}),
      ...(input.priority ? { priority: input.priority } : {}),
      ...(input.eta ? { eta: new Date(input.eta) } : {}),
    });

    return updated;
  }

  async updateStatus(
    id: string,
    input: UpdateTransferStatusInput,
    currentUser: AuthenticatedUser
  ) {
    const transfer = await transferRepository.findById(id);
    if (!transfer) {
      throw new AppError('Transfer record not found', 404, 'NOT_FOUND');
    }

    // 1. Validate State Transition
    const allowed = TransferService.VALID_TRANSITIONS[transfer.status] || [];
    if (!allowed.includes(input.status)) {
      throw new AppError(
        `Invalid transfer state transition from '${transfer.status}' to '${input.status}'. Permitted transitions: [${allowed.join(', ')}]`,
        400,
        'INVALID_STATE_TRANSITION'
      );
    }

    // 2. Authorization Rules
    if (input.status === 'APPROVED' && currentUser.role === 'HOSPITAL_MANAGER') {
      throw new AppError('Only Supply Managers or System Administrators can approve resource transfers', 403, 'FORBIDDEN');
    }

    // 3. Status Action & Inventory Reconciliation
    if (input.status === 'DELIVERED') {
      // Re-check source stock before physical deduction
      const sourceInv = await inventoryRepository.findByFacilityAndResource(
        transfer.sourceFacilityId,
        transfer.resourceId
      );

      if (!sourceInv || sourceInv.quantity < transfer.quantity) {
        throw new AppError(
          'Source inventory insufficient to finalize delivery handover.',
          400,
          'INSUFFICIENT_STOCK'
        );
      }

      // Atomically decrement source and increment destination inventory
      await inventoryRepository.updateQuantity(
        transfer.sourceFacilityId,
        transfer.resourceId,
        -transfer.quantity
      );

      const destInv = await inventoryRepository.findByFacilityAndResource(transfer.destinationFacilityId, transfer.resourceId);
      const currentDestQty = destInv?.quantity ?? 0;
      await inventoryRepository.upsert(transfer.destinationFacilityId, transfer.resourceId, {
        quantity: currentDestQty + transfer.quantity,
      });
    }

    const updated = await transferRepository.updateStatus(
      id,
      input.status,
      input.status === 'APPROVED' ? currentUser.id : undefined
    );

    // Audit log
    await auditRepository.log({
      userId: currentUser.id,
      action: input.status === 'APPROVED' ? 'APPROVE_TRANSFER' : 'UPDATE_TRANSFER_STATUS',
      entityType: 'Transfer',
      entityId: id,
      metadata: {
        fromStatus: transfer.status,
        toStatus: input.status,
        note: input.note,
      },
    });

    return updated;
  }
}

export const transferService = new TransferService();

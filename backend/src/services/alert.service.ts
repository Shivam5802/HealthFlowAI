import { alertRepository } from '../repositories/alert.repository.js';
import { auditRepository } from '../repositories/audit.repository.js';
import { AuthenticatedUser } from '../types/index.js';
import { AppError } from '../utils/response.js';
import { CreateAlertInput, UpdateAlertInput, AlertQueryInput } from '../validators/alert.validator.js';
import { AlertStatus, AlertSeverity, AlertType } from '@prisma/client';

export class AlertService {
  async getAlerts(query: AlertQueryInput, currentUser: AuthenticatedUser) {
    let targetFacilityId = query.facilityId;

    if (currentUser.role === 'HOSPITAL_MANAGER') {
      if (query.facilityId && query.facilityId !== currentUser.facilityId) {
        throw new AppError('Forbidden: Cannot view alerts for another healthcare facility', 403, 'FACILITY_ACCESS_DENIED');
      }
      targetFacilityId = currentUser.facilityId || undefined;
    }

    if (currentUser.role === 'SUPPLY_MANAGER') {
      if (query.type === 'SYSTEM' || query.type === 'DEMAND_SURGE') {
        throw new AppError('Forbidden: Access to administrative system alerts is restricted', 403, 'FORBIDDEN');
      }
    }

    const alerts = await alertRepository.findAll({
      facilityId: targetFacilityId,
      severity: query.severity as AlertSeverity | undefined,
      status: query.status as AlertStatus | undefined,
      type: query.type as AlertType | undefined,
    });

    if (currentUser.role === 'SUPPLY_MANAGER') {
      const allowedSupplyTypes = new Set(['TRANSFER_REQUEST', 'TRANSFER_APPROVED', 'TRANSFER_COMPLETED', 'LOW_STOCK', 'STOCKOUT_RISK']);
      return alerts.filter((a) => allowedSupplyTypes.has(a.type));
    }

    return alerts;
  }

  async getAlertById(id: string, currentUser: AuthenticatedUser) {
    const alert = await alertRepository.findById(id);
    if (!alert) {
      throw new AppError('Alert not found', 404, 'NOT_FOUND');
    }

    if (currentUser.role === 'HOSPITAL_MANAGER' && alert.facilityId !== currentUser.facilityId) {
      throw new AppError('Forbidden: Access to this alert is restricted', 403, 'FACILITY_ACCESS_DENIED');
    }

    if (currentUser.role === 'SUPPLY_MANAGER' && (alert.type === 'SYSTEM' || alert.type === 'DEMAND_SURGE')) {
      throw new AppError('Forbidden: Access to administrative system alerts is restricted', 403, 'FORBIDDEN');
    }

    return alert;
  }

  async createAlert(input: CreateAlertInput, currentUser: AuthenticatedUser) {
    if (currentUser.role === 'HOSPITAL_MANAGER' && currentUser.facilityId !== input.facilityId) {
      throw new AppError('Forbidden: Cannot generate alerts for other facilities', 403, 'FACILITY_ACCESS_DENIED');
    }

    const created = await alertRepository.create({
      facility: { connect: { id: input.facilityId } },
      resource: input.resourceId ? { connect: { id: input.resourceId } } : undefined,
      type: input.type as AlertType,
      severity: input.severity as AlertSeverity,
      title: input.title,
      message: input.message,
      status: 'OPEN',
    });

    await auditRepository.log({
      userId: currentUser.id,
      action: 'CREATE_ALERT',
      entityType: 'Alert',
      entityId: created.id,
      metadata: { facilityId: input.facilityId, severity: input.severity, type: input.type },
    });

    return created;
  }

  async updateAlert(id: string, input: UpdateAlertInput, currentUser: AuthenticatedUser) {
    const alert = await this.getAlertById(id, currentUser);

    const updated = await alertRepository.update(id, {
      ...(input.status ? { status: input.status as AlertStatus } : {}),
      ...(input.title ? { title: input.title } : {}),
      ...(input.message ? { message: input.message } : {}),
      ...(input.severity ? { severity: input.severity as AlertSeverity } : {}),
      ...(input.status === 'RESOLVED' ? { resolvedAt: new Date() } : {}),
    });

    await auditRepository.log({
      userId: currentUser.id,
      action: input.status === 'RESOLVED' ? 'RESOLVE_ALERT' : 'UPDATE_ALERT',
      entityType: 'Alert',
      entityId: id,
      metadata: { changes: input },
    });

    return updated;
  }

  async resolveAlert(id: string, currentUser: AuthenticatedUser) {
    const alert = await this.getAlertById(id, currentUser);

    const resolved = await alertRepository.updateStatus(id, 'RESOLVED');

    await auditRepository.log({
      userId: currentUser.id,
      action: 'RESOLVE_ALERT',
      entityType: 'Alert',
      entityId: id,
      metadata: { previousStatus: alert.status, resolvedAt: new Date() },
    });

    return resolved;
  }
}

export const alertService = new AlertService();

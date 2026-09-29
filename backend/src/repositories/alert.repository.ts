import { prisma } from './prisma.js';
import { Alert, Prisma, AlertStatus, AlertSeverity, AlertType } from '@prisma/client';

export class AlertRepository {
  async findById(id: string): Promise<Alert | null> {
    return prisma.alert.findUnique({
      where: { id },
      include: {
        facility: true,
        resource: true,
      },
    });
  }

  async findByFacility(facilityId: string, status?: AlertStatus): Promise<Alert[]> {
    return prisma.alert.findMany({
      where: {
        facilityId,
        ...(status ? { status } : {}),
      },
      include: {
        resource: true,
        facility: { select: { id: true, name: true, district: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll(params?: {
    facilityId?: string;
    severity?: AlertSeverity;
    status?: AlertStatus;
    type?: AlertType;
    limit?: number;
  }): Promise<Alert[]> {
    return prisma.alert.findMany({
      where: {
        ...(params?.facilityId ? { facilityId: params.facilityId } : {}),
        ...(params?.severity ? { severity: params.severity } : {}),
        ...(params?.status ? { status: params.status } : {}),
        ...(params?.type ? { type: params.type } : {}),
      },
      include: {
        facility: { select: { id: true, name: true, district: true, type: true } },
        resource: true,
      },
      orderBy: { createdAt: 'desc' },
      take: params?.limit || 100,
    });
  }

  async create(data: Prisma.AlertCreateInput): Promise<Alert> {
    return prisma.alert.create({
      data,
      include: {
        facility: true,
        resource: true,
      },
    });
  }

  async update(id: string, data: Prisma.AlertUpdateInput): Promise<Alert> {
    return prisma.alert.update({
      where: { id },
      data,
      include: {
        facility: true,
        resource: true,
      },
    });
  }

  async updateStatus(id: string, status: AlertStatus): Promise<Alert> {
    return prisma.alert.update({
      where: { id },
      data: {
        status,
        ...(status === 'RESOLVED' ? { resolvedAt: new Date() } : {}),
      },
      include: {
        facility: true,
        resource: true,
      },
    });
  }

  async countActive(): Promise<number> {
    return prisma.alert.count({
      where: { status: { in: ['OPEN', 'ACKNOWLEDGED'] } },
    });
  }

  async count(filter?: Prisma.AlertWhereInput): Promise<number> {
    return prisma.alert.count({ where: filter });
  }
}

export const alertRepository = new AlertRepository();

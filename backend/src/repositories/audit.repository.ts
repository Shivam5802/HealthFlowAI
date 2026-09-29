import { prisma } from './prisma.js';
import { AuditLog, Prisma } from '@prisma/client';

export class AuditRepository {
  async log(data: {
    userId?: string;
    action: string;
    entityType: string;
    entityId?: string;
    metadata?: Prisma.InputJsonValue;
    ipAddress?: string;
  }): Promise<AuditLog> {
    return prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        metadata: data.metadata,
        ipAddress: data.ipAddress,
      },
    });
  }

  async findAll(params?: { userId?: string; action?: string; entityType?: string; limit?: number }): Promise<AuditLog[]> {
    return prisma.auditLog.findMany({
      where: {
        ...(params?.userId ? { userId: params.userId } : {}),
        ...(params?.action ? { action: params.action } : {}),
        ...(params?.entityType ? { entityType: params.entityType } : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            employeeId: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
      take: params?.limit || 100,
    });
  }

  async count(): Promise<number> {
    return prisma.auditLog.count();
  }
}

export const auditRepository = new AuditRepository();

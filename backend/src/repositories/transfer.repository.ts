import { prisma } from './prisma.js';
import { Transfer, Prisma, TransferStatus } from '@prisma/client';

export class TransferRepository {
  async findById(id: string): Promise<Transfer | null> {
    return prisma.transfer.findUnique({
      where: { id },
      include: {
        sourceFacility: true,
        destinationFacility: true,
        resource: true,
        requester: { select: { id: true, name: true, employeeId: true, role: true } },
        approver: { select: { id: true, name: true, employeeId: true, role: true } },
      },
    });
  }

  async findByFacility(facilityId: string, status?: TransferStatus): Promise<Transfer[]> {
    return prisma.transfer.findMany({
      where: {
        OR: [
          { sourceFacilityId: facilityId },
          { destinationFacilityId: facilityId },
        ],
        ...(status ? { status } : {}),
      },
      include: {
        sourceFacility: { select: { id: true, name: true, district: true } },
        destinationFacility: { select: { id: true, name: true, district: true } },
        resource: true,
        requester: { select: { id: true, name: true, employeeId: true } },
        approver: { select: { id: true, name: true, employeeId: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll(params?: {
    status?: TransferStatus;
    sourceFacilityId?: string;
    destinationFacilityId?: string;
    limit?: number;
  }): Promise<Transfer[]> {
    return prisma.transfer.findMany({
      where: {
        ...(params?.status ? { status: params.status } : {}),
        ...(params?.sourceFacilityId ? { sourceFacilityId: params.sourceFacilityId } : {}),
        ...(params?.destinationFacilityId ? { destinationFacilityId: params.destinationFacilityId } : {}),
      },
      include: {
        sourceFacility: { select: { id: true, name: true, district: true } },
        destinationFacility: { select: { id: true, name: true, district: true } },
        resource: true,
        requester: { select: { id: true, name: true, employeeId: true } },
        approver: { select: { id: true, name: true, employeeId: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: params?.limit || 100,
    });
  }

  async create(data: Prisma.TransferCreateInput): Promise<Transfer> {
    return prisma.transfer.create({
      data,
      include: {
        sourceFacility: true,
        destinationFacility: true,
        resource: true,
        requester: { select: { id: true, name: true, employeeId: true } },
      },
    });
  }

  async update(id: string, data: Prisma.TransferUpdateInput): Promise<Transfer> {
    return prisma.transfer.update({
      where: { id },
      data,
      include: {
        sourceFacility: true,
        destinationFacility: true,
        resource: true,
        requester: { select: { id: true, name: true, employeeId: true } },
        approver: { select: { id: true, name: true, employeeId: true } },
      },
    });
  }

  async updateStatus(
    id: string,
    status: TransferStatus,
    approvedBy?: string
  ): Promise<Transfer> {
    return prisma.transfer.update({
      where: { id },
      data: {
        status,
        ...(approvedBy ? { approvedBy } : {}),
      },
      include: {
        sourceFacility: true,
        destinationFacility: true,
        resource: true,
        requester: { select: { id: true, name: true, employeeId: true } },
        approver: { select: { id: true, name: true, employeeId: true } },
      },
    });
  }

  async count(filter?: Prisma.TransferWhereInput): Promise<number> {
    return prisma.transfer.count({ where: filter });
  }
}

export const transferRepository = new TransferRepository();

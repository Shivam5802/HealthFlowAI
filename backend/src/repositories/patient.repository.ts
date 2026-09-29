import { prisma } from './prisma.js';
import { PatientDemand, Prisma } from '@prisma/client';

export class PatientRepository {
  async create(data: Prisma.PatientDemandCreateInput): Promise<PatientDemand> {
    return prisma.patientDemand.create({
      data,
      include: {
        facility: {
          select: { id: true, name: true, district: true },
        },
      },
    });
  }

  async findByFacility(facilityId: string, limit = 90): Promise<PatientDemand[]> {
    return prisma.patientDemand.findMany({
      where: { facilityId },
      orderBy: { date: 'desc' },
      take: limit,
      include: {
        facility: {
          select: { id: true, name: true, district: true },
        },
      },
    });
  }

  async findByRange(params: {
    facilityId?: string;
    from?: Date;
    to?: Date;
    limit?: number;
  }): Promise<PatientDemand[]> {
    return prisma.patientDemand.findMany({
      where: {
        ...(params.facilityId ? { facilityId: params.facilityId } : {}),
        ...(params.from || params.to
          ? {
              date: {
                ...(params.from ? { gte: params.from } : {}),
                ...(params.to ? { lte: params.to } : {}),
              },
            }
          : {}),
      },
      include: {
        facility: {
          select: { id: true, name: true, district: true },
        },
      },
      orderBy: { date: 'desc' },
      take: params.limit || 100,
    });
  }

  async count(): Promise<number> {
    return prisma.patientDemand.count();
  }
}

export const patientRepository = new PatientRepository();

import { prisma } from './prisma.js';
import { Prediction, Prisma, RiskLevel } from '@prisma/client';

export type PredictionWithRelations = Prisma.PredictionGetPayload<{
  include: { resource: true; facility: true };
}>;

export class PredictionRepository {
  async findLatestByFacility(facilityId: string): Promise<PredictionWithRelations[]> {
    return prisma.prediction.findMany({
      where: { facilityId },
      include: {
        resource: true,
        facility: true,
      },
      orderBy: { predictionDate: 'desc' },
    });
  }

  async findByFacilityAndResource(facilityId: string, resourceId: string): Promise<PredictionWithRelations | null> {
    return prisma.prediction.findFirst({
      where: { facilityId, resourceId },
      include: {
        resource: true,
        facility: true,
      },
      orderBy: { predictionDate: 'desc' },
    });
  }

  async findHighRisk(limit = 20): Promise<PredictionWithRelations[]> {
    return prisma.prediction.findMany({
      where: {
        riskLevel: { in: ['HIGH', 'CRITICAL'] as RiskLevel[] },
      },
      include: {
        facility: true,
        resource: true,
      },
      orderBy: { predictedDailyDemand: 'desc' },
      take: limit,
    });
  }

  async findAll(params?: { facilityId?: string; riskLevel?: RiskLevel; limit?: number }): Promise<PredictionWithRelations[]> {
    return prisma.prediction.findMany({
      where: {
        ...(params?.facilityId ? { facilityId: params.facilityId } : {}),
        ...(params?.riskLevel ? { riskLevel: params.riskLevel } : {}),
      },
      include: {
        facility: true,
        resource: true,
      },
      orderBy: { predictionDate: 'desc' },
      take: params?.limit || 50,
    });
  }

  async create(data: Prisma.PredictionCreateInput): Promise<PredictionWithRelations> {
    return prisma.prediction.create({
      data,
      include: {
        resource: true,
        facility: true,
      },
    });
  }

  async count(): Promise<number> {
    return prisma.prediction.count();
  }
}

export const predictionRepository = new PredictionRepository();

import { prisma } from './prisma.js';
import { Facility, Prisma } from '@prisma/client';

export class FacilityRepository {
  async findById(id: string): Promise<Facility | null> {
    return prisma.facility.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            inventory: true,
            alerts: { where: { status: 'OPEN' } },
            predictions: true,
            users: true,
          },
        },
      },
    });
  }

  async findAll(params?: {
    search?: string;
    district?: string;
    state?: string;
    type?: Prisma.EnumFacilityTypeFilter['equals'];
    status?: Prisma.EnumFacilityStatusFilter['equals'];
    page?: number;
    limit?: number;
  }): Promise<{ facilities: Facility[]; total: number }> {
    const where: Prisma.FacilityWhereInput = {
      ...(params?.search
        ? {
            OR: [
              { name: { contains: params.search, mode: 'insensitive' } },
              { district: { contains: params.search, mode: 'insensitive' } },
              { address: { contains: params.search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(params?.district ? { district: { contains: params.district, mode: 'insensitive' } } : {}),
      ...(params?.state ? { state: { contains: params.state, mode: 'insensitive' } } : {}),
      ...(params?.type ? { type: params.type } : {}),
      ...(params?.status ? { status: params.status } : {}),
    };

    const take = params?.limit || 50;
    const skip = params?.page ? (params.page - 1) * take : 0;

    const [facilities, total] = await Promise.all([
      prisma.facility.findMany({
        where,
        include: {
          _count: {
            select: {
              inventory: true,
              alerts: { where: { status: 'OPEN' } },
              predictions: true,
            },
          },
        },
        orderBy: { name: 'asc' },
        take,
        skip,
      }),
      prisma.facility.count({ where }),
    ]);

    return { facilities, total };
  }

  async create(data: Prisma.FacilityCreateInput): Promise<Facility> {
    return prisma.facility.create({
      data,
    });
  }

  async update(id: string, data: Prisma.FacilityUpdateInput): Promise<Facility> {
    return prisma.facility.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Facility> {
    return prisma.facility.delete({
      where: { id },
    });
  }

  async count(filter?: Prisma.FacilityWhereInput): Promise<number> {
    return prisma.facility.count({ where: filter });
  }
}

export const facilityRepository = new FacilityRepository();

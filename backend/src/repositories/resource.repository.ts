import { prisma } from './prisma.js';
import { Resource, Prisma } from '@prisma/client';

export class ResourceRepository {
  async findById(id: string): Promise<Resource | null> {
    return prisma.resource.findUnique({
      where: { id },
    });
  }

  async findAll(filter?: { category?: Prisma.EnumResourceCategoryFilter['equals']; search?: string }): Promise<Resource[]> {
    return prisma.resource.findMany({
      where: {
        ...(filter?.category ? { category: filter.category } : {}),
        ...(filter?.search
          ? {
              OR: [
                { name: { contains: filter.search, mode: 'insensitive' } },
                { description: { contains: filter.search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { name: 'asc' },
    });
  }

  async create(data: Prisma.ResourceCreateInput): Promise<Resource> {
    return prisma.resource.create({
      data,
    });
  }

  async update(id: string, data: Prisma.ResourceUpdateInput): Promise<Resource> {
    return prisma.resource.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Resource> {
    return prisma.resource.delete({
      where: { id },
    });
  }

  async count(): Promise<number> {
    return prisma.resource.count();
  }
}

export const resourceRepository = new ResourceRepository();

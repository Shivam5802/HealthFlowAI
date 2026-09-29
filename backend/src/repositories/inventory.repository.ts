import { prisma } from './prisma.js';
import { Inventory, Prisma } from '@prisma/client';

export type InventoryWithRelations = Prisma.InventoryGetPayload<{
  include: { resource: true; facility: true };
}>;

export class InventoryRepository {
  async findById(id: string): Promise<InventoryWithRelations | null> {
    return prisma.inventory.findUnique({
      where: { id },
      include: {
        resource: true,
        facility: true,
      },
    });
  }

  async findByFacilityAndResource(facilityId: string, resourceId: string): Promise<InventoryWithRelations | null> {
    return prisma.inventory.findUnique({
      where: {
        facilityId_resourceId: {
          facilityId,
          resourceId,
        },
      },
      include: {
        resource: true,
        facility: true,
      },
    });
  }

  async findByFacility(facilityId: string): Promise<InventoryWithRelations[]> {
    return prisma.inventory.findMany({
      where: { facilityId },
      include: {
        resource: true,
        facility: true,
      },
      orderBy: { quantity: 'asc' },
    });
  }

  async findAll(filter?: { facilityId?: string; resourceId?: string }): Promise<InventoryWithRelations[]> {
    return prisma.inventory.findMany({
      where: {
        ...(filter?.facilityId ? { facilityId: filter.facilityId } : {}),
        ...(filter?.resourceId ? { resourceId: filter.resourceId } : {}),
      },
      include: {
        resource: true,
        facility: true,
      },
      orderBy: { lastUpdated: 'desc' },
    });
  }

  async create(data: Prisma.InventoryCreateInput): Promise<InventoryWithRelations> {
    return prisma.inventory.create({
      data,
      include: {
        resource: true,
        facility: true,
      },
    });
  }

  async update(id: string, data: Prisma.InventoryUpdateInput): Promise<InventoryWithRelations> {
    return prisma.inventory.update({
      where: { id },
      data: {
        ...data,
        lastUpdated: new Date(),
      },
      include: {
        resource: true,
        facility: true,
      },
    });
  }

  async upsert(
    facilityId: string,
    resourceId: string,
    data: {
      quantity: number;
      dailyConsumption?: number;
      safetyStock?: number;
    }
  ): Promise<InventoryWithRelations> {
    return prisma.inventory.upsert({
      where: {
        facilityId_resourceId: {
          facilityId,
          resourceId,
        },
      },
      update: {
        quantity: data.quantity,
        ...(data.dailyConsumption !== undefined ? { dailyConsumption: data.dailyConsumption } : {}),
        ...(data.safetyStock !== undefined ? { safetyStock: data.safetyStock } : {}),
        lastUpdated: new Date(),
      },
      create: {
        facility: { connect: { id: facilityId } },
        resource: { connect: { id: resourceId } },
        quantity: data.quantity,
        dailyConsumption: data.dailyConsumption ?? 0,
        safetyStock: data.safetyStock ?? 10,
        lastUpdated: new Date(),
      },
      include: {
        resource: true,
        facility: true,
      },
    });
  }

  async updateQuantity(facilityId: string, resourceId: string, delta: number): Promise<InventoryWithRelations> {
    return prisma.inventory.update({
      where: {
        facilityId_resourceId: {
          facilityId,
          resourceId,
        },
      },
      data: {
        quantity: {
          increment: delta,
        },
        lastUpdated: new Date(),
      },
      include: {
        resource: true,
        facility: true,
      },
    });
  }

  async delete(id: string): Promise<Inventory> {
    return prisma.inventory.delete({
      where: { id },
    });
  }

  async count(): Promise<number> {
    return prisma.inventory.count();
  }
}

export const inventoryRepository = new InventoryRepository();

import { resourceRepository } from '../repositories/resource.repository.js';
import { auditRepository } from '../repositories/audit.repository.js';
import { AppError } from '../utils/response.js';
import { AuthenticatedUser } from '../types/index.js';
import { CreateResourceInput, UpdateResourceInput } from '../validators/resource.validator.js';
import { Prisma } from '@prisma/client';

export class ResourceService {
  async getResources(params?: { category?: string; search?: string }) {
    return resourceRepository.findAll({
      category: params?.category as Prisma.EnumResourceCategoryFilter['equals'],
      search: params?.search,
    });
  }

  async getResourceById(id: string) {
    const resource = await resourceRepository.findById(id);
    if (!resource) {
      throw new AppError('Resource catalog entry not found', 404, 'NOT_FOUND');
    }
    return resource;
  }

  async createResource(adminUser: AuthenticatedUser, input: CreateResourceInput) {
    if (adminUser.role !== 'ADMIN') {
      throw new AppError('Only administrators can register new medical resources', 403, 'FORBIDDEN');
    }

    const created = await resourceRepository.create({
      name: input.name,
      category: input.category,
      unit: input.unit,
      description: input.description,
    });

    await auditRepository.log({
      userId: adminUser.id,
      action: 'RESOURCE_CREATED',
      entityType: 'Resource',
      entityId: created.id,
      metadata: { name: created.name, category: created.category },
    });

    return created;
  }

  async updateResource(adminUser: AuthenticatedUser, id: string, input: UpdateResourceInput) {
    if (adminUser.role !== 'ADMIN') {
      throw new AppError('Only administrators can update medical resource definitions', 403, 'FORBIDDEN');
    }

    const existing = await resourceRepository.findById(id);
    if (!existing) {
      throw new AppError('Resource not found', 404, 'NOT_FOUND');
    }

    const updated = await resourceRepository.update(id, input);

    await auditRepository.log({
      userId: adminUser.id,
      action: 'RESOURCE_UPDATED',
      entityType: 'Resource',
      entityId: id,
      metadata: { changes: input },
    });

    return updated;
  }
}

export const resourceService = new ResourceService();

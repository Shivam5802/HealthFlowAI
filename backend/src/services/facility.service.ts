import { facilityRepository } from '../repositories/facility.repository.js';
import { auditRepository } from '../repositories/audit.repository.js';
import { AppError } from '../utils/response.js';
import { AuthenticatedUser } from '../types/index.js';
import { CreateFacilityInput, UpdateFacilityInput, FacilityQueryInput } from '../validators/facility.validator.js';

export class FacilityService {
  async getFacilities(query: FacilityQueryInput, currentUser: AuthenticatedUser) {
    // If HOSPITAL_MANAGER, only return their assigned facility
    if (currentUser.role === 'HOSPITAL_MANAGER') {
      if (!currentUser.facilityId) {
        return { facilities: [], total: 0 };
      }
      const facility = await facilityRepository.findById(currentUser.facilityId);
      return { facilities: facility ? [facility] : [], total: facility ? 1 : 0 };
    }

    const page = query.page ? parseInt(query.page, 10) : 1;
    const limit = query.limit ? parseInt(query.limit, 10) : 50;

    return facilityRepository.findAll({
      search: query.search,
      district: query.district,
      state: query.state,
      type: query.type,
      status: query.status,
      page,
      limit,
    });
  }

  async getFacilityById(id: string, currentUser: AuthenticatedUser) {
    if (currentUser.role === 'HOSPITAL_MANAGER' && currentUser.facilityId !== id) {
      throw new AppError('Unauthorized: Access to this healthcare facility is restricted', 403, 'FACILITY_ACCESS_DENIED');
    }

    const facility = await facilityRepository.findById(id);
    if (!facility) {
      throw new AppError('Facility not found', 404, 'NOT_FOUND');
    }
    return facility;
  }

  async createFacility(adminUser: AuthenticatedUser, input: CreateFacilityInput) {
    if (adminUser.role !== 'ADMIN') {
      throw new AppError('Only administrators can register healthcare facilities', 403, 'FORBIDDEN');
    }

    const facility = await facilityRepository.create({
      name: input.name,
      type: input.type,
      address: input.address,
      district: input.district,
      state: input.state,
      latitude: input.latitude,
      longitude: input.longitude,
      status: input.status,
    });

    await auditRepository.log({
      userId: adminUser.id,
      action: 'FACILITY_CREATED',
      entityType: 'Facility',
      entityId: facility.id,
      metadata: { name: facility.name, type: facility.type, district: facility.district },
    });

    return facility;
  }

  async updateFacility(adminUser: AuthenticatedUser, id: string, input: UpdateFacilityInput) {
    if (adminUser.role !== 'ADMIN') {
      throw new AppError('Only administrators can modify facility master records', 403, 'FORBIDDEN');
    }

    const existing = await facilityRepository.findById(id);
    if (!existing) {
      throw new AppError('Facility not found', 404, 'NOT_FOUND');
    }

    const updated = await facilityRepository.update(id, input);

    await auditRepository.log({
      userId: adminUser.id,
      action: 'FACILITY_UPDATED',
      entityType: 'Facility',
      entityId: id,
      metadata: { changes: input },
    });

    return updated;
  }

  async deleteFacility(adminUser: AuthenticatedUser, id: string) {
    if (adminUser.role !== 'ADMIN') {
      throw new AppError('Only administrators can delete healthcare facilities', 403, 'FORBIDDEN');
    }

    const existing = await facilityRepository.findById(id);
    if (!existing) {
      throw new AppError('Facility not found', 404, 'NOT_FOUND');
    }

    await facilityRepository.delete(id);

    await auditRepository.log({
      userId: adminUser.id,
      action: 'FACILITY_DELETED',
      entityType: 'Facility',
      entityId: id,
      metadata: { name: existing.name },
    });

    return { deleted: true, id };
  }
}

export const facilityService = new FacilityService();

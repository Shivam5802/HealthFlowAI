import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { facilityService } from '../services/facility.service.js';
import { sendSuccess } from '../utils/response.js';

export class FacilityController {
  async getFacilities(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await facilityService.getFacilities(req.query as any, req.user!);
      sendSuccess(res, result.facilities, 'Facilities retrieved successfully', 200, { total: result.total });
    } catch (error) {
      next(error);
    }
  }

  async getFacilityById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const facility = await facilityService.getFacilityById(id, req.user!);
      sendSuccess(res, facility, 'Facility details retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async createFacility(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const facility = await facilityService.createFacility(req.user!, req.body);
      sendSuccess(res, facility, 'Facility registered successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateFacility(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const updated = await facilityService.updateFacility(req.user!, id, req.body);
      sendSuccess(res, updated, 'Facility details updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async deleteFacility(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const result = await facilityService.deleteFacility(req.user!, id);
      sendSuccess(res, result, 'Facility removed successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const facilityController = new FacilityController();

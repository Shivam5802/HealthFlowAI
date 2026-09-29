import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { patientRepository } from '../repositories/patient.repository.js';
import { sendSuccess } from '../utils/response.js';
import { AppError } from '../utils/response.js';

export class PatientController {
  async getDemand(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.user?.role === 'SUPPLY_MANAGER') {
        throw new AppError(
          'Forbidden: Clinical patient demand records are restricted to administrators and clinical facility staff',
          403,
          'FORBIDDEN'
        );
      }

      const { facilityId, from, to } = req.query as { facilityId?: string; from?: string; to?: string };

      if (req.user?.role === 'HOSPITAL_MANAGER') {
        if (facilityId && facilityId !== req.user.facilityId) {
          throw new AppError('Forbidden: Access to another facility demand data is restricted', 403, 'FACILITY_ACCESS_DENIED');
        }
      }

      const targetFacilityId = req.user?.role === 'HOSPITAL_MANAGER' ? req.user.facilityId || undefined : facilityId;

      const fromDate = from ? new Date(from) : undefined;
      const toDate = to ? new Date(to) : undefined;

      const demands = await patientRepository.findByRange({
        facilityId: targetFacilityId,
        from: fromDate,
        to: toDate,
      });

      sendSuccess(res, demands, 'Patient demand data retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getDemandByFacility(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.user?.role === 'SUPPLY_MANAGER') {
        throw new AppError(
          'Forbidden: Clinical patient demand records are restricted to administrators and clinical facility staff',
          403,
          'FORBIDDEN'
        );
      }

      const facilityId = req.params.facilityId as string;

      if (req.user?.role === 'HOSPITAL_MANAGER' && facilityId !== req.user.facilityId) {
        throw new AppError('Forbidden: Access to another facility demand data is restricted', 403, 'FACILITY_ACCESS_DENIED');
      }

      const demands = await patientRepository.findByFacility(facilityId, 90);
      sendSuccess(res, demands, 'Facility historical patient demand retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async createDemand(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.user?.role === 'SUPPLY_MANAGER') {
        throw new AppError('Forbidden: Supply Managers cannot record clinical patient admissions', 403, 'FORBIDDEN');
      }

      const { facilityId, date, patientCount, department } = req.body;

      if (req.user?.role === 'HOSPITAL_MANAGER' && facilityId !== req.user.facilityId) {
        throw new AppError('Forbidden: Cannot record demand for another facility', 403, 'FACILITY_ACCESS_DENIED');
      }

      const created = await patientRepository.create({
        facility: { connect: { id: facilityId } },
        date: new Date(date),
        patientCount: parseInt(patientCount, 10),
        department,
      });

      sendSuccess(res, created, 'Patient demand record registered successfully', 201);
    } catch (error) {
      next(error);
    }
  }
}

export const patientController = new PatientController();

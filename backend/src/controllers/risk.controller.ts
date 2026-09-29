import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { inventoryRepository } from '../repositories/inventory.repository.js';
import { riskEngineService } from '../services/riskEngine.service.js';
import { sendSuccess } from '../utils/response.js';
import { AppError } from '../utils/response.js';

export class RiskController {
  async getRisks(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.user?.role === 'SUPPLY_MANAGER') {
        throw new AppError(
          'Forbidden: Network clinical risk assessments are restricted to Administrators. Supply Managers should review resource inventories and transfer requests.',
          403,
          'FORBIDDEN'
        );
      }

      if (req.user?.role === 'HOSPITAL_MANAGER') {
        if (req.query.facilityId && req.query.facilityId !== req.user.facilityId) {
          throw new AppError('Forbidden: Access to another facility risk profile is denied', 403, 'FACILITY_ACCESS_DENIED');
        }
      }

      const facilityId = (req.user?.role === 'HOSPITAL_MANAGER' ? req.user.facilityId : req.query.facilityId) as string | undefined;

      const inventories = facilityId
        ? await inventoryRepository.findByFacility(facilityId)
        : await inventoryRepository.findAll();

      const risks = inventories.map((inv) => {
        const calculated = riskEngineService.calculateRisk(
          inv.quantity,
          inv.dailyConsumption,
          inv.safetyStock
        );

        const predictedStockoutDate =
          calculated.daysRemaining < 365 && inv.dailyConsumption > 0
            ? new Date(Date.now() + calculated.daysRemaining * 24 * 60 * 60 * 1000).toISOString()
            : null;

        return {
          inventoryId: inv.id,
          facilityId: inv.facilityId,
          facilityName: inv.facility?.name || 'Healthcare Facility',
          district: (inv.facility as any)?.district || 'Central District',
          resourceId: inv.resourceId,
          resourceName: inv.resource?.name || 'Resource',
          resourceCategory: inv.resource?.category || 'MEDICINE',
          currentQuantity: inv.quantity,
          dailyConsumption: inv.dailyConsumption,
          safetyStock: inv.safetyStock,
          daysRemaining: calculated.daysRemaining,
          riskLevel: calculated.riskLevel,
          reasons: calculated.reasons,
          predictedStockoutDate,
          recommendedAction: calculated.recommendedAction,
        };
      });

      sendSuccess(res, risks, 'Resource risk assessments generated successfully');
    } catch (error) {
      next(error);
    }
  }

  async getFacilityRisks(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.user?.role === 'SUPPLY_MANAGER') {
        throw new AppError(
          'Forbidden: Facility clinical risk profiles are restricted to Administrators and local Facility Managers',
          403,
          'FORBIDDEN'
        );
      }

      const facilityId = req.params.facilityId as string;

      if (req.user?.role === 'HOSPITAL_MANAGER' && facilityId !== req.user.facilityId) {
        throw new AppError('Forbidden: Access to another facility risk profile is denied', 403, 'FACILITY_ACCESS_DENIED');
      }

      const inventories = await inventoryRepository.findByFacility(facilityId);

      const risks = inventories.map((inv) => {
        const calculated = riskEngineService.calculateRisk(
          inv.quantity,
          inv.dailyConsumption,
          inv.safetyStock
        );

        const predictedStockoutDate =
          calculated.daysRemaining < 365 && inv.dailyConsumption > 0
            ? new Date(Date.now() + calculated.daysRemaining * 24 * 60 * 60 * 1000).toISOString()
            : null;

        return {
          inventoryId: inv.id,
          facilityId: inv.facilityId,
          facilityName: inv.facility?.name || 'Facility',
          resourceId: inv.resourceId,
          resourceName: inv.resource?.name || 'Resource',
          currentQuantity: inv.quantity,
          dailyConsumption: inv.dailyConsumption,
          safetyStock: inv.safetyStock,
          daysRemaining: calculated.daysRemaining,
          riskLevel: calculated.riskLevel,
          reasons: calculated.reasons,
          predictedStockoutDate,
          recommendedAction: calculated.recommendedAction,
        };
      });

      sendSuccess(res, risks, 'Facility resource risks retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const riskController = new RiskController();

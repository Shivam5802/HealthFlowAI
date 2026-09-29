import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { AppError } from '../utils/response.js';

export type FacilityIdExtractor = (req: AuthenticatedRequest) => string | undefined;

/**
 * Enforces Facility-Level Isolation:
 * - ADMIN: Unrestricted access across all facilities
 * - HOSPITAL_MANAGER: Strictly confined to their assigned facilityId
 * - SUPPLY_MANAGER: Authorized if query/action pertains to supply redistribution or if given explicit scope
 */
export const requireFacilityAccess = (
  extractFacilityId: FacilityIdExtractor = (req) =>
    (req.params.facilityId || req.query.facilityId || req.body?.facilityId) as string | undefined
) => {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    const user = req.user;

    if (!user) {
      return next(new AppError('User not authenticated', 401, 'UNAUTHORIZED'));
    }

    // Admins bypass facility isolation
    if (user.role === 'ADMIN') {
      return next();
    }

    const targetFacilityId = extractFacilityId(req);

    // If targetFacilityId is not specified in the request, proceed (service layer will filter by user.facilityId)
    if (!targetFacilityId) {
      return next();
    }

    if (user.role === 'HOSPITAL_MANAGER') {
      if (!user.facilityId || user.facilityId !== targetFacilityId) {
        return next(
          new AppError(
            'Unauthorized: You are not authorized to view or modify resources for other healthcare facilities.',
            403,
            'FACILITY_ACCESS_DENIED'
          )
        );
      }
    }

    // Supply Manager can view cross-facility supply data for transfers, but cannot modify arbitrary facility master config
    if (user.role === 'SUPPLY_MANAGER') {
      const isModifyingFacilityConfig = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method) && 
        req.baseUrl.includes('/facilities');

      if (isModifyingFacilityConfig) {
        return next(
          new AppError(
            'Unauthorized: Supply Managers cannot modify facility configurations',
            403,
            'FORBIDDEN'
          )
        );
      }
    }

    next();
  };
};

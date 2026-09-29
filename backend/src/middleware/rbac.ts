import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, UserRole } from '../types/index.js';
import { AppError } from '../utils/response.js';

/**
 * Enforces Role-Based Access Control (RBAC)
 * Allows execution only if user's role is in the allowedRoles list.
 */
export const requireRoles = (...allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('User not authenticated', 401, 'UNAUTHORIZED'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access forbidden: Requires role ${allowedRoles.join(' or ')}. Your role is ${req.user.role}`,
          403,
          'FORBIDDEN'
        )
      );
    }

    next();
  };
};

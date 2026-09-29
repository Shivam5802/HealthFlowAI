import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, AuthenticatedUser } from '../types/index.js';
import { verifyToken } from '../utils/security.js';
import { AppError } from '../utils/response.js';
import { prisma } from '../repositories/prisma.js';

export const authenticate = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication token is required', 401, 'UNAUTHORIZED');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new AppError('Authentication token is missing', 401, 'UNAUTHORIZED');
    }

    const decoded = verifyToken(token);
    
    // Check if user still exists and is active in database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        facilityId: true,
        employeeId: true,
        status: true,
        mustChangePassword: true,
      },
    });

    if (!user) {
      throw new AppError('User belonging to this token no longer exists', 401, 'USER_NOT_FOUND');
    }

    if (user.status !== 'ACTIVE') {
      throw new AppError('User account is currently inactive or suspended', 403, 'ACCOUNT_SUSPENDED');
    }

    req.user = user as AuthenticatedUser;
    next();
  } catch (error) {
    next(error);
  }
};

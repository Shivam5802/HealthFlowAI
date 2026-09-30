import { userRepository } from '../repositories/user.repository.js';
import { auditRepository } from '../repositories/audit.repository.js';
import { comparePassword, hashPassword, generateToken } from '../utils/security.js';
import { AppError } from '../utils/response.js';
import { AuthenticatedUser } from '../types/index.js';

export class AuthService {
  async login(identifier: string, password: string): Promise<{ token: string; user: AuthenticatedUser }> {
    const cleanId = (identifier || '').trim();
    let user = await userRepository.findByEmail(cleanId.toLowerCase());
    if (!user) {
      user = await userRepository.findByEmployeeId(cleanId.toUpperCase());
    }
    if (!user) {
      user = await userRepository.findByEmail(cleanId);
    }
    if (!user) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    if (user.status !== 'ACTIVE') {
      throw new AppError('Account is inactive or suspended. Please contact administrator.', 403, 'ACCOUNT_INACTIVE');
    }

    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      facilityId: user.facilityId,
      employeeId: user.employeeId,
    });

    await auditRepository.log({
      userId: user.id,
      action: 'USER_LOGIN',
      entityType: 'User',
      entityId: user.id,
      metadata: { role: user.role, employeeId: user.employeeId },
    });

    // Sanitized user object (never return passwordHash)
    const sanitizedUser: AuthenticatedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      facilityId: user.facilityId,
      employeeId: user.employeeId,
      status: user.status,
      mustChangePassword: user.mustChangePassword,
    };

    return { token, user: sanitizedUser };
  }

  async getMe(userId: string): Promise<AuthenticatedUser> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      facilityId: user.facilityId,
      employeeId: user.employeeId,
      status: user.status,
      mustChangePassword: user.mustChangePassword,
    };
  }

  async changePassword(userId: string, currentPass: string, newPass: string): Promise<void> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const isValid = await comparePassword(currentPass, user.passwordHash);
    if (!isValid) {
      throw new AppError('Current password provided is incorrect', 400, 'INVALID_PASSWORD');
    }

    const newHash = await hashPassword(newPass);
    await userRepository.update(userId, {
      passwordHash: newHash,
      mustChangePassword: false,
    });

    await auditRepository.log({
      userId: user.id,
      action: 'PASSWORD_CHANGED',
      entityType: 'User',
      entityId: user.id,
    });
  }
}

export const authService = new AuthService();

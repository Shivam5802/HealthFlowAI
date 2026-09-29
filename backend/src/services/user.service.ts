import { userRepository } from '../repositories/user.repository.js';
import { facilityRepository } from '../repositories/facility.repository.js';
import { auditRepository } from '../repositories/audit.repository.js';
import { hashPassword, generateEmployeeId } from '../utils/security.js';
import { AppError } from '../utils/response.js';
import { AuthenticatedUser, UserRole, UserStatus } from '../types/index.js';
import { CreateEmployeeInput, UpdateUserInput } from '../validators/user.validator.js';
import crypto from 'crypto';

export class UserService {
  async createEmployee(adminUser: AuthenticatedUser, input: CreateEmployeeInput) {
    if (adminUser.role !== 'ADMIN') {
      throw new AppError('Only system Administrators can provision employee accounts', 403, 'FORBIDDEN');
    }

    const existingEmail = await userRepository.findByEmail(input.email);
    if (existingEmail) {
      throw new AppError('An account with this email address already exists', 409, 'EMAIL_EXISTS');
    }

    if (input.role === 'HOSPITAL_MANAGER') {
      if (!input.facilityId) {
        throw new AppError('Hospital Managers must be assigned to an active facility', 400, 'FACILITY_REQUIRED');
      }
      const facility = await facilityRepository.findById(input.facilityId);
      if (!facility) {
        throw new AppError('Specified facility does not exist', 404, 'FACILITY_NOT_FOUND');
      }
    }

    // Auto-generate employee sequence
    const userCount = await userRepository.count();
    const employeeId = generateEmployeeId(1000 + userCount + 1);

    // Generate or use temporary password
    const temporaryPassword = input.temporaryPassword || `Temp@${crypto.randomBytes(3).toString('hex')}1`;
    const passwordHash = await hashPassword(temporaryPassword);

    const user = await userRepository.create({
      name: input.name,
      email: input.email.toLowerCase(),
      passwordHash,
      role: input.role as UserRole,
      facility: input.facilityId ? { connect: { id: input.facilityId } } : undefined,
      employeeId,
      status: 'ACTIVE',
      mustChangePassword: true,
    });

    await auditRepository.log({
      userId: adminUser.id,
      action: 'CREATE_USER',
      entityType: 'User',
      entityId: user.id,
      metadata: {
        createdEmployeeId: employeeId,
        role: user.role,
        facilityId: user.facilityId,
      },
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      facilityId: user.facilityId,
      employeeId: user.employeeId,
      status: user.status,
      mustChangePassword: user.mustChangePassword,
      temporaryPassword, // Returned once so admin can securely hand it over
      createdAt: user.createdAt,
    };
  }

  async getAllUsers(currentUser: AuthenticatedUser) {
    if (currentUser.role !== 'ADMIN') {
      throw new AppError('Access restricted to administrators', 403, 'FORBIDDEN');
    }

    const users = await userRepository.findAll();
    return users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      facilityId: u.facilityId,
      facility: u.facility,
      employeeId: u.employeeId,
      status: u.status,
      mustChangePassword: u.mustChangePassword,
      createdAt: u.createdAt,
    }));
  }

  async getUserById(id: string, currentUser: AuthenticatedUser) {
    if (currentUser.role !== 'ADMIN' && currentUser.id !== id) {
      throw new AppError('Access forbidden: You can only view your own user account', 403, 'FORBIDDEN');
    }

    const user = await userRepository.findById(id);
    if (!user) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      facilityId: user.facilityId,
      facility: user.facility,
      employeeId: user.employeeId,
      status: user.status,
      mustChangePassword: user.mustChangePassword,
      createdAt: user.createdAt,
    };
  }

  async updateUser(id: string, input: UpdateUserInput, currentUser: AuthenticatedUser) {
    if (currentUser.role !== 'ADMIN') {
      throw new AppError('Only administrators can update employee accounts', 403, 'FORBIDDEN');
    }

    const existing = await userRepository.findById(id);
    if (!existing) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }

    if (input.email && input.email.toLowerCase() !== existing.email.toLowerCase()) {
      const emailTaken = await userRepository.findByEmail(input.email);
      if (emailTaken) {
        throw new AppError('Email address is already in use by another user', 409, 'EMAIL_TAKEN');
      }
    }

    const updated = await userRepository.update(id, {
      ...(input.name ? { name: input.name } : {}),
      ...(input.email ? { email: input.email.toLowerCase() } : {}),
      ...(input.role ? { role: input.role as UserRole } : {}),
      ...(input.facilityId !== undefined ? { facilityId: input.facilityId } : {}),
      ...(input.status ? { status: input.status as UserStatus } : {}),
    });

    await auditRepository.log({
      userId: currentUser.id,
      action: 'UPDATE_USER',
      entityType: 'User',
      entityId: id,
      metadata: { changes: input },
    });

    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      facilityId: updated.facilityId,
      employeeId: updated.employeeId,
      status: updated.status,
      updatedAt: updated.updatedAt,
    };
  }

  async updateUserStatus(id: string, status: UserStatus, currentUser: AuthenticatedUser) {
    if (currentUser.role !== 'ADMIN') {
      throw new AppError('Only administrators can change account statuses', 403, 'FORBIDDEN');
    }

    const existing = await userRepository.findById(id);
    if (!existing) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }

    const updated = await userRepository.update(id, { status });

    await auditRepository.log({
      userId: currentUser.id,
      action: 'UPDATE_USER',
      entityType: 'User',
      entityId: id,
      metadata: { previousStatus: existing.status, newStatus: status },
    });

    return {
      id: updated.id,
      employeeId: updated.employeeId,
      status: updated.status,
    };
  }
}

export const userService = new UserService();

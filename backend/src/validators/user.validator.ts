import { z } from 'zod';

export const createEmployeeSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Valid email is required'),
  role: z.enum(['ADMIN', 'HOSPITAL_MANAGER', 'SUPPLY_MANAGER']),
  facilityId: z.string().uuid('Valid facility ID is required').optional().nullable(),
  temporaryPassword: z.string().min(8, 'Temporary password must be at least 8 characters long').optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.enum(['ADMIN', 'HOSPITAL_MANAGER', 'SUPPLY_MANAGER']).optional(),
  facilityId: z.string().uuid().optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
});

export const updateUserStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;

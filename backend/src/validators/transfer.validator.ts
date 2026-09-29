import { z } from 'zod';

export const createTransferSchema = z.object({
  sourceFacilityId: z.string().uuid('Valid source facility ID is required'),
  destinationFacilityId: z.string().uuid('Valid destination facility ID is required'),
  resourceId: z.string().uuid('Valid resource ID is required'),
  quantity: z.number().int().positive('Transfer quantity must be greater than 0'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
});

export const updateTransferSchema = z.object({
  quantity: z.number().int().positive().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  eta: z.string().datetime().optional().nullable(),
});

export const updateTransferStatusSchema = z.object({
  status: z.enum(['REQUESTED', 'APPROVED', 'PACKED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED']),
  note: z.string().optional(),
});

export const transferQuerySchema = z.object({
  status: z.enum(['REQUESTED', 'APPROVED', 'PACKED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED']).optional(),
  sourceFacilityId: z.string().uuid().optional(),
  destinationFacilityId: z.string().uuid().optional(),
});

export type CreateTransferInput = z.infer<typeof createTransferSchema>;
export type UpdateTransferInput = z.infer<typeof updateTransferSchema>;
export type UpdateTransferStatusInput = z.infer<typeof updateTransferStatusSchema>;
export type TransferQueryInput = z.infer<typeof transferQuerySchema>;

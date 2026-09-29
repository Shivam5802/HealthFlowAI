import { z } from 'zod';

export const createInventorySchema = z.object({
  facilityId: z.string().uuid('Valid facility ID is required'),
  resourceId: z.string().uuid('Valid resource ID is required'),
  quantity: z.number().int().min(0, 'Quantity cannot be negative'),
  dailyConsumption: z.number().min(0, 'Daily consumption cannot be negative').default(0),
  safetyStock: z.number().int().min(0, 'Safety stock cannot be negative').default(10),
});

export const updateInventorySchema = z.object({
  quantity: z.number().int().min(0, 'Quantity cannot be negative').optional(),
  dailyConsumption: z.number().min(0, 'Daily consumption cannot be negative').optional(),
  safetyStock: z.number().int().min(0, 'Safety stock cannot be negative').optional(),
});

export const updateStockSchema = z.object({
  facilityId: z.string().uuid('Valid facility ID is required'),
  resourceId: z.string().uuid('Valid resource ID is required'),
  quantity: z.number().int().min(0, 'Quantity cannot be negative'),
  dailyConsumption: z.number().min(0, 'Daily consumption cannot be negative').optional(),
  safetyStock: z.number().int().min(0, 'Safety stock cannot be negative').optional(),
});

export type CreateInventoryInput = z.infer<typeof createInventorySchema>;
export type UpdateInventoryInput = z.infer<typeof updateInventorySchema>;
export type UpdateStockInput = z.infer<typeof updateStockSchema>;

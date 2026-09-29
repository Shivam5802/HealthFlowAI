import { z } from 'zod';

export const createAlertSchema = z.object({
  facilityId: z.string().uuid('Valid facility ID is required'),
  resourceId: z.string().uuid().optional().nullable(),
  type: z.enum([
    'STOCKOUT_RISK',
    'DEMAND_SURGE',
    'LOW_STOCK',
    'TRANSFER_REQUEST',
    'TRANSFER_APPROVED',
    'TRANSFER_COMPLETED',
    'SYSTEM',
  ]),
  severity: z.enum(['INFO', 'WARNING', 'CRITICAL']),
  title: z.string().min(2, 'Title is required'),
  message: z.string().min(2, 'Message is required'),
});

export const updateAlertSchema = z.object({
  status: z.enum(['OPEN', 'ACKNOWLEDGED', 'RESOLVED']).optional(),
  title: z.string().optional(),
  message: z.string().optional(),
  severity: z.enum(['INFO', 'WARNING', 'CRITICAL']).optional(),
});

export const alertQuerySchema = z.object({
  facilityId: z.string().uuid().optional(),
  severity: z.enum(['INFO', 'WARNING', 'CRITICAL']).optional(),
  status: z.enum(['OPEN', 'ACKNOWLEDGED', 'RESOLVED']).optional(),
  type: z.enum([
    'STOCKOUT_RISK',
    'DEMAND_SURGE',
    'LOW_STOCK',
    'TRANSFER_REQUEST',
    'TRANSFER_APPROVED',
    'TRANSFER_COMPLETED',
    'SYSTEM',
  ]).optional(),
});

export type CreateAlertInput = z.infer<typeof createAlertSchema>;
export type UpdateAlertInput = z.infer<typeof updateAlertSchema>;
export type AlertQueryInput = z.infer<typeof alertQuerySchema>;

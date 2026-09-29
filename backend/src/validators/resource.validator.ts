import { z } from 'zod';

export const createResourceSchema = z.object({
  name: z.string().min(2, 'Resource name must be at least 2 characters'),
  category: z.enum(['MEDICINE', 'MEDICAL_SUPPLY', 'EQUIPMENT', 'BED', 'OTHER']),
  unit: z.string().min(1, 'Unit of measurement is required (e.g. vials, boxes, units)'),
  description: z.string().optional().nullable(),
});

export const updateResourceSchema = createResourceSchema.partial();

export type CreateResourceInput = z.infer<typeof createResourceSchema>;
export type UpdateResourceInput = z.infer<typeof updateResourceSchema>;

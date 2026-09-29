import { z } from 'zod';

export const createFacilitySchema = z.object({
  name: z.string().min(2, 'Facility name must be at least 2 characters'),
  type: z.enum(['HOSPITAL', 'PHC', 'CLINIC', 'OTHER']),
  address: z.string().min(5, 'Address is required'),
  district: z.string().min(2, 'District is required'),
  state: z.string().min(2, 'State is required'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});

export const updateFacilitySchema = createFacilitySchema.partial();

export const facilityQuerySchema = z.object({
  search: z.string().optional(),
  type: z.enum(['HOSPITAL', 'PHC', 'CLINIC', 'OTHER']).optional(),
  district: z.string().optional(),
  state: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

export type CreateFacilityInput = z.infer<typeof createFacilitySchema>;
export type UpdateFacilityInput = z.infer<typeof updateFacilitySchema>;
export type FacilityQueryInput = z.infer<typeof facilityQuerySchema>;

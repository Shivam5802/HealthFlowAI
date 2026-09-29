import { z } from 'zod';

export const createPatientDemandSchema = z.object({
  facilityId: z.string().uuid('Valid facility ID is required'),
  date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).transform((val) => new Date(val)),
  patientCount: z.number().int().min(0, 'Patient count cannot be negative'),
  department: z.string().optional().nullable(),
});

export const patientDemandQuerySchema = z.object({
  facilityId: z.string().uuid().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export type CreatePatientDemandInput = z.infer<typeof createPatientDemandSchema>;
export type PatientDemandQueryInput = z.infer<typeof patientDemandQuerySchema>;

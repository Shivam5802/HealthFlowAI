export interface PatientDemandRecord {
  id: string;
  facilityId: string;
  date: string;
  patientCount: number;
  inflowRate: number;
  bedOccupancyRate: number;
  criticalCases: number;
  notes?: string | null;
  facility?: {
    id: string;
    name: string;
  };
}

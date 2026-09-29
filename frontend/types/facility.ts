export type FacilityType = 'HOSPITAL' | 'PHC' | 'CLINIC' | 'OTHER';
export type FacilityStatus = 'ACTIVE' | 'UNDER_MAINTENANCE' | 'INACTIVE';

export interface Facility {
  id: string;
  name: string;
  type: FacilityType;
  address: string;
  district: string;
  state: string;
  latitude: number;
  longitude: number;
  status: FacilityStatus;
  _count?: {
    inventory?: number;
    alerts?: number;
    predictions?: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

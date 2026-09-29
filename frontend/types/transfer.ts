export type TransferStatus =
  | 'REQUESTED'
  | 'APPROVED'
  | 'PACKED'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REJECTED'
  | 'COMPLETED';

export type TransferPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface TransferItem {
  id: string;
  sourceFacilityId: string;
  destinationFacilityId: string;
  resourceId: string;
  quantity: number;
  status: TransferStatus;
  priority: TransferPriority;
  requestedBy: string;
  approvedBy?: string | null;
  eta?: string | null;
  createdAt: string;
  updatedAt: string;
  sourceFacility?: {
    id: string;
    name: string;
    district: string;
  };
  destinationFacility?: {
    id: string;
    name: string;
    district: string;
  };
  resource?: {
    id: string;
    name: string;
    unit: string;
  };
}

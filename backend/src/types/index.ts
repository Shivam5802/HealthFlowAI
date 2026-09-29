import { Request } from 'express';

export type UserRole = 'ADMIN' | 'HOSPITAL_MANAGER' | 'SUPPLY_MANAGER';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
export type FacilityType = 'HOSPITAL' | 'PHC' | 'CLINIC' | 'OTHER';
export type FacilityStatus = 'ACTIVE' | 'INACTIVE';
export type ResourceCategory = 'MEDICINE' | 'MEDICAL_SUPPLY' | 'EQUIPMENT' | 'BED' | 'OTHER';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AlertType =
  | 'STOCKOUT_RISK'
  | 'DEMAND_SURGE'
  | 'LOW_STOCK'
  | 'TRANSFER_REQUEST'
  | 'TRANSFER_APPROVED'
  | 'TRANSFER_COMPLETED'
  | 'SYSTEM';
export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';
export type AlertStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';
export type TransferStatus = 'REQUESTED' | 'APPROVED' | 'PACKED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
export type TransferPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  facilityId: string | null;
  employeeId: string;
  status: UserStatus;
  mustChangePassword?: boolean;
}

export interface AuthTokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  facilityId: string | null;
  employeeId: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export interface ApiResponse<T = unknown> {
  success: true;
  data: T;
  message: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    [key: string]: unknown;
  };
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  code: string;
  errors?: unknown;
}

export type UserRole = 'ADMIN' | 'HOSPITAL_MANAGER' | 'SUPPLY_MANAGER';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  facilityId: string | null;
  employeeId: string;
  status: UserStatus;
  mustChangePassword?: boolean;
  createdAt?: string;
}

export interface AuthSession {
  token: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

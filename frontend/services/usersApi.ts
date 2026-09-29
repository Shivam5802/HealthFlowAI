import { apiClient } from './apiClient';
import { User, UserRole, UserStatus } from '../types/auth';

export interface CreateEmployeePayload {
  name: string;
  email: string;
  role: UserRole;
  facilityId?: string | null;
}

export interface CreateEmployeeResponse {
  user: User;
  temporaryPassword?: string;
}

export const usersApi = {
  getUsers: async (): Promise<User[]> => {
    return apiClient.get<User[]>('/users');
  },

  getUserById: async (id: string): Promise<User> => {
    return apiClient.get<User>(`/users/${id}`);
  },

  createEmployee: async (data: CreateEmployeePayload): Promise<CreateEmployeeResponse> => {
    return apiClient.post<CreateEmployeeResponse>('/users', data);
  },

  updateUser: async (id: string, data: Partial<User>): Promise<User> => {
    return apiClient.patch<User>(`/users/${id}`, data);
  },

  updateUserStatus: async (id: string, status: UserStatus): Promise<User> => {
    return apiClient.patch<User>(`/users/${id}/status`, { status });
  },
};

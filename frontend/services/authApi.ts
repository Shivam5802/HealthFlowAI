import { apiClient } from './apiClient';
import { User, LoginCredentials, AuthSession } from '../types/auth';

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthSession> => {
    const session = await apiClient.post<AuthSession>('/auth/login', credentials);
    if (typeof window !== 'undefined' && session.token) {
      localStorage.setItem('healthflow_token', session.token);
      localStorage.setItem('healthflow_user', JSON.stringify(session.user));
    }
    return session;
  },

  getMe: async (): Promise<User> => {
    return apiClient.get<User>('/auth/me');
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('healthflow_token');
        localStorage.removeItem('healthflow_user');
      }
    }
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<{ updated: boolean }> => {
    return apiClient.post<{ updated: boolean }>('/auth/change-password', {
      currentPassword,
      newPassword,
    });
  },
};

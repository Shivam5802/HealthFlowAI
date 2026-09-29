'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { User, UserRole, LoginCredentials } from '../types/auth';
import { authApi } from '../services/authApi';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<User>;
  logout: () => Promise<void>;
  hasRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (typeof window !== 'undefined') {
          const storedToken = localStorage.getItem('healthflow_token');
          const storedUser = localStorage.getItem('healthflow_user');

          if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));

            // Verify session in background with backend
            authApi
              .getMe()
              .then((verifiedUser) => {
                setUser(verifiedUser);
                localStorage.setItem('healthflow_user', JSON.stringify(verifiedUser));
              })
              .catch(() => {
                // If token invalid, clear
                localStorage.removeItem('healthflow_token');
                localStorage.removeItem('healthflow_user');
                setToken(null);
                setUser(null);
              });
          }
        }
      } catch (err) {
        console.error('Session restoration error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginCredentials): Promise<User> => {
    setIsLoading(true);
    try {
      const session = await authApi.login(credentials);
      setUser(session.user);
      setToken(session.token);

      // Route according to user role
      if (session.user.role === 'ADMIN') {
        router.push('/admin/dashboard');
      } else if (session.user.role === 'HOSPITAL_MANAGER') {
        router.push('/manager/dashboard');
      } else if (session.user.role === 'SUPPLY_MANAGER') {
        router.push('/supply/dashboard');
      } else {
        router.push('/');
      }

      return session.user;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    } finally {
      setUser(null);
      setToken(null);
      router.push('/login');
    }
  };

  const hasRole = useCallback(
    (roles: UserRole[]): boolean => {
      if (!user) return false;
      return roles.includes(user.role);
    },
    [user]
  );

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

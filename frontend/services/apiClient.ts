import { ApiResponse, ApiErrorResponse } from '../types/api';

function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined') {
    return '/api';
  }
  if (process.env.BACKEND_URL) {
    return `${process.env.BACKEND_URL.replace(/\/+$/, '')}/api`;
  }
  return 'http://localhost:5000/api';
}

export class ApiError extends Error {
  code: string;
  statusCode: number;
  details?: unknown;

  constructor(message: string, code = 'API_ERROR', statusCode = 500, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

const apiCache = new Map<string, { data: any; expiry: number }>();
const CACHE_TTL_MS = 15000; // 15 seconds cache for fast tab switching

export function invalidateApiCache(): void {
  apiCache.clear();
}

export async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${cleanEndpoint}`;

  const method = (options.method || 'GET').toUpperCase();

  // If writing or mutating data, invalidate cache so fresh data is loaded
  if (method !== 'GET') {
    apiCache.clear();
  }

  // Retrieve stored token on client side
  let token: string | null = null;
  if (typeof window !== 'undefined') {
    token = localStorage.getItem('healthflow_token');
  }

  // Check cache for GET requests
  const cacheKey = `${token || 'anon'}:${url}`;
  if (method === 'GET' && apiCache.has(cacheKey)) {
    const cached = apiCache.get(cacheKey)!;
    if (Date.now() < cached.expiry) {
      return cached.data as T;
    }
    apiCache.delete(cacheKey);
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    let data: any;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await res.json();
    } else {
      const text = await res.text();
      if (!res.ok) {
        throw new ApiError(
          `API request returned HTTP ${res.status} from ${url}. ${text.slice(0, 150) || res.statusText}`,
          'HTTP_ERROR',
          res.status
        );
      }
      data = { success: true, data: text };
    }

    if (!res.ok || !data.success) {
      const err = data as ApiErrorResponse;
      throw new ApiError(
        err.message || 'An unexpected API error occurred',
        err.code || 'API_ERROR',
        res.status,
        err.errors
      );
    }

    const result = (data as ApiResponse<T>).data;
    if (method === 'GET') {
      apiCache.set(cacheKey, { data: result, expiry: Date.now() + CACHE_TTL_MS });
    }
    return result;
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      throw err;
    }
    const message = err instanceof Error ? err.message : 'Network communication error';
    throw new ApiError(
      `${message} (Connecting to: ${url}). Check backend status & NEXT_PUBLIC_API_URL.`,
      'NETWORK_ERROR',
      0
    );
  }
}

export const apiClient = {
  get: <T>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { method: 'GET', ...options }),
  post: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    }),
  put: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    }),
  patch: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    }),
  delete: <T>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { method: 'DELETE', ...options }),
};

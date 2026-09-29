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

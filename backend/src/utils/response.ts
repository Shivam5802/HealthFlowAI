import { Response } from 'express';
import { ApiResponse, ApiErrorResponse } from '../types/index.js';

export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public details?: unknown;

  constructor(message: string, statusCode = 400, code = 'BAD_REQUEST', details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message = 'Request successful',
  statusCode = 200,
  meta?: Record<string, unknown>
): Response<ApiResponse<T>> => {
  const payload: ApiResponse<T> = {
    success: true,
    data,
    message,
    ...(meta ? { meta } : {}),
  };
  return res.status(statusCode).json(payload);
};

export const sendError = (
  res: Response,
  message: string,
  code = 'INTERNAL_ERROR',
  statusCode = 500,
  details?: unknown
): Response<ApiErrorResponse> => {
  const payload: ApiErrorResponse = {
    success: false,
    message,
    code,
    ...(details ? { errors: details } : {}),
  };
  return res.status(statusCode).json(payload);
};

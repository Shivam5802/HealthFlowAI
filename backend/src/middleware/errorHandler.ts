import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError, sendError } from '../utils/response.js';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): Response => {
  // If already custom AppError
  if (err instanceof AppError) {
    return sendError(res, err.message, err.code, err.statusCode, err.details);
  }

  // If Zod validation error
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return sendError(res, 'Validation error', 'VALIDATION_FAILED', 422, formattedErrors);
  }

  // Handle JWT errors specifically
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 'Invalid authentication token', 'UNAUTHORIZED', 401);
  }
  if (err.name === 'TokenExpiredError') {
    return sendError(res, 'Authentication token expired', 'TOKEN_EXPIRED', 401);
  }

  // Fallback for unhandled unexpected internal errors
  console.error('Unhandled internal server error:', err);
  const message = process.env.NODE_ENV === 'production' 
    ? 'An unexpected internal error occurred' 
    : err.message || 'Internal server error';

  return sendError(res, message, 'INTERNAL_SERVER_ERROR', 500);
};

import type { ApiError } from '@/types';

// Common error codes
export const ERROR_CODES = {
  // Validation errors
  INVALID_UUID: 'INVALID_UUID',
  INVALID_PAGINATION: 'INVALID_PAGINATION',
  INVALID_SORT_FIELD: 'INVALID_SORT_FIELD',
  VALIDATION_ERROR: 'VALIDATION_ERROR',

  // Resource errors
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  GROUP_NOT_FOUND: 'GROUP_NOT_FOUND',

  // System errors
  DATABASE_ERROR: 'DATABASE_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

// Custom error class for application errors
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details: Record<string, unknown> | undefined;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number = 500,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;

    // Maintain stack trace if available
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, AppError);
    }
  }
}

// Predefined error factories
export const createValidationError = (
  message: string,
  details?: Record<string, unknown>,
): AppError => {
  return new AppError(ERROR_CODES.VALIDATION_ERROR, message, 400, details);
};

export const createNotFoundError = (resource: string, id: string): AppError => {
  return new AppError(
    ERROR_CODES.RESOURCE_NOT_FOUND,
    `${resource} with ID '${id}' not found`,
    404,
    { resource, id },
  );
};

export const createDatabaseError = (message: string): AppError => {
  return new AppError(ERROR_CODES.DATABASE_ERROR, message, 500);
};

// Convert AppError to API error format
export const toApiError = (error: AppError): ApiError => {
  const result: ApiError = {
    code: error.code,
    message: error.message,
  };

  if (error.details) {
    result.details = error.details;
  }

  return result;
};

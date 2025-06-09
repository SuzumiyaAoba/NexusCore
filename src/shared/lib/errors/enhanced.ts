/**
 * Base error class with error codes
 */
export abstract class AppError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;

  constructor(
    message: string,
    public readonly cause?: Error,
  ) {
    super(message);
    this.name = this.constructor.name;
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      ...(this.cause && { cause: this.cause.message }),
    };
  }
}

export class DatabaseError extends AppError {
  readonly code = "DATABASE_ERROR" as const;
  readonly statusCode = 500;
}

export class NotFoundError extends AppError {
  readonly code = "NOT_FOUND" as const;
  readonly statusCode = 404;

  constructor(
    public readonly resource: string,
    public readonly resourceId: string | number,
  ) {
    super(`${resource} with id ${resourceId} not found`);
  }
}

export class ValidationError extends AppError {
  readonly code = "VALIDATION_ERROR" as const;
  readonly statusCode = 400;

  constructor(
    message: string,
    public readonly field?: string,
    cause?: Error,
  ) {
    super(message, cause);
  }
}

export class DuplicateError extends AppError {
  readonly code = "DUPLICATE_ERROR" as const;
  readonly statusCode = 409;

  constructor(
    public readonly resource: string,
    public readonly field: string,
    public readonly value: string,
  ) {
    super(`${resource} with ${field} '${value}' already exists`);
  }
}

export class AuthenticationError extends AppError {
  readonly code = "AUTHENTICATION_ERROR" as const;
  readonly statusCode = 401;

  constructor(message = "Authentication required") {
    super(message);
  }
}

export class AuthorizationError extends AppError {
  readonly code = "AUTHORIZATION_ERROR" as const;
  readonly statusCode = 403;

  constructor(message = "Insufficient permissions") {
    super(message);
  }
}

/**
 * Type guard for AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Error factory functions
 */
export const ErrorFactory = {
  database: (message: string, cause?: Error) => new DatabaseError(message, cause),
  notFound: (resource: string, id: string | number) => new NotFoundError(resource, id),
  validation: (message: string, field?: string, cause?: Error) => new ValidationError(message, field, cause),
  duplicate: (resource: string, field: string, value: string) => new DuplicateError(resource, field, value),
  authentication: (message?: string) => new AuthenticationError(message),
  authorization: (message?: string) => new AuthorizationError(message),
} as const;

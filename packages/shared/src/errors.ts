export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(message: string, statusCode = 500, code = 'INTERNAL_ERROR', details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string) {
    super(`${resource}${identifier ? ` with identifier '${identifier}'` : ''} was not found`, 404, 'NOT_FOUND');
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 400, 'BAD_REQUEST', details);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required or invalid credentials') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to perform this action') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class ExecutionTimeoutError extends AppError {
  constructor(testName: string, timeoutMs: number) {
    super(`Test execution for '${testName}' exceeded timeout limit of ${timeoutMs}ms`, 408, 'EXECUTION_TIMEOUT');
  }
}

export class AIProviderError extends AppError {
  constructor(provider: string, message: string, details?: unknown) {
    super(`AI Provider [${provider}] Error: ${message}`, 502, 'AI_PROVIDER_ERROR', details);
  }
}

import { Request, Response, NextFunction } from 'express';
import { AppError, createChildLogger } from '@novaqa/shared';
import { ZodError } from 'zod';

const log = createChildLogger('api-error-handler');

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  log.error({ err: err.message, stack: err.stack, path: req.path, method: req.method }, 'API Request Error');

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      code: err.code,
      message: err.message,
      details: err.details
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'Invalid request payload',
      details: err.errors
    });
  }

  // Default internal server error
  return res.status(500).json({
    success: false,
    code: 'INTERNAL_SERVER_ERROR',
    message: process.env.NODE_ENV === 'production' ? 'An unexpected server error occurred' : err.message
  });
}

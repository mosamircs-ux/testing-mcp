import { Request, Response, NextFunction } from 'express';
import { AppError } from '@novaqa/shared';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const requestStore = new Map<string, RateLimitRecord>();

// Cleanup stale records periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of requestStore.entries()) {
    if (now > record.resetTime) {
      requestStore.delete(key);
    }
  }
}, 60000);

export function rateLimiter(options: { maxRequests: number; windowMs: number; message?: string }) {
  const { maxRequests, windowMs, message = 'Too many requests. Please try again later.' } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown-ip';
    const key = `${req.path}:${ip}`;
    const now = Date.now();

    const record = requestStore.get(key as string);

    if (!record || now > record.resetTime) {
      requestStore.set(key as string, {
        count: 1,
        resetTime: now + windowMs
      });
      return next();
    }

    if (record.count >= maxRequests) {
      res.setHeader('Retry-After', Math.ceil((record.resetTime - now) / 1000));
      return next(new AppError(message, 429, 'RATE_LIMIT_EXCEEDED'));
    }

    record.count += 1;
    next();
  };
}

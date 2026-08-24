import { Request, Response, NextFunction } from 'express';

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
}

interface ClientRecord {
  timestamps: number[];
}

export function createRateLimiter(options: RateLimitOptions) {
  const {
    windowMs,
    maxRequests,
    message = 'Too many requests, please slow down.',
    keyGenerator = (req: Request) => {
      const forwarded = req.headers['x-forwarded-for'];
      if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
      return req.ip || req.socket.remoteAddress || '127.0.0.1';
    }
  } = options;

  const storage = new Map<string, ClientRecord>();

  // Periodic pruning of stale records every 5 minutes to prevent memory leaks
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of storage.entries()) {
      record.timestamps = record.timestamps.filter((t) => now - t < windowMs);
      if (record.timestamps.length === 0) {
        storage.delete(key);
      }
    }
  }, 5 * 60 * 1000);

  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = keyGenerator(req);
    const now = Date.now();

    let record = storage.get(key);
    if (!record) {
      record = { timestamps: [] };
      storage.set(key, record);
    }

    // Keep only timestamps within window
    record.timestamps = record.timestamps.filter((t) => now - t < windowMs);

    const count = record.timestamps.length;
    const remaining = Math.max(0, maxRequests - count - 1);
    const resetTime = Math.ceil((record.timestamps[0] ? record.timestamps[0] + windowMs - now : windowMs) / 1000);

    res.setHeader('RateLimit-Limit', maxRequests.toString());
    res.setHeader('RateLimit-Remaining', remaining.toString());
    res.setHeader('RateLimit-Reset', resetTime.toString());

    if (count >= maxRequests) {
      res.setHeader('Retry-After', resetTime.toString());
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message,
          retryAfterSeconds: resetTime
        }
      });
      return;
    }

    record.timestamps.push(now);
    next();
  };
}

// Pre-configured rate limiters for critical application routes
export const authRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 20, // 20 attempts per minute
  message: 'Authentication rate limit exceeded. Please try again in 1 minute.'
});

export const apiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 300, // 300 requests per minute
  message: 'API rate limit exceeded. Please throttle your client requests.'
});

export const webhookRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60,
  message: 'Webhook rate limit exceeded.'
});

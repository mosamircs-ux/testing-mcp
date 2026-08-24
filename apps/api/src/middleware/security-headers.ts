import { Request, Response, NextFunction } from 'express';

export function securityHeadersMiddleware(req: Request, res: Response, next: NextFunction): void {
  // HSTS (HTTP Strict Transport Security) - 1 year with subdomains and preload
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  // Prevent MIME-sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Prevent clickjacking via frame embedding
  res.setHeader('X-Frame-Options', 'DENY');

  // Legacy XSS filter activation
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Strict Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Content Security Policy (CSP)
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
      "img-src 'self' data: https: blob:; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.paymob.com; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "font-src 'self' data: https://fonts.gstatic.com; " +
      "connect-src 'self' https: wss: http://localhost:* ws://localhost:*; " +
      "frame-src 'self' https://checkout.paymob.com https://accept.paymob.com; " +
      "frame-ancestors 'none'; " +
      "base-uri 'self'; " +
      "form-action 'self';"
  );

  // Permissions Policy
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(self)');

  // Request correlation ID
  const incomingRequestId = req.headers['x-request-id'] as string;
  const correlationId = incomingRequestId || `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  res.setHeader('X-Request-ID', correlationId);
  (req as any).id = correlationId;

  next();
}

import express from 'express';
import cors from 'cors';
import { healthRouter } from './routes/health';
import { metricsRouter, recordHttpMetric } from './routes/metrics';
import { authRouter } from './routes/auth';
import { teamRouter } from './routes/team';
import { projectsRouter } from './routes/projects';
import { planningRouter } from './routes/planning';
import { suitesRouter } from './routes/suites';
import { runsRouter } from './routes/runs';
import { findingsRouter } from './routes/findings';
import { aiRouter } from './routes/ai';
import { apiKeysRouter } from './routes/api-keys';
import { artifactsRouter } from './routes/artifacts';
import securityRouter from './routes/security';
import { reportsRouter } from './routes/reports';
import { ciCdRouter } from './routes/ci-cd';
import { billingRouter } from './routes/billing';
import { paymentsRouter } from './routes/payments';
import { adminRouter } from './routes/admin';
import { errorHandler } from './middleware/error-handler';
import { securityHeadersMiddleware } from './middleware/security-headers';
import { apiRateLimiter, authRateLimiter, webhookRateLimiter } from './middleware/rate-limit';
import { logger } from '@novaqa/shared';

export function createServer() {
  const app = express();

  // Trust reverse proxy (Nginx / Cloudflare / AWS ALB)
  app.set('trust proxy', 1);

  // Security Headers (HSTS, CSP, nosniff, frame-ancestors, etc.)
  app.use(securityHeadersMiddleware);

  // CORS Configuration (Strict Origins & Methods)
  const allowedOrigins = [
    process.env.APP_URL || 'http://localhost:3000',
    'http://localhost:3000',
    'https://checkout.paymob.com'
  ];
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
          callback(null, true);
        } else {
          callback(new Error('Blocked by CORS policy'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-ID', 'X-Paymob-HMAC']
    })
  );

  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Request Logging & Latency Metrics Recording
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const durationMs = Date.now() - start;
      recordHttpMetric(req.method, req.path, res.statusCode, durationMs);
      logger.debug(
        {
          requestId: (req as any).id,
          method: req.method,
          path: req.path,
          status: res.statusCode,
          durationMs
        },
        'HTTP Request Completed'
      );
    });
    next();
  });

  // Public Health & Observability Metrics Endpoints
  app.use(healthRouter);
  app.use(metricsRouter);

  // Rate Limiting on Authentication & Webhook Routes
  app.use('/api/v1/auth', authRateLimiter);
  app.use('/api/v1/payments/paymob/webhook', webhookRateLimiter);
  app.use('/api/v1', apiRateLimiter);

  // Auth Routes (Login, Register, Refresh, Forgot Password, Reset Password, Verify Email, OAuth)
  app.use(authRouter);

  // Protected Multi-Tenant Routes (Auth Middleware applied individually inside routers)
  app.use(teamRouter);
  app.use(projectsRouter);
  app.use(planningRouter);
  app.use(suitesRouter);
  app.use(runsRouter);
  app.use(findingsRouter);
  app.use(aiRouter);
  app.use(apiKeysRouter);
  app.use(artifactsRouter);
  app.use(reportsRouter);
  app.use(ciCdRouter);
  app.use(billingRouter);
  app.use(paymentsRouter);
  app.use(adminRouter);
  app.use('/api/v1/security', securityRouter);

  // Global Error Handler
  app.use(errorHandler);

  return app;
}

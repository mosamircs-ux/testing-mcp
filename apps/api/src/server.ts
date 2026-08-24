import express from 'express';
import cors from 'cors';
import { healthRouter } from './routes/health';
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
import { errorHandler } from './middleware/error-handler';
import { logger } from '@novaqa/shared';

export function createServer() {
  const app = express();

  // Core Middleware
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Request Logging
  app.use((req, res, next) => {
    logger.debug({ method: req.method, path: req.path }, 'Incoming Request');
    next();
  });

  // Public Health Endpoints
  app.use(healthRouter);

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
  app.use('/api/v1/security', securityRouter);

  // Global Error Handler
  app.use(errorHandler);

  return app;
}

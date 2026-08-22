import express from 'express';
import cors from 'cors';
import { healthRouter } from './routes/health.js';
import { authRouter } from './routes/auth.js';
import { projectsRouter } from './routes/projects.js';
import { suitesRouter } from './routes/suites.js';
import { runsRouter } from './routes/runs.js';
import { findingsRouter } from './routes/findings.js';
import { aiRouter } from './routes/ai.js';
import { apiKeysRouter } from './routes/api-keys.js';
import { artifactsRouter } from './routes/artifacts.js';
import { authMiddleware } from './middleware/auth.js';
import { errorHandler } from './middleware/error-handler.js';
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

  // Auth Routes (Login, Register)
  app.use(authRouter);

  // Authenticated Protected Routes
  app.use(authMiddleware);
  app.use(projectsRouter);
  app.use(suitesRouter);
  app.use(runsRouter);
  app.use(findingsRouter);
  app.use(aiRouter);
  app.use(apiKeysRouter);
  app.use(artifactsRouter);

  // Global Error Handler
  app.use(errorHandler);

  return app;
}

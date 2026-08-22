import { createServer } from './server.js';
import { loadConfig, logger } from '@novaqa/shared';

const config = loadConfig();
const app = createServer();

const port = config.PORT || 4000;

const server = app.listen(port, () => {
  logger.info(`🔥 NovaQA API Server running at http://localhost:${port}`);
  logger.info(`📋 Health check: http://localhost:${port}/health`);
  logger.info(`📋 Ready check: http://localhost:${port}/health/ready`);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, closing HTTP server...');
  server.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });
});

export * from './server.js';

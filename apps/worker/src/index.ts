import { workerQueue } from './queue.js';
import { createChildLogger } from '@novaqa/shared';

const log = createChildLogger('worker-service');

log.info('Starting NovaQA Worker background process...');
workerQueue.start();

const shutdown = async (signal: string) => {
  log.info({ signal }, 'Shutting down worker process gracefully...');
  await workerQueue.stop();
  process.exit(0);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

export * from './queue.js';

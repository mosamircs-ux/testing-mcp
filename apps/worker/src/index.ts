import { workerQueue } from './queue.js';
import { createChildLogger } from '@novaqa/shared';

const log = createChildLogger('worker-service');

log.info('Starting NovaQA Worker background process...');
workerQueue.start();

process.on('SIGINT', () => {
  log.info('Shutting down worker process gracefully...');
  workerQueue.stop();
  process.exit(0);
});

export * from './queue.js';

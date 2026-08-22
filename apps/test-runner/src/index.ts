import { orchestrator } from './runner.js';
import { createChildLogger } from '@novaqa/shared';

const log = createChildLogger('test-runner-service');

log.info('NovaQA Test Runner Sandbox ready.');

export * from './runner.js';

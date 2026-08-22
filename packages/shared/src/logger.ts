import pino from 'pino';
import { loadConfig } from './config';

const config = loadConfig();

export const logger = pino({
  level: config.LOG_LEVEL || 'info',
  transport:
    config.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname'
          }
        }
      : undefined,
  base: {
    env: config.NODE_ENV
  },
  redact: ['password', 'token', 'apiKey', 'hashedKey', 'authorization', 'headers.authorization']
});

export type Logger = typeof logger;

export function createChildLogger(name: string, context?: Record<string, unknown>) {
  return logger.child({ module: name, ...context });
}

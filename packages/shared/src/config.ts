import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from workspace root if not already loaded
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

const ConfigSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  API_URL: z.string().default('http://localhost:4000'),
  WEB_URL: z.string().default('http://localhost:3000'),
  MCP_PORT: z.coerce.number().default(4001),
  
  DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5432/novaqa?schema=public'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  
  STORAGE_PROVIDER: z.enum(['local', 's3']).default('local'),
  STORAGE_LOCAL_PATH: z.string().default('./data/artifacts'),
  S3_ENDPOINT: z.string().default('http://localhost:9000'),
  S3_REGION: z.string().default('us-east-1'),
  S3_ACCESS_KEY: z.string().default('minioadmin'),
  S3_SECRET_KEY: z.string().default('minioadmin'),
  S3_BUCKET_NAME: z.string().default('novaqa-artifacts'),
  S3_FORCE_PATH_STYLE: z.coerce.boolean().default(true),
  
  JWT_SECRET: z.string().default('novaqa-super-secret-jwt-key-change-in-production-min-32-chars-long'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  API_KEY_SALT: z.string().default('novaqa-secret-api-key-salt'),
  
  AI_DEFAULT_PROVIDER: z.enum(['openai', 'anthropic', 'gemini', 'mock']).default('mock'),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-4o'),
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default('claude-3-5-sonnet-20241022'),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-1.5-pro'),
  
  PLAYWRIGHT_HEADLESS: z.coerce.boolean().default(true),
  PLAYWRIGHT_TIMEOUT_MS: z.coerce.number().default(30000),
  MAX_CONCURRENT_RUNS: z.coerce.number().default(5),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info')
});

export type AppConfig = z.infer<typeof ConfigSchema>;

let parsedConfig: AppConfig;

export function loadConfig(): AppConfig {
  if (!parsedConfig) {
    const result = ConfigSchema.safeParse(process.env);
    if (!result.success) {
      console.error('❌ Invalid environment variables:', result.error.format());
      throw new Error('Environment configuration validation failed');
    }
    parsedConfig = result.data;
  }
  return parsedConfig;
}

export const config = loadConfig();

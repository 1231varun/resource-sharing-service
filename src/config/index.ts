import { z } from 'zod';
import type { AppConfig } from '@/types';

// Environment variable validation schema
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_VERSION: z.string().default('v1'),
  API_BASE_PATH: z.string().default('/api'),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
});

// Parse and validate environment variables
const env = envSchema.parse(process.env);

// Application configuration
export const config: AppConfig = {
  database: {
    url: env.DATABASE_URL,
  },
  server: {
    port: env.PORT,
    env: env.NODE_ENV,
    apiVersion: env.API_VERSION,
    apiBasePath: env.API_BASE_PATH,
  },
  rateLimit: {
    max: env.RATE_LIMIT_MAX,
    windowMs: env.RATE_LIMIT_WINDOW_MS,
  },
  cors: {
    origin: env.CORS_ORIGIN,
  },
};

// Environment helpers
export const isDevelopment = (): boolean => env.NODE_ENV === 'development';
export const isProduction = (): boolean => env.NODE_ENV === 'production';
export const isTest = (): boolean => env.NODE_ENV === 'test';

// Logging configuration
export const logLevel = env.LOG_LEVEL;

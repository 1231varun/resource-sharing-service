import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';

// Health check route
async function healthRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/health', async () => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env['npm_package_version'] || '1.0.0',
      environment: process.env['NODE_ENV'] || 'development',
    };
  });
}

// Build application with all plugins
export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: process.env['LOG_LEVEL'] || 'info',
    },
    disableRequestLogging: process.env['NODE_ENV'] === 'production',
  });

  // Register security plugins
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
      },
    },
  });

  await app.register(cors, {
    origin: process.env['CORS_ORIGIN'] || 'http://localhost:3000',
    credentials: true,
  });

  await app.register(rateLimit, {
    max: parseInt(process.env['RATE_LIMIT_MAX'] || '100', 10),
    timeWindow: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '60000', 10),
  });

  // Register routes
  await app.register(healthRoutes);

  // Global error handler
  app.setErrorHandler(async (error, request, reply) => {
    const requestId = request.id;
    
    app.log.error({
      error: error.message,
      stack: error.stack,
      requestId,
      url: request.url,
      method: request.method,
    });

    const statusCode = error.statusCode || 500;
    const response = {
      success: false,
      error: {
        code: error.code || 'INTERNAL_ERROR',
        message: process.env['NODE_ENV'] === 'production' 
          ? 'Internal server error' 
          : error.message,
      },
      requestId,
    };

    return reply.status(statusCode).send(response);
  });

  // 404 handler
  app.setNotFoundHandler(async (request, reply) => {
    const response = {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Route ${request.method} ${request.url} not found`,
      },
      requestId: request.id,
    };

    return reply.status(404).send(response);
  });

  return app;
} 
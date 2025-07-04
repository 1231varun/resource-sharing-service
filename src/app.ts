import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { sharingRoutes } from './routes/sharing.routes';

// Health check route
async function healthRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/health', {
    schema: {
      tags: ['Health'],
      summary: 'Health check endpoint',
      description: 'Returns the current health status of the API server',
      response: {
        200: {
          description: 'Server is healthy',
          type: 'object',
          properties: {
            status: { type: 'string', example: 'ok' },
            timestamp: { type: 'string', format: 'date-time' },
            uptime: { type: 'number', description: 'Server uptime in seconds' },
            version: { type: 'string', example: '1.0.0' },
            environment: { type: 'string', example: 'development' },
          },
        },
      },
    },
  }, async () => {
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

  // Register Swagger documentation
  await app.register(swagger, {
    openapi: {
      openapi: '3.0.0',
      info: {
        title: 'Resource Sharing Service API',
        description: 'A scalable resource sharing system with multi-level access control',
        version: '1.0.0',
        contact: {
          name: 'API Support',
          email: 'support@example.com',
        },
        license: {
          name: 'MIT',
          url: 'https://opensource.org/licenses/MIT',
        },
      },
      servers: [
        {
          url: 'http://localhost:3000',
          description: 'Development server',
        },
      ],
      components: {
        schemas: {
          User: {
            type: 'object',
            required: ['id', 'name', 'email', 'createdAt'],
            properties: {
              id: { type: 'string', format: 'uuid' },
              name: { type: 'string' },
              email: { type: 'string', format: 'email' },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
          Resource: {
            type: 'object',
            required: ['id', 'name', 'isGlobal', 'createdAt'],
            properties: {
              id: { type: 'string', format: 'uuid' },
              name: { type: 'string' },
              description: { type: 'string', nullable: true },
              isGlobal: { type: 'boolean' },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
          UserWithAccess: {
            type: 'object',
            required: ['id', 'name', 'email', 'accessType', 'createdAt'],
            properties: {
              id: { type: 'string', format: 'uuid' },
              name: { type: 'string' },
              email: { type: 'string', format: 'email' },
              accessType: { $ref: '#/components/schemas/AccessType' },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
          AccessType: {
            type: 'string',
            enum: ['direct', 'group', 'global'],
          },
          ResourceAccessMetadata: {
            type: 'object',
            required: ['totalUsers', 'directShares', 'groupShares', 'isGlobal'],
            properties: {
              totalUsers: { type: 'integer', minimum: 0 },
              directShares: { type: 'integer', minimum: 0 },
              groupShares: { type: 'integer', minimum: 0 },
              isGlobal: { type: 'boolean' },
            },
          },
          AccessCheckResult: {
            type: 'object',
            required: ['hasAccess'],
            properties: {
              hasAccess: { type: 'boolean' },
              accessType: { $ref: '#/components/schemas/AccessType' },
              grantedAt: { type: 'string', format: 'date-time' },
            },
          },
          ResourceStats: {
            type: 'object',
            required: ['id', 'name', 'isGlobal', 'userCount', 'directShares', 'groupShares', 'createdAt'],
            properties: {
              id: { type: 'string', format: 'uuid' },
              name: { type: 'string' },
              description: { type: 'string', nullable: true },
              isGlobal: { type: 'boolean' },
              userCount: { type: 'integer', minimum: 0 },
              directShares: { type: 'integer', minimum: 0 },
              groupShares: { type: 'integer', minimum: 0 },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
          Pagination: {
            type: 'object',
            required: ['total', 'limit', 'offset', 'hasMore'],
            properties: {
              total: { type: 'integer', minimum: 0 },
              limit: { type: 'integer', minimum: 1 },
              offset: { type: 'integer', minimum: 0 },
              hasMore: { type: 'boolean' },
            },
          },
          ResourceStatsSummary: {
            type: 'object',
            required: ['totalResources', 'globalResources', 'totalUniqueUsers', 'avgUsersPerResource'],
            properties: {
              totalResources: { type: 'integer', minimum: 0 },
              globalResources: { type: 'integer', minimum: 0 },
              totalUniqueUsers: { type: 'integer', minimum: 0 },
              avgUsersPerResource: { type: 'number', minimum: 0 },
            },
          },
          ApiResponse: {
            type: 'object',
            required: ['success'],
            properties: {
              success: { type: 'boolean' },
              data: { type: 'object' },
              error: {
                type: 'object',
                properties: {
                  code: { type: 'string' },
                  message: { type: 'string' },
                  details: { type: 'object' },
                },
              },
              requestId: { type: 'string' },
            },
          },
          Error: {
            type: 'object',
            required: ['success', 'error'],
            properties: {
              success: { type: 'boolean', enum: [false] },
              error: {
                type: 'object',
                required: ['code', 'message'],
                properties: {
                  code: { type: 'string' },
                  message: { type: 'string' },
                  details: { type: 'object' },
                },
              },
              requestId: { type: 'string' },
            },
          },
        },
      },
      tags: [
        { name: 'Health', description: 'Health check endpoints' },
        { name: 'Resources', description: 'Resource management and access control' },
        { name: 'Users', description: 'User management operations' },
        { name: 'Reporting', description: 'Analytics and reporting endpoints' },
      ],
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
    staticCSP: true,
    transformStaticCSP: (header: string) => header,
  });

  // Register security plugins
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        objectSrc: ["'none'"],
        imgSrc: ["'self'", 'data:', 'https:'],
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
  await app.register(sharingRoutes);

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
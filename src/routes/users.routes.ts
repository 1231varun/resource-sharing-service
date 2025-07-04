import { type FastifyInstance } from 'fastify';
import { UserService } from '@/domains';
import { AppError, toApiError } from '@/utils/errors';

const userService = new UserService();

export async function userRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /users - List all users with pagination
  fastify.get('/users', {
    schema: {
      tags: ['Users'],
      summary: 'List users',
      description: 'Returns a paginated list of all users in the system.',
      querystring: {
        type: 'object',
        properties: {
          limit: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 50,
            description: 'Maximum number of users to return',
          },
          offset: {
            type: 'integer',
            minimum: 0,
            default: 0,
            description: 'Number of users to skip',
          },
        },
      },
      response: {
        200: {
          description: 'Users retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                users: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string', format: 'uuid' },
                      name: { type: 'string' },
                      email: { type: 'string', format: 'email' },
                      createdAt: { type: 'string', format: 'date-time' },
                      updatedAt: { type: 'string', format: 'date-time' },
                    },
                  },
                },
                pagination: {
                  type: 'object',
                  properties: {
                    total: { type: 'integer', minimum: 0 },
                    limit: { type: 'integer', minimum: 1 },
                    offset: { type: 'integer', minimum: 0 },
                    hasMore: { type: 'boolean' },
                  },
                },
              },
            },
          },
        },
        500: {
          description: 'Internal server error',
          type: 'object',
          properties: {
            success: { type: 'boolean', enum: [false] },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
              },
            },
            requestId: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const query = request.query as {
        limit?: number;
        offset?: number;
      };
      
      const users = await userService.getUsers(
        query.limit || 50,
        query.offset || 0
      );
      
      const total = users.length; // Simple approach since we don't have a count method
      
      return reply.send({
        success: true,
        data: {
          users,
          pagination: {
            total,
            limit: query.limit || 50,
            offset: query.offset || 0,
            hasMore: users.length === (query.limit || 50),
          },
        },
      });
    } catch (error) {
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send({
          success: false,
          error: toApiError(error),
          requestId: request.id,
        });
      }
      
      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
        requestId: request.id,
      });
    }
  });

  // GET /users/:id - Get single user
  fastify.get('/users/:id', {
    schema: {
      tags: ['Users'],
      summary: 'Get user by ID',
      description: 'Returns a single user by their unique identifier.',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'User ID',
          },
        },
      },
      response: {
        200: {
          description: 'User retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                user: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    name: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
        },
        404: {
          description: 'User not found',
          type: 'object',
          properties: {
            success: { type: 'boolean', enum: [false] },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
              },
            },
            requestId: { type: 'string' },
          },
        },
        500: {
          description: 'Internal server error',
          type: 'object',
          properties: {
            success: { type: 'boolean', enum: [false] },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
              },
            },
            requestId: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const user = await userService.getUserById(id);
      
      if (!user) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
          },
          requestId: request.id,
        });
      }
      
      return reply.send({
        success: true,
        data: { user },
      });
    } catch (error) {
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send({
          success: false,
          error: toApiError(error),
          requestId: request.id,
        });
      }
      
      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
        requestId: request.id,
      });
    }
  });
} 
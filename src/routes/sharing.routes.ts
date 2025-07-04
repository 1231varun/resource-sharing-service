import { type FastifyInstance } from 'fastify';
import { SharingService } from '@/domains';
import { AppError, toApiError } from '@/utils/errors';

const sharingService = new SharingService();

export async function sharingRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/resource/:id/access-list', {
    schema: {
      tags: ['Resources'],
      summary: 'Get resource access list',
      description: 'Returns all users who have access to a specific resource through direct sharing, group membership, or global access.',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Resource ID',
          },
        },
      },
      response: {
        200: {
          description: 'Resource access list retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                resource: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    name: { type: 'string' },
                    description: { type: 'string', nullable: true },
                    isGlobal: { type: 'boolean' },
                    createdAt: { type: 'string', format: 'date-time' },
                  },
                },
                users: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string', format: 'uuid' },
                      name: { type: 'string' },
                      email: { type: 'string', format: 'email' },
                      accessType: { type: 'string', enum: ['direct', 'group', 'global'] },
                      createdAt: { type: 'string', format: 'date-time' },
                    },
                  },
                },
                metadata: {
                  type: 'object',
                  properties: {
                    totalUsers: { type: 'integer', minimum: 0 },
                    directShares: { type: 'integer', minimum: 0 },
                    groupShares: { type: 'integer', minimum: 0 },
                    isGlobal: { type: 'boolean' },
                  },
                },
              },
            },
          },
        },
         404: {
           description: 'Resource not found',
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
      const data = await sharingService.getResourceAccessList(id);
      
      return reply.send({
        success: true,
        data,
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

  fastify.get('/user/:id/access-check/:resourceId', {
    schema: {
      tags: ['Resources'],
      summary: 'Check user access to resource',
      description: 'Fast access check to determine if a user has access to a specific resource.',
      params: {
        type: 'object',
        required: ['id', 'resourceId'],
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'User ID',
          },
          resourceId: {
            type: 'string',
            format: 'uuid',
            description: 'Resource ID',
          },
        },
      },
      response: {
        200: {
          description: 'Access check completed',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                hasAccess: { type: 'boolean' },
                accessType: { type: 'string', enum: ['direct', 'group', 'global'] },
                grantedAt: { type: 'string', format: 'date-time' },
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
      const { id, resourceId } = request.params as { id: string; resourceId: string };
      const data = await sharingService.checkUserAccess(id, resourceId);
      
      return reply.send({
        success: true,
        data,
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

  fastify.get('/resources/stats', {
    schema: {
      tags: ['Reporting'],
      summary: 'Get basic resource statistics',
      description: 'Returns statistics about resources with user access counts.',
      querystring: {
        type: 'object',
        properties: {
          limit: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 50,
            description: 'Maximum number of resources to return',
          },
          offset: {
            type: 'integer',
            minimum: 0,
            default: 0,
            description: 'Number of resources to skip',
          },
          minUsers: {
            type: 'integer',
            minimum: 0,
            default: 0,
            description: 'Filter resources with at least N users',
          },
        },
      },
      response: {
        200: {
          description: 'Resource statistics retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                resources: {
                  type: 'array',
                  items: {
                    type: 'object',
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
                summary: {
                  type: 'object',
                  properties: {
                    totalResources: { type: 'integer', minimum: 0 },
                    globalResources: { type: 'integer', minimum: 0 },
                    totalUniqueUsers: { type: 'integer', minimum: 0 },
                    avgUsersPerResource: { type: 'number', minimum: 0 },
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
        minUsers?: number;
      };
      
      const data = await sharingService.getResourcesWithUserCount({
        limit: query.limit || 50,
        offset: query.offset || 0,
        minUsers: query.minUsers || 0,
      });
      
      return reply.send({
        success: true,
        data,
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
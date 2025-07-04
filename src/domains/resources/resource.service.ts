import { db } from '@/infrastructure/database';
import type { Resource } from '@/types';
import { createNotFoundError, createDatabaseError } from '@/utils/errors';

export class ResourceService {
  /**
   * Get resource by ID
   */
  async getResourceById(id: string): Promise<Resource | null> {
    try {
      const resource = await db.resource.findUnique({
        where: { id },
      });
      return resource;
    } catch (error) {
      throw createDatabaseError(`Failed to get resource: ${error}`);
    }
  }

  /**
   * Get all resources with pagination
   */
  async getResources(limit: number = 50, offset: number = 0): Promise<Resource[]> {
    try {
      return await db.resource.findMany({
        take: limit,
        skip: offset,
        orderBy: { name: 'asc' },
      });
    } catch (error) {
      throw createDatabaseError(`Failed to get resources: ${error}`);
    }
  }

  /**
   * Create a new resource
   */
  async createResource(resourceData: {
    name: string;
    description?: string;
    isGlobal?: boolean;
  }): Promise<Resource> {
    try {
      return await db.resource.create({
        data: {
          name: resourceData.name,
          description: resourceData.description || null,
          isGlobal: resourceData.isGlobal || false,
        },
      });
    } catch (error) {
      throw createDatabaseError(`Failed to create resource: ${error}`);
    }
  }

  /**
   * Update a resource
   */
  async updateResource(
    id: string,
    updates: {
      name?: string;
      description?: string;
      isGlobal?: boolean;
    }
  ): Promise<Resource> {
    try {
      const resource = await db.resource.findUnique({
        where: { id },
        select: { id: true },
      });

      if (!resource) {
        throw createNotFoundError('Resource', id);
      }

      return await db.resource.update({
        where: { id },
        data: updates,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'AppError') {
        throw error;
      }
      throw createDatabaseError(`Failed to update resource: ${error}`);
    }
  }

  /**
   * Delete a resource
   */
  async deleteResource(id: string): Promise<void> {
    try {
      const resource = await db.resource.findUnique({
        where: { id },
        select: { id: true },
      });

      if (!resource) {
        throw createNotFoundError('Resource', id);
      }

      await db.resource.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'AppError') {
        throw error;
      }
      throw createDatabaseError(`Failed to delete resource: ${error}`);
    }
  }

  /**
   * Get all global resources
   */
  async getGlobalResources(): Promise<Resource[]> {
    try {
      return await db.resource.findMany({
        where: { isGlobal: true },
        orderBy: { name: 'asc' },
      });
    } catch (error) {
      throw createDatabaseError(`Failed to get global resources: ${error}`);
    }
  }

  /**
   * Check if resource exists
   */
  async resourceExists(id: string): Promise<boolean> {
    try {
      const resource = await db.resource.findUnique({
        where: { id },
        select: { id: true },
      });
      return resource !== null;
    } catch (error) {
      throw createDatabaseError(`Failed to check resource existence: ${error}`);
    }
  }
} 
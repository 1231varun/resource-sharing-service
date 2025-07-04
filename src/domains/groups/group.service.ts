import { db } from '@/infrastructure/database';
import type { Group } from '@/types';
import { createNotFoundError, createDatabaseError } from '@/utils/errors';

export class GroupService {
  /**
   * Get group by ID
   */
  async getGroupById(id: string): Promise<Group | null> {
    try {
      const group = await db.group.findUnique({
        where: { id },
      });
      return group;
    } catch (error) {
      throw createDatabaseError(`Failed to get group: ${error}`);
    }
  }

  /**
   * Get all groups with pagination
   */
  async getGroups(limit: number = 50, offset: number = 0): Promise<Group[]> {
    try {
      return await db.group.findMany({
        take: limit,
        skip: offset,
        orderBy: { name: 'asc' },
      });
    } catch (error) {
      throw createDatabaseError(`Failed to get groups: ${error}`);
    }
  }

  /**
   * Create a new group
   */
  async createGroup(groupData: { name: string; description?: string }): Promise<Group> {
    try {
      return await db.group.create({
        data: groupData,
      });
    } catch (error) {
      throw createDatabaseError(`Failed to create group: ${error}`);
    }
  }

  /**
   * Add user to group
   */
  async addUserToGroup(userId: string, groupId: string): Promise<void> {
    try {
      // Check if user exists
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });
      if (!user) {
        throw createNotFoundError('User', userId);
      }

      // Check if group exists
      const group = await db.group.findUnique({
        where: { id: groupId },
        select: { id: true },
      });
      if (!group) {
        throw createNotFoundError('Group', groupId);
      }

      // Add user to group (will fail silently if already exists due to unique constraint)
      await db.userGroup.create({
        data: {
          userId,
          groupId,
        },
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'AppError') {
        throw error;
      }
      // Ignore unique constraint errors (user already in group)
      if (error instanceof Error && error.message.includes('Unique constraint')) {
        return;
      }
      throw createDatabaseError(`Failed to add user to group: ${error}`);
    }
  }

  /**
   * Remove user from group
   */
  async removeUserFromGroup(userId: string, groupId: string): Promise<void> {
    try {
      await db.userGroup.deleteMany({
        where: {
          userId,
          groupId,
        },
      });
    } catch (error) {
      throw createDatabaseError(`Failed to remove user from group: ${error}`);
    }
  }

  /**
   * Get all users in a group
   */
  async getGroupUsers(groupId: string): Promise<any[]> {
    try {
      const group = await db.group.findUnique({
        where: { id: groupId },
        select: { id: true },
      });

      if (!group) {
        throw createNotFoundError('Group', groupId);
      }

      return await db.user.findMany({
        where: {
          userGroups: {
            some: {
              groupId,
            },
          },
        },
        select: { id: true, name: true, email: true },
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'AppError') {
        throw error;
      }
      throw createDatabaseError(`Failed to get group users: ${error}`);
    }
  }

  /**
   * Get all groups a user belongs to
   */
  async getUserGroups(userId: string): Promise<Group[]> {
    try {
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });

      if (!user) {
        throw createNotFoundError('User', userId);
      }

      return await db.group.findMany({
        where: {
          userGroups: {
            some: {
              userId,
            },
          },
        },
        orderBy: { name: 'asc' },
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'AppError') {
        throw error;
      }
      throw createDatabaseError(`Failed to get user groups: ${error}`);
    }
  }

  /**
   * Check if group exists
   */
  async groupExists(id: string): Promise<boolean> {
    try {
      const group = await db.group.findUnique({
        where: { id },
        select: { id: true },
      });
      return group !== null;
    } catch (error) {
      throw createDatabaseError(`Failed to check group existence: ${error}`);
    }
  }
} 
import { db } from '@/infrastructure/database';
import type {
  AccessCheckResult,
  ShareCreationParams,
} from '@/types';
import { createNotFoundError, createDatabaseError } from '@/utils/errors';

export class SharingService {
  /**
   * Check if a user has access to a specific resource
   * Fast access check for permission validation
   */
  async checkUserAccess(userId: string, resourceId: string): Promise<AccessCheckResult> {
    try {
      // First check if resource exists and if it's global
      const resource = await db.resource.findUnique({
        where: { id: resourceId },
        select: { isGlobal: true },
      });

      if (!resource) {
        return { hasAccess: false };
      }

      if (resource.isGlobal) {
        return { hasAccess: true, accessType: 'global' };
      }

      // Check direct access
      const directAccess = await db.resourceShare.findFirst({
        where: {
          resourceId,
          shareType: 'user',
          targetId: userId,
        },
        select: { createdAt: true },
      });

      if (directAccess) {
        return {
          hasAccess: true,
          accessType: 'direct',
          grantedAt: directAccess.createdAt,
        };
      }

      // Check group access
      const userGroups = await db.userGroup.findMany({
        where: { userId },
        select: { groupId: true },
      });

      const groupIds = userGroups.map((ug: any) => ug.groupId);

      if (groupIds.length > 0) {
        const groupAccess = await db.resourceShare.findFirst({
          where: {
            resourceId,
            shareType: 'group',
            targetId: { in: groupIds },
          },
          select: { createdAt: true },
        });

        if (groupAccess) {
          return {
            hasAccess: true,
            accessType: 'group',
            grantedAt: groupAccess.createdAt,
          };
        }
      }

      return { hasAccess: false };
    } catch (error) {
      throw createDatabaseError(`Failed to check user access: ${error}`);
    }
  }

  /**
   * Create a new resource share
   */
  async createShare(params: ShareCreationParams): Promise<void> {
    try {
      // Validate that the resource exists
      const resource = await db.resource.findUnique({
        where: { id: params.resourceId },
        select: { id: true },
      });

      if (!resource) {
        throw createNotFoundError('Resource', params.resourceId);
      }

      // Validate that the target exists based on share type
      if (params.shareType === 'user') {
        const user = await db.user.findUnique({
          where: { id: params.targetId },
          select: { id: true },
        });
        if (!user) {
          throw createNotFoundError('User', params.targetId);
        }
      } else if (params.shareType === 'group') {
        const group = await db.group.findUnique({
          where: { id: params.targetId },
          select: { id: true },
        });
        if (!group) {
          throw createNotFoundError('Group', params.targetId);
        }
      }

      // Create the share
      await db.resourceShare.create({
        data: {
          resourceId: params.resourceId,
          shareType: params.shareType,
          targetId: params.targetId,
        },
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'AppError') {
        throw error;
      }
      throw createDatabaseError(`Failed to create share: ${error}`);
    }
  }

  /**
   * Remove a resource share
   */
  async removeShare(resourceId: string, shareType: 'user' | 'group', targetId: string): Promise<void> {
    try {
      await db.resourceShare.deleteMany({
        where: {
          resourceId,
          shareType,
          targetId,
        },
      });
    } catch (error) {
      throw createDatabaseError(`Failed to remove share: ${error}`);
    }
  }

  /**
   * Get all users who have direct access to a resource
   */
  async getDirectUsers(resourceId: string): Promise<any[]> {
    try {
      return await db.user.findMany({
        where: {
          id: {
            in: await db.resourceShare
              .findMany({
                where: { resourceId, shareType: 'user' },
                select: { targetId: true },
              })
              .then((shares: any[]) => shares.map((s: any) => s.targetId)),
          },
        },
        select: { id: true, name: true, email: true },
      });
    } catch (error) {
      throw createDatabaseError(`Failed to get direct users: ${error}`);
    }
  }

  /**
   * Get all groups that have access to a resource
   */
  async getResourceGroups(resourceId: string): Promise<any[]> {
    try {
      return await db.group.findMany({
        where: {
          id: {
            in: await db.resourceShare
              .findMany({
                where: { resourceId, shareType: 'group' },
                select: { targetId: true },
              })
              .then((shares: any[]) => shares.map((s: any) => s.targetId)),
          },
        },
        select: { id: true, name: true, description: true },
      });
    } catch (error) {
      throw createDatabaseError(`Failed to get resource groups: ${error}`);
    }
  }

  /**
   * Get basic access statistics for a resource
   */
  async getResourceStats(resourceId: string): Promise<{
    directUserCount: number;
    groupCount: number;
    isGlobal: boolean;
  }> {
    try {
      const resource = await db.resource.findUnique({
        where: { id: resourceId },
        select: { isGlobal: true },
      });

      if (!resource) {
        throw createNotFoundError('Resource', resourceId);
      }

      if (resource.isGlobal) {
        return {
          directUserCount: 0,
          groupCount: 0,
          isGlobal: true,
        };
      }

      const [directUserCount, groupCount] = await Promise.all([
        db.resourceShare.count({
          where: { resourceId, shareType: 'user' },
        }),
        db.resourceShare.count({
          where: { resourceId, shareType: 'group' },
        }),
      ]);

      return {
        directUserCount,
        groupCount,
        isGlobal: false,
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AppError') {
        throw error;
      }
      throw createDatabaseError(`Failed to get resource stats: ${error}`);
    }
  }
} 
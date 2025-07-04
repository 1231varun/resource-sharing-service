import { db } from '@/infrastructure/database';
import type {
  AccessCheckResult,
  AccessType,
  ResourceAccessListResponse,
  ResourceWithUserCount,
  ShareCreationParams,
  UserResourcesResponse,
  UserWithAccessType,
  UserWithResourceCount,
  PaginationParams,
  ResourceFilters,
  UserFilters,
} from '@/types';
import { createNotFoundError, createDatabaseError } from '@/utils/errors';

export class SharingService {
  /**
   * Get all users who have access to a specific resource
   * Handles deduplication for overlapping permissions (direct + group + global)
   */
  async getResourceAccessList(resourceId: string): Promise<ResourceAccessListResponse> {
    try {
      // First check if resource exists and if it's global
      const resource = await db.resource.findUnique({
        where: { id: resourceId },
      });

      if (!resource) {
        throw createNotFoundError('Resource', resourceId);
      }

      // If resource is global, return all users
      if (resource.isGlobal) {
        const allUsers = await db.user.findMany({
          select: { id: true, name: true, email: true },
        });

        const usersWithAccess: UserWithAccessType[] = allUsers.map((user: any) => ({
          ...user,
          createdAt: new Date(), // This would normally come from the query
          accessType: 'global' as AccessType,
        }));

        return {
          resource,
          users: usersWithAccess,
          metadata: {
            totalUsers: allUsers.length,
            directShares: 0,
            groupShares: 0,
            isGlobal: true,
          },
        };
      }

      // For non-global resources, get specific access via parameterized query
      interface AccessQueryResult {
        id: string;
        name: string;
        email: string;
        access_type: 'direct' | 'group';
      }

      const usersWithAccess = await db.$queryRaw<AccessQueryResult[]>`
        WITH direct_users AS (
          SELECT u.id, u.name, u.email, 'direct'::text as access_type
          FROM users u
          JOIN resource_shares rs ON u.id = rs.target_id
          WHERE rs.resource_id = ${resourceId} AND rs.share_type = 'user'
        ),
        group_users AS (
          SELECT u.id, u.name, u.email, 'group'::text as access_type
          FROM users u
          JOIN user_groups ug ON u.id = ug.user_id
          JOIN resource_shares rs ON ug.group_id = rs.target_id
          WHERE rs.resource_id = ${resourceId} AND rs.share_type = 'group'
        ),
        all_access AS (
          SELECT * FROM direct_users
          UNION
          SELECT * FROM group_users
        )
        SELECT DISTINCT id, name, email, access_type
        FROM all_access
        ORDER BY name
      `;

      // Get metadata counts
      const [directCount, groupCount] = await Promise.all([
        db.resourceShare.count({
          where: { resourceId, shareType: 'user' },
        }),
        db.resourceShare.count({
          where: { resourceId, shareType: 'group' },
        }),
      ]);

      return {
        resource,
        users: usersWithAccess.map((user) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          accessType: user.access_type as AccessType,
          createdAt: new Date(), // This would normally come from the query
        })),
        metadata: {
          totalUsers: usersWithAccess.length,
          directShares: directCount,
          groupShares: groupCount,
          isGlobal: false,
        },
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AppError') {
        throw error;
      }
      throw createDatabaseError(`Failed to get resource access list: ${error}`);
    }
  }

  /**
   * Get all resources accessible to a specific user
   * Includes pagination and sorting options
   */
  async getUserResources(
    userId: string,
    params: PaginationParams = {}
  ): Promise<UserResourcesResponse> {
    const { limit = 50, offset = 0, sort = 'name', order = 'asc' } = params;

    // Whitelist allowed sort columns
    const allowedSortColumns = ['name', 'createdAt'];
    const orderBy = allowedSortColumns.includes(sort) 
      ? { [sort]: order as 'asc' | 'desc' }
      : { name: 'asc' as const };

    try {
      // Check if user exists
      const user = await db.user.findUnique({
        where: { id: userId },
        include: {
          userGroups: true
        }
      });

      if (!user) {
        throw createNotFoundError('User', userId);
      }

      // Get user's group IDs
      const userGroupIds = user.userGroups.map(ug => ug.groupId);

      // Get all resources the user has access to
      const allResources = await db.resource.findMany({
        orderBy,
        include: {
          resourceShares: true
        }
      });

      // Process resources to determine access type
      const accessibleResources = allResources
        .map(resource => {
          if (resource.isGlobal) {
            return {
              id: resource.id,
              name: resource.name,
              description: resource.description,
              isGlobal: resource.isGlobal,
              accessType: 'global' as AccessType,
              createdAt: resource.createdAt,
              // No sharedAt for global resources
            };
          }

          // Check for direct access
          const directShare = resource.resourceShares.find(share =>
            share.shareType === 'user' && share.targetId === userId
          );
          
          if (directShare) {
            return {
              id: resource.id,
              name: resource.name,
              description: resource.description,
              isGlobal: resource.isGlobal,
              accessType: 'direct' as AccessType,
              createdAt: resource.createdAt,
              sharedAt: directShare.createdAt,
            };
          }

          // Check for group access
          const groupShare = resource.resourceShares.find(share =>
            share.shareType === 'group' && userGroupIds.includes(share.targetId)
          );
          
          if (groupShare) {
            return {
              id: resource.id,
              name: resource.name,
              description: resource.description,
              isGlobal: resource.isGlobal,
              accessType: 'group' as AccessType,
              createdAt: resource.createdAt,
              sharedAt: groupShare.createdAt,
            };
          }

          return null; // No access
        })
        .filter(resource => resource !== null);

      // Apply pagination
      const paginatedResources = accessibleResources.slice(offset, offset + limit);

      // Sort by access type if that was requested (since we can't do it in the query)
      if (sort === 'access_type') {
        paginatedResources.sort((a, b) => {
          const diff = a.accessType.localeCompare(b.accessType);
          return order === 'desc' ? -diff : diff;
        });
      }

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
        },
        resources: paginatedResources.map(r => {
          const resource: any = {
            id: r.id,
            name: r.name,
            description: r.description,
            isGlobal: r.isGlobal,
            accessType: r.accessType,
            createdAt: r.createdAt,
          };
          if (r.sharedAt) {
            resource.sharedAt = r.sharedAt;
          }
          return resource;
        }),
        pagination: {
          total: accessibleResources.length,
          limit,
          offset,
          hasMore: offset + limit < accessibleResources.length,
        },
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AppError') {
        throw error;
      }
      throw createDatabaseError(`Failed to get user resources: ${error}`);
    }
  }

  /**
   * Check if a user has access to a specific resource
   * Fast access check for permission validation
   */
  async checkUserAccess(userId: string, resourceId: string): Promise<AccessCheckResult> {
    try {
      // First check if resource is global
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
      const groupAccess = await db.resourceShare.findFirst({
        where: {
          resourceId,
          shareType: 'group',
          targetId: {
            in: await db.userGroup
              .findMany({
                where: { userId },
                select: { groupId: true },
              })
              .then((groups: any[]) => groups.map((g: any) => g.groupId)),
          },
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
      await db.resourceShare.create({
        data: {
          resourceId: params.resourceId,
          shareType: params.shareType,
          targetId: params.targetId,
        },
      });
    } catch (error) {
      throw createDatabaseError(`Failed to create share: ${error}`);
    }
  }

  /**
   * Get resource statistics with user counts
   * For reporting and analytics
   */
  async getResourcesWithUserCount(filters: ResourceFilters = {}): Promise<{
    resources: ResourceWithUserCount[];
    pagination: any;
    summary: any;
  }> {
    const { limit = 50, offset = 0, minUsers = 0, sort = 'name', order = 'asc' } = filters;

    // Whitelist allowed sort columns for basic resource properties
    const allowedResourceSorts = ['name', 'createdAt'];
    const orderBy = allowedResourceSorts.includes(sort) 
      ? { [sort]: order as 'asc' | 'desc' }
      : { name: 'asc' as const };

    try {
      // Get resources with basic info using Prisma's query builder
      const resources = await db.resource.findMany({
        take: limit,
        skip: offset,
        orderBy,
        include: {
          resourceShares: true
        }
      });

      // Get all users and user groups for calculations
      const totalUsers = await db.user.count();
      const allUserGroups = await db.userGroup.findMany();

      // Process resources and calculate user counts in TypeScript
      const processedResources = resources.map(resource => {
        if (resource.isGlobal) {
          // Global resources are accessible by all users
          return {
            id: resource.id,
            name: resource.name,
            description: resource.description,
            isGlobal: resource.isGlobal,
            createdAt: resource.createdAt,
            userCount: totalUsers,
            directShares: 0,
            groupShares: 0,
          };
        }

        // For non-global resources, calculate unique user access
        const directUserIds = new Set<string>();
        const groupUserIds = new Set<string>();
        let directShareCount = 0;
        let groupShareCount = 0;

        resource.resourceShares.forEach(share => {
          if (share.shareType === 'user') {
            directUserIds.add(share.targetId);
            directShareCount++;
          } else if (share.shareType === 'group') {
            groupShareCount++;
            // Find all users in this group
            allUserGroups
              .filter(ug => ug.groupId === share.targetId)
              .forEach(ug => groupUserIds.add(ug.userId));
          }
        });

        // Calculate total unique users (deduplicated)
        const allUserIds = new Set([...directUserIds, ...groupUserIds]);

        return {
          id: resource.id,
          name: resource.name,
          description: resource.description,
          isGlobal: resource.isGlobal,
          createdAt: resource.createdAt,
          userCount: allUserIds.size,
          directShares: directShareCount,
          groupShares: groupShareCount,
        };
      });

      // Filter by minimum users if specified
      const filteredResources = processedResources.filter(resource => 
        resource.userCount >= minUsers
      );

      // Sort by user count if that was requested (since we can't do it in the query)
      if (sort === 'user_count') {
        filteredResources.sort((a, b) => {
          const diff = a.userCount - b.userCount;
          return order === 'desc' ? -diff : diff;
        });
      }

      // Get summary statistics
      const totalResources = await db.resource.count();
      const globalResources = await db.resource.count({
        where: { isGlobal: true }
      });

      return {
        resources: filteredResources,
        pagination: {
          total: filteredResources.length,
          limit,
          offset,
          hasMore: filteredResources.length === limit,
        },
        summary: {
          totalResources,
          globalResources,
          totalUniqueUsers: totalUsers,
          avgUsersPerResource: filteredResources.length > 0 
            ? filteredResources.reduce((sum, r) => sum + r.userCount, 0) / filteredResources.length 
            : 0,
        },
      };
    } catch (error) {
      throw createDatabaseError(`Failed to get resources with user count: ${error}`);
    }
  }

  /**
   * Get user statistics with resource counts
   * For reporting and analytics
   */
  async getUsersWithResourceCount(filters: UserFilters = {}): Promise<{
    users: UserWithResourceCount[];
    pagination: any;
    summary: any;
  }> {
    const { limit = 50, offset = 0, minResources = 0, sort = 'name', order = 'asc' } = filters;

    // Whitelist allowed sort columns for basic user properties
    const allowedUserSorts = ['name', 'email', 'createdAt'];
    const orderBy = allowedUserSorts.includes(sort) 
      ? { [sort]: order as 'asc' | 'desc' }
      : { name: 'asc' as const };

    try {
      // Get users with basic info using Prisma's query builder
      const users = await db.user.findMany({
        take: limit,
        skip: offset,
        orderBy,
        include: {
          userGroups: {
            include: {
              group: true
            }
          }
        }
      });

      // Get all resource shares to process manually (since they're polymorphic)
      const allResourceShares = await db.resourceShare.findMany({
        include: {
          resource: true
        }
      });

      // Get global resources count once
      const globalResourcesCount = await db.resource.count({
        where: { isGlobal: true }
      });

      // Get total counts for summary
      const totalUsers = await db.user.count();
      const totalResources = await db.resource.count();

      // Process users and calculate resource counts in TypeScript
      const processedUsers = users.map(user => {
        // Get user's group IDs
        const userGroupIds = user.userGroups.map(ug => ug.groupId);
        
        // Find direct resource shares for this user
        const directShares = allResourceShares.filter(share => 
          share.shareType === 'user' && share.targetId === user.id
        );
        
        // Find group resource shares for this user's groups
        const groupShares = allResourceShares.filter(share => 
          share.shareType === 'group' && userGroupIds.includes(share.targetId)
        );

        // Calculate unique resources (deduplicated)
        const allResourceIds = new Set<string>();
        
        // Add direct resources
        directShares.forEach(share => allResourceIds.add(share.resourceId));
        
        // Add group resources
        groupShares.forEach(share => allResourceIds.add(share.resourceId));
        
        // Total unique resources + global resources
        const totalResourceCount = allResourceIds.size + globalResourcesCount;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
          resourceCount: totalResourceCount,
          directResources: directShares.length,
          groupResources: groupShares.length,
          globalResources: globalResourcesCount,
        };
      });

      // Filter by minimum resources if specified
      const filteredUsers = processedUsers.filter(user => 
        user.resourceCount >= minResources
      );

      // Sort by resource count if that was requested (since we can't do it in the query)
      if (sort === 'resource_count') {
        filteredUsers.sort((a, b) => {
          const diff = a.resourceCount - b.resourceCount;
          return order === 'desc' ? -diff : diff;
        });
      }

      return {
        users: filteredUsers,
        pagination: {
          total: filteredUsers.length,
          limit,
          offset,
          hasMore: filteredUsers.length === limit,
        },
        summary: {
          totalUsers,
          totalResources,
          avgResourcesPerUser: filteredUsers.length > 0 
            ? filteredUsers.reduce((sum, u) => sum + u.resourceCount, 0) / filteredUsers.length 
            : 0,
        },
      };
    } catch (error) {
      throw createDatabaseError(`Failed to get users with resource count: ${error}`);
    }
  }
} 
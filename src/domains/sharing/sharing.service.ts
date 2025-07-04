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

      // For non-global resources, get specific access via complex query
      const accessQuery = `
        WITH direct_users AS (
          SELECT u.id, u.name, u.email, 'direct' as access_type
          FROM users u
          JOIN resource_shares rs ON u.id = rs.target_id
          WHERE rs.resource_id = $1 AND rs.share_type = 'user'
        ),
        group_users AS (
          SELECT u.id, u.name, u.email, 'group' as access_type
          FROM users u
          JOIN user_groups ug ON u.id = ug.user_id
          JOIN resource_shares rs ON ug.group_id = rs.target_id
          WHERE rs.resource_id = $1 AND rs.share_type = 'group'
        ),
        all_access AS (
          SELECT * FROM direct_users
          UNION
          SELECT * FROM group_users
        )
        SELECT DISTINCT id, name, email, access_type
        FROM all_access
        ORDER BY name;
      `;

      const usersWithAccess = await db.$queryRawUnsafe(
        accessQuery,
        resourceId
      ) as UserWithAccessType[];

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
        users: usersWithAccess.map((user: any) => ({
          ...user,
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

    try {
      // Check if user exists
      const user = await db.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw createNotFoundError('User', userId);
      }

      // Complex query to get all accessible resources
      const resourcesQuery = `
        WITH user_resources AS (
          -- Global resources
          SELECT r.id, r.name, r.description, r.is_global, r.created_at, 'global' as access_type, NULL as shared_at
          FROM resources r
          WHERE r.is_global = true
          
          UNION
          
          -- Direct shares
          SELECT r.id, r.name, r.description, r.is_global, r.created_at, 'direct' as access_type, rs.created_at as shared_at
          FROM resources r
          JOIN resource_shares rs ON r.id = rs.resource_id
          WHERE rs.share_type = 'user' AND rs.target_id = $1
          
          UNION
          
          -- Group shares
          SELECT r.id, r.name, r.description, r.is_global, r.created_at, 'group' as access_type, rs.created_at as shared_at
          FROM resources r
          JOIN resource_shares rs ON r.id = rs.resource_id
          JOIN user_groups ug ON rs.target_id = ug.group_id
          WHERE rs.share_type = 'group' AND ug.user_id = $1
        )
        SELECT DISTINCT id, name, description, is_global, created_at, access_type, shared_at
        FROM user_resources
        ORDER BY ${sort} ${order}
        LIMIT $2 OFFSET $3;
      `;

      const resources = await db.$queryRawUnsafe(
        resourcesQuery,
        userId,
        limit,
        offset
      ) as any[];

      // Get total count for pagination
      const totalQuery = `
        SELECT COUNT(DISTINCT r.id) as total
        FROM resources r
        LEFT JOIN resource_shares rs ON r.id = rs.resource_id
        LEFT JOIN user_groups ug ON rs.target_id = ug.group_id
        WHERE r.is_global = true
           OR (rs.share_type = 'user' AND rs.target_id = $1)
           OR (rs.share_type = 'group' AND ug.user_id = $1);
      `;

      const [{ total }] = await db.$queryRawUnsafe(
        totalQuery,
        userId
      ) as [{ total: number }];

      return {
        user,
        resources: resources.map((r: any) => ({
          ...r,
          isGlobal: r.is_global,
          createdAt: new Date(r.created_at),
          sharedAt: r.shared_at ? new Date(r.shared_at) : undefined,
        })),
        pagination: {
          total: Number(total),
          limit,
          offset,
          hasMore: offset + limit < Number(total),
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
    const { limit = 50, offset = 0, minUsers = 0, sort = 'user_count', order = 'desc' } = filters;

    try {
      // Complex aggregation query
      const resourcesQuery = `
        WITH resource_stats AS (
          SELECT 
            r.id,
            r.name,
            r.description,
            r.is_global,
            r.created_at,
            CASE 
              WHEN r.is_global = true THEN (SELECT COUNT(*) FROM users)
              ELSE (
                SELECT COUNT(DISTINCT user_id) FROM (
                  SELECT rs.target_id as user_id 
                  FROM resource_shares rs 
                  WHERE rs.resource_id = r.id AND rs.share_type = 'user'
                  UNION
                  SELECT ug.user_id 
                  FROM resource_shares rs
                  JOIN user_groups ug ON rs.target_id = ug.group_id
                  WHERE rs.resource_id = r.id AND rs.share_type = 'group'
                ) combined_access
              )
            END as user_count,
            (SELECT COUNT(*) FROM resource_shares WHERE resource_id = r.id AND share_type = 'user') as direct_shares,
            (SELECT COUNT(*) FROM resource_shares WHERE resource_id = r.id AND share_type = 'group') as group_shares
          FROM resources r
        )
        SELECT * FROM resource_stats
        WHERE user_count >= $1
        ORDER BY ${sort === 'user_count' ? 'user_count' : sort} ${order}
        LIMIT $2 OFFSET $3;
      `;

      const resources = await db.$queryRawUnsafe(
        resourcesQuery,
        minUsers,
        limit,
        offset
      ) as any[];

      // Summary statistics
      const summaryQuery = `
        SELECT 
          COUNT(*) as total_resources,
          COUNT(*) FILTER (WHERE is_global = true) as global_resources,
          (SELECT COUNT(*) FROM users) as total_unique_users
        FROM resources;
      `;

      const [summary] = await db.$queryRawUnsafe(summaryQuery) as any[];

      return {
        resources: resources.map((r: any) => ({
          ...r,
          isGlobal: r.is_global,
          createdAt: new Date(r.created_at),
          userCount: Number(r.user_count),
          directShares: Number(r.direct_shares),
          groupShares: Number(r.group_shares),
        })),
        pagination: {
          total: resources.length, // Simplified for demo
          limit,
          offset,
          hasMore: resources.length === limit,
        },
        summary: {
          totalResources: Number(summary.total_resources),
          globalResources: Number(summary.global_resources),
          totalUniqueUsers: Number(summary.total_unique_users),
          avgUsersPerResource: resources.length > 0 
            ? resources.reduce((sum: number, r: any) => sum + Number(r.user_count), 0) / resources.length 
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
    const { limit = 50, offset = 0, minResources = 0, sort = 'resource_count', order = 'desc' } = filters;

    try {
      const usersQuery = `
        SELECT 
          u.id,
          u.name,
          u.email,
          u.created_at,
          (
            SELECT COUNT(DISTINCT r.id)
            FROM resources r
            LEFT JOIN resource_shares rs ON r.id = rs.resource_id
            LEFT JOIN user_groups ug ON rs.target_id = ug.group_id
            WHERE r.is_global = true
               OR (rs.share_type = 'user' AND rs.target_id = u.id)
               OR (rs.share_type = 'group' AND ug.user_id = u.id)
          ) as resource_count,
          (
            SELECT COUNT(*) FROM resource_shares rs 
            WHERE rs.share_type = 'user' AND rs.target_id = u.id
          ) as direct_resources,
          (
            SELECT COUNT(DISTINCT rs.resource_id) 
            FROM resource_shares rs
            JOIN user_groups ug ON rs.target_id = ug.group_id
            WHERE rs.share_type = 'group' AND ug.user_id = u.id
          ) as group_resources,
          (SELECT COUNT(*) FROM resources WHERE is_global = true) as global_resources
        FROM users u
        HAVING resource_count >= $1
        ORDER BY ${sort} ${order}
        LIMIT $2 OFFSET $3;
      `;

      const users = await db.$queryRawUnsafe(
        usersQuery,
        minResources,
        limit,
        offset
      ) as any[];

      const summaryQuery = `
        SELECT 
          COUNT(*) as total_users,
          (SELECT COUNT(*) FROM resources) as total_resources
        FROM users;
      `;

      const [summary] = await db.$queryRawUnsafe(summaryQuery) as any[];

      return {
        users: users.map((u: any) => ({
          ...u,
          createdAt: new Date(u.created_at),
          resourceCount: Number(u.resource_count),
          directResources: Number(u.direct_resources),
          groupResources: Number(u.group_resources),
          globalResources: Number(u.global_resources),
        })),
        pagination: {
          total: users.length,
          limit,
          offset,
          hasMore: users.length === limit,
        },
        summary: {
          totalUsers: Number(summary.total_users),
          totalResources: Number(summary.total_resources),
          avgResourcesPerUser: users.length > 0 
            ? users.reduce((sum: number, u: any) => sum + Number(u.resource_count), 0) / users.length 
            : 0,
        },
      };
    } catch (error) {
      throw createDatabaseError(`Failed to get users with resource count: ${error}`);
    }
  }
} 
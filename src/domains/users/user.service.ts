import { db } from '@/infrastructure/database';
import type { User } from '@/types';
import { createDatabaseError } from '@/utils/errors';

export class UserService {
  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<User | null> {
    try {
      const user = await db.user.findUnique({
        where: { id },
      });
      return user;
    } catch (error) {
      throw createDatabaseError(`Failed to get user: ${error}`);
    }
  }

  /**
   * Get all users with pagination
   */
  async getUsers(limit: number = 50, offset: number = 0): Promise<User[]> {
    try {
      return await db.user.findMany({
        take: limit,
        skip: offset,
        orderBy: { name: 'asc' },
      });
    } catch (error) {
      throw createDatabaseError(`Failed to get users: ${error}`);
    }
  }

  /**
   * Create a new user
   */
  async createUser(userData: { name: string; email: string }): Promise<User> {
    try {
      return await db.user.create({
        data: userData,
      });
    } catch (error) {
      throw createDatabaseError(`Failed to create user: ${error}`);
    }
  }

  /**
   * Check if user exists
   */
  async userExists(id: string): Promise<boolean> {
    try {
      const user = await db.user.findUnique({
        where: { id },
        select: { id: true },
      });
      return user !== null;
    } catch (error) {
      throw createDatabaseError(`Failed to check user existence: ${error}`);
    }
  }
} 
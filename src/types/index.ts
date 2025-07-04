// Core entity types
export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
}

export interface Resource {
  id: string;
  name: string;
  description?: string;
  isGlobal: boolean;
  createdAt: Date;
}

export interface ResourceShare {
  id: string;
  resourceId: string;
  shareType: ShareType;
  targetId: string;
  createdAt: Date;
}

export type ShareType = 'user' | 'group';
export type AccessType = 'direct' | 'group' | 'global';

// API request/response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  requestId?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginationResponse {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

// Resource access list response
export interface ResourceAccessListResponse {
  resource: Resource;
  users: UserWithAccessType[];
  metadata: {
    totalUsers: number;
    directShares: number;
    groupShares: number;
    isGlobal: boolean;
  };
}

export interface UserWithAccessType extends User {
  accessType: AccessType;
}

// User resources response
export interface UserResourcesResponse {
  user: User;
  resources: ResourceWithAccessType[];
  pagination: PaginationResponse;
}

export interface ResourceWithAccessType extends Resource {
  accessType: AccessType;
  sharedAt?: Date;
}

// Reporting types
export interface ResourceWithUserCount extends Resource {
  userCount: number;
  directShares: number;
  groupShares: number;
}

export interface UserWithResourceCount extends User {
  resourceCount: number;
  directResources: number;
  groupResources: number;
  globalResources: number;
}

export interface ResourceCountSummary {
  totalResources: number;
  globalResources: number;
  totalUniqueUsers: number;
  avgUsersPerResource: number;
}

export interface UserCountSummary {
  totalUsers: number;
  totalResources: number;
  avgResourcesPerUser: number;
}

// Service layer types
export interface AccessCheckResult {
  hasAccess: boolean;
  accessType?: AccessType;
  grantedAt?: Date;
}

export interface ShareCreationParams {
  resourceId: string;
  shareType: ShareType;
  targetId: string;
}

// Database query filters
export interface ResourceFilters extends PaginationParams {
  minUsers?: number;
}

export interface UserFilters extends PaginationParams {
  minResources?: number;
}

// Configuration types
export interface DatabaseConfig {
  url: string;
}

export interface ServerConfig {
  port: number;
  env: string;
  apiVersion: string;
  apiBasePath: string;
}

export interface RateLimitConfig {
  max: number;
  windowMs: number;
}

export interface AppConfig {
  database: DatabaseConfig;
  server: ServerConfig;
  rateLimit: RateLimitConfig;
  cors: {
    origin: string;
  };
}

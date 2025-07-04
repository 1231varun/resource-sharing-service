# Design Decisions

This document captures the key architectural and design decisions made for the Resource Sharing Service, along with the rationale behind each choice.

## 🏗️ Architecture Decisions

### 1. Tech Stack Selection

**Decision**: Node.js + Fastify + TypeScript + PostgreSQL + Prisma

**Rationale**:
- **Fastify over Express**: 3x performance improvement for high-frequency access checks
- **TypeScript**: Essential for access control logic - prevents runtime errors in permission systems
- **PostgreSQL**: ACID compliance, excellent JSON aggregation, complex relational queries
- **Prisma**: Type-safe ORM, excellent migrations, query optimization capabilities

**Alternatives Considered**:
- Go + Gin: Higher performance but slower development within 5-hour constraint
- MongoDB: Rejected due to complex relational queries and ACID requirements

---

## 🗄️ Database Design Decisions

### 2. Global Sharing Strategy

**Decision**: Hybrid approach with `is_global` boolean flag on resources + polymorphic sharing table

**Schema**:
```sql
resources (
  id, name, description, is_global, created_at
)

resource_shares (
  id, resource_id, share_type, target_id, created_at
)
-- share_type: 'user' | 'group' (NO 'global' type)
```

**Rationale**:
1. **Performance**: Global check is O(1) with indexed boolean
2. **Deduplication**: Mutually exclusive counting - if global, count all users; else count specific shares
3. **Scalability**: No unnecessary "global" records polluting the shares table
4. **Query Simplicity**: Clean separation between global and specific access paths

**Alternatives Considered**:
- **Special "global" records**: Would create unnecessary table bloat and complex deduplication
- **Separate global_shares table**: Added complexity without performance benefits
- **JSON column approach**: Poor query performance and indexing capabilities

### 3. Polymorphic Sharing Table Design

**Decision**: Single `resource_shares` table with `share_type` and `target_id` columns

**Rationale**:
1. **Query Efficiency**: Single table with targeted indexes
2. **Maintainability**: One table to manage vs. multiple specialized tables
3. **Flexibility**: Easy to add new sharing types in the future
4. **Performance**: Efficient union queries with proper indexing

**Validation Strategy**:
- **Database Level**: Triggers to validate target_id references
- **Application Level**: TypeScript types + Zod validation
- **Dual Protection**: Prevents data corruption at both layers

### 4. User-Group Relationship

**Decision**: Traditional many-to-many junction table

```sql
user_groups (
  user_id, group_id, joined_at,
  PRIMARY KEY (user_id, group_id)
)
```

**Rationale**:
- **Standard Pattern**: Well-understood, optimizable
- **Performance**: Composite primary key enables fast lookups
- **Audit Trail**: `joined_at` for membership tracking

---

## 🚀 Performance Decisions

### 5. Indexing Strategy

**Decision**: Targeted composite indexes for common query patterns

```sql
-- Critical performance indexes
CREATE INDEX idx_resource_shares_resource_lookup ON resource_shares (resource_id, share_type);
CREATE INDEX idx_resource_shares_target_lookup ON resource_shares (target_id, target_type);
CREATE INDEX idx_user_groups_user ON user_groups (user_id);
CREATE INDEX idx_resources_global ON resources (is_global) WHERE is_global = true;
```

**Rationale**:
- **Access Check Optimization**: Fast lookups for user access validation
- **Aggregation Support**: Efficient counting for reporting endpoints
- **Partial Index**: Global resources index only when needed

### 6. Deduplication Strategy

**Decision**: Database-level DISTINCT in union queries + global flag separation

**Approach**:
```sql
-- If is_global = true: COUNT(*) FROM users
-- Else: COUNT(DISTINCT user_id) FROM union_query
```

**Rationale**:
- **Zero Double-Counting**: Global and specific shares are mutually exclusive in counting
- **Performance**: Database-level deduplication is faster than application-level
- **Correctness**: Handles overlapping permissions (direct + group) automatically

---

## 🔧 Implementation Decisions

### 7. API Design Philosophy

**Decision**: RESTful endpoints with clear resource-based URLs

**Endpoints**:
- `GET /resource/:id/access-list` - Resource-centric access information
- `GET /user/:id/resources` - User-centric resource listing
- `GET /resources/with-user-count` - Aggregation for reporting
- `GET /users/with-resource-count` - User access statistics

**Rationale**:
- **Intuitive**: Clear resource hierarchy and relationships
- **Cacheable**: RESTful design enables effective caching strategies
- **Scalable**: Easy to add pagination, filtering, and sorting

### 8. Error Handling Strategy

**Decision**: Structured error responses with Fastify error handling

**Approach**:
- HTTP status codes for error categories
- Consistent JSON error format
- Detailed error messages for development
- Sanitized messages for production

### 9. Validation Approach

**Decision**: Dual validation with Zod + Database constraints

**Rationale**:
- **Runtime Safety**: Zod catches type errors at API boundaries
- **Data Integrity**: Database constraints prevent corruption
- **Developer Experience**: TypeScript + Zod provides excellent IntelliSense

---

## 🎯 Future Considerations

### Identified Extension Points

1. **Audit Logging**: Current schema supports adding audit trail tables
2. **Permission Levels**: Can extend sharing types (read/write/admin)
3. **Time-based Access**: Schema supports adding expiration dates
4. **Resource Hierarchies**: Can add parent-child relationships to resources
5. **Caching Layer**: Redis integration points identified for high-traffic scenarios

### Performance Scaling Options

1. **Read Replicas**: For reporting endpoints
2. **Materialized Views**: For complex aggregations
3. **Query Optimization**: Connection pooling and query caching
4. **Horizontal Scaling**: Database sharding strategies identified

---

## 📝 Decision Log

| Decision | Date | Rationale | Impact |
|----------|------|-----------|---------|
| Fastify over Express | Dec 2024 | 3x performance improvement | High |
| Hybrid global sharing | Dec 2024 | Deduplication + performance | High |
| Polymorphic shares table | Dec 2024 | Query efficiency + flexibility | Medium |
| TypeScript strict mode | Dec 2024 | Type safety in access control | High |
| Dual validation strategy | Dec 2024 | Data integrity + DX | Medium |

---

*This document should be updated when new architectural decisions are made.* 
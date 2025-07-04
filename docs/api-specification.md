# API Specification

This document provides complete API documentation for the Resource Sharing Service endpoints.

## 📋 Overview

The Resource Sharing Service provides RESTful APIs for managing resource access control with multi-level sharing capabilities.

**Base URL**: `http://localhost:3000`

**Content Type**: `application/json`

**Authentication**: *To be implemented in future versions*

---

## 🔧 Core Endpoints

### 1. Resource Access List

**Endpoint**: `GET /resource/:id/access-list`

**Description**: Returns all users who have access to a specific resource through direct sharing, group membership, or global access.

**Path Parameters**:
- `id` (UUID, required): Resource identifier

**Response Format**:
```typescript
{
  "success": boolean,
  "data": {
    "resource": {
      "id": string,
      "name": string,
      "description": string | null,
      "isGlobal": boolean,
      "createdAt": string // ISO 8601 timestamp
    },
    "users": Array<{
      "id": string,
      "name": string,
      "email": string,
      "accessType": "direct" | "group" | "global",
      "createdAt": string // ISO 8601 timestamp
    }>,
    "metadata": {
      "totalUsers": number,
      "directShares": number,
      "groupShares": number,
      "isGlobal": boolean
    }
  }
}
```

**Example Request**:
```bash
GET /resource/123e4567-e89b-12d3-a456-426614174000/access-list
```

**Example Response**:
```json
{
  "success": true,
  "data": {
    "resource": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Project Documentation",
      "description": "Internal project docs",
      "isGlobal": false,
      "createdAt": "2024-01-01T00:00:00Z"
    },
    "users": [
      {
        "id": "user-123",
        "name": "John Doe",
        "email": "john@example.com",
        "accessType": "direct",
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "metadata": {
      "totalUsers": 1,
      "directShares": 1,
      "groupShares": 0,
      "isGlobal": false
    }
  }
}
```

**Error Responses**:
- `404`: Resource not found
- `400`: Invalid UUID format

---

### 2. User Resources

**Endpoint**: `GET /user/:id/resources`

**Description**: Returns all resources that a specific user has access to through any sharing mechanism.

**Path Parameters**:
- `id` (UUID, required): User identifier

**Query Parameters**:
- `limit` (number, optional): Maximum number of resources to return (default: 50, max: 100)
- `offset` (number, optional): Number of resources to skip (default: 0)

**Response Format**:
```typescript
{
  "success": boolean,
  "data": {
    "user": {
      "id": string,
      "name": string,
      "email": string,
      "createdAt": string // ISO 8601 timestamp
    },
    "resources": Array<{
      "id": string,
      "name": string,
      "description": string | null,
      "isGlobal": boolean,
      "accessType": "direct" | "group" | "global",
      "grantedAt": string | null, // ISO 8601 timestamp
      "createdAt": string // ISO 8601 timestamp
    }>,
    "pagination": {
      "total": number,
      "limit": number,
      "offset": number,
      "hasMore": boolean
    },
    "summary": {
      "totalResources": number,
      "directAccess": number,
      "groupAccess": number,
      "globalAccess": number
    }
  }
}
```

**Example Request**:
```bash
GET /user/user-123/resources?limit=10
```

---

### 3. User Access Check

**Endpoint**: `GET /user/:id/access-check/:resourceId`

**Description**: Fast access check to determine if a user has access to a specific resource.

**Path Parameters**:
- `id` (UUID, required): User identifier
- `resourceId` (UUID, required): Resource identifier

**Response Format**:
```typescript
{
  "success": boolean,
  "data": {
    "hasAccess": boolean,
    "accessType"?: "direct" | "group" | "global",
    "grantedAt"?: string // ISO 8601 timestamp
  }
}
```

**Example Request**:
```bash
GET /user/user-123/access-check/resource-456
```

---

## 👥 User Management Endpoints

### 4. List Users

**Endpoint**: `GET /users`

**Description**: Returns a paginated list of all users in the system.

**Query Parameters**:
- `limit` (number, optional): Maximum number of users to return (default: 50, max: 100)
- `offset` (number, optional): Number of users to skip (default: 0)

**Response Format**:
```typescript
{
  "success": boolean,
  "data": {
    "users": Array<{
      "id": string,
      "name": string,
      "email": string,
      "createdAt": string // ISO 8601 timestamp
    }>,
    "pagination": {
      "total": number,
      "limit": number,
      "offset": number,
      "hasMore": boolean
    }
  }
}
```

---

### 5. Get User by ID

**Endpoint**: `GET /users/:id`

**Description**: Returns a single user by their unique identifier.

**Path Parameters**:
- `id` (UUID, required): User identifier

**Response Format**:
```typescript
{
  "success": boolean,
  "data": {
    "user": {
      "id": string,
      "name": string,
      "email": string,
      "createdAt": string // ISO 8601 timestamp
    }
  }
}
```

---

## 📊 Reporting Endpoints

### 6. Resource Statistics

**Endpoint**: `GET /resources/stats`

**Description**: Returns aggregated data showing how many users have access to each resource.

**Query Parameters**:
- `limit` (number, optional): Maximum number of resources (default: 50, max: 100)
- `offset` (number, optional): Number of resources to skip (default: 0)
- `minUsers` (number, optional): Filter resources with at least N users (default: 0)

**Response Format**:
```typescript
{
  "success": boolean,
  "data": {
    "resources": Array<{
      "id": string,
      "name": string,
      "description": string | null,
      "isGlobal": boolean,
      "userCount": number,
      "directShares": number,
      "groupShares": number,
      "createdAt": string
    }>,
    "pagination": {
      "total": number,
      "limit": number,
      "offset": number,
      "hasMore": boolean
    },
    "summary": {
      "totalResources": number,
      "globalResources": number,
      "totalUniqueUsers": number,
      "avgUsersPerResource": number
    }
  }
}
```

---

### 7. User Statistics

**Endpoint**: `GET /users/with-resource-count`

**Description**: Returns aggregated data showing how many resources each user has access to.

**Query Parameters**:
- `limit` (number, optional): Maximum number of users (default: 50, max: 100)
- `offset` (number, optional): Number of users to skip (default: 0)
- `minResources` (number, optional): Filter users with at least N resources (default: 0)
- `sortBy` (string, optional): Sort by `name`, `email`, `resourceCount`, `createdAt` (default: `name`)
- `sortOrder` (string, optional): Sort order - `asc`, `desc` (default: `asc`)

**Response Format**:
```typescript
{
  "success": boolean,
  "data": {
    "users": Array<{
      "id": string,
      "name": string,
      "email": string,
      "resourceCount": number,
      "directAccess": number,
      "groupAccess": number,
      "globalAccess": number,
      "createdAt": string
    }>,
    "pagination": {
      "total": number,
      "limit": number,
      "offset": number,
      "hasMore": boolean
    },
    "summary": {
      "totalUsers": number,
      "usersWithAccess": number,
      "avgResourcesPerUser": number,
      "totalAccessGrants": number
    }
  }
}
```

---

## 🚨 Error Handling

### Standard Error Response Format

```typescript
{
  "success": false,
  "error": {
    "code": string,
    "message": string,
    "details"?: any
  },
  "requestId": string
}
```

### HTTP Status Codes

| Code | Description | When Used |
|------|-------------|-----------|
| 200 | OK | Successful request |
| 400 | Bad Request | Invalid parameters or request format |
| 404 | Not Found | Resource or user not found |
| 422 | Unprocessable Entity | Validation errors |
| 500 | Internal Server Error | Server-side errors |
| 503 | Service Unavailable | Database connection issues |

### Common Error Codes

```typescript
// Validation Errors
"INVALID_UUID"         // Malformed UUID in path parameters
"INVALID_PAGINATION"   // Invalid limit/offset values

// Resource Errors  
"RESOURCE_NOT_FOUND"   // Resource does not exist
"USER_NOT_FOUND"       // User does not exist

// System Errors
"DATABASE_ERROR"       // Database connection/query issues
"INTERNAL_ERROR"       // Unexpected server errors
```

### Example Error Response

```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Resource with ID '123e4567-e89b-12d3-a456-426614174000' not found"
  },
  "requestId": "req_abc123def456"
}
```

---

## 🔧 Request/Response Headers

### Required Headers

```
Content-Type: application/json
Accept: application/json
```

### Response Headers

```
Content-Type: application/json
```

---

## 📈 Rate Limiting

**Current Limits**: 100 requests per minute per IP address

**Rate Limit Exceeded Response**:
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Try again in 60 seconds."
  }
}
```

---

## 🧪 Testing Examples

### cURL Examples

```bash
# Get resource access list
curl -X GET "http://localhost:3000/resource/123e4567-e89b-12d3-a456-426614174000/access-list" \
  -H "Accept: application/json"

# Get user resources with pagination
curl -X GET "http://localhost:3000/user/user-123/resources?limit=10&offset=0" \
  -H "Accept: application/json"

# Get all users
curl -X GET "http://localhost:3000/users?limit=50" \
  -H "Accept: application/json"

# Get resource statistics
curl -X GET "http://localhost:3000/resources/stats?minUsers=5" \
  -H "Accept: application/json"

# Check user access
curl -X GET "http://localhost:3000/user/user-123/access-check/resource-456" \
  -H "Accept: application/json"
```

### JavaScript/TypeScript Examples

```typescript
// Using fetch API
const getResourceAccessList = async (resourceId: string) => {
  const response = await fetch(`/resource/${resourceId}/access-list`);
  const data = await response.json();
  return data;
};

// Using axios
import axios from 'axios';

const getUserResources = async (userId: string, limit = 50) => {
  const response = await axios.get(`/user/${userId}/resources`, {
    params: { limit }
  });
  return response.data;
};
```

---

*API specification updated to match current implementation with all endpoints and correct response formats.* 
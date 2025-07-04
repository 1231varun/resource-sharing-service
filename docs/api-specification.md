# API Specification

This document provides complete API documentation for the Resource Sharing Service endpoints.

## 📋 Overview

The Resource Sharing Service provides RESTful APIs for managing resource access control with multi-level sharing capabilities.

**Base URL**: `http://localhost:3000/api/v1`

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
      "is_global": boolean
    },
    "users": Array<{
      "id": string,
      "name": string,
      "email": string,
      "access_type": "direct" | "group" | "global"
    }>
  },
  "metadata": {
    "total_users": number,
    "direct_shares": number,
    "group_shares": number,
    "is_global": boolean
  }
}
```

**Example Request**:
```bash
GET /api/v1/resource/123e4567-e89b-12d3-a456-426614174000/access-list
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
      "is_global": false
    },
    "users": [
      {
        "id": "user-123",
        "name": "John Doe",
        "email": "john@example.com",
        "access_type": "direct"
      },
      {
        "id": "user-456",
        "name": "Jane Smith",
        "email": "jane@example.com",
        "access_type": "group"
      }
    ]
  },
  "metadata": {
    "total_users": 2,
    "direct_shares": 1,
    "group_shares": 1,
    "is_global": false
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
- `sort` (string, optional): Sort field - `name`, `created_at` (default: `name`)
- `order` (string, optional): Sort order - `asc`, `desc` (default: `asc`)

**Response Format**:
```typescript
{
  "success": boolean,
  "data": {
    "user": {
      "id": string,
      "name": string,
      "email": string
    },
    "resources": Array<{
      "id": string,
      "name": string,
      "description": string | null,
      "access_type": "direct" | "group" | "global",
      "shared_at": string | null // ISO 8601 timestamp
    }>
  },
  "pagination": {
    "total": number,
    "limit": number,
    "offset": number,
    "has_more": boolean
  }
}
```

**Example Request**:
```bash
GET /api/v1/user/user-123/resources?limit=10&sort=name&order=asc
```

**Example Response**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-123",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "resources": [
      {
        "id": "resource-456",
        "name": "Development Tools",
        "description": "Shared development resources",
        "access_type": "group",
        "shared_at": "2024-01-15T10:30:00Z"
      },
      {
        "id": "resource-789",
        "name": "Public Documentation",
        "description": "Publicly available docs",
        "access_type": "global",
        "shared_at": null
      }
    ]
  },
  "pagination": {
    "total": 2,
    "limit": 10,
    "offset": 0,
    "has_more": false
  }
}
```

---

## 📊 Reporting Endpoints

### 3. Resources with User Count

**Endpoint**: `GET /resources/with-user-count`

**Description**: Returns aggregated data showing how many users have access to each resource.

**Query Parameters**:
- `limit` (number, optional): Maximum number of resources (default: 50, max: 100)
- `offset` (number, optional): Number of resources to skip (default: 0)
- `min_users` (number, optional): Filter resources with at least N users (default: 0)
- `sort` (string, optional): Sort by `name`, `user_count`, `created_at` (default: `user_count`)
- `order` (string, optional): Sort order - `asc`, `desc` (default: `desc`)

**Response Format**:
```typescript
{
  "success": boolean,
  "data": {
    "resources": Array<{
      "id": string,
      "name": string,
      "description": string | null,
      "is_global": boolean,
      "user_count": number,
      "direct_shares": number,
      "group_shares": number,
      "created_at": string
    }>
  },
  "pagination": {
    "total": number,
    "limit": number,
    "offset": number,
    "has_more": boolean
  },
  "summary": {
    "total_resources": number,
    "global_resources": number,
    "total_unique_users": number,
    "avg_users_per_resource": number
  }
}
```

**Example Request**:
```bash
GET /api/v1/resources/with-user-count?min_users=5&sort=user_count&order=desc
```

**Example Response**:
```json
{
  "success": true,
  "data": {
    "resources": [
      {
        "id": "resource-123",
        "name": "Company Handbook",
        "description": "Employee handbook and policies",
        "is_global": true,
        "user_count": 150,
        "direct_shares": 0,
        "group_shares": 0,
        "created_at": "2024-01-01T00:00:00Z"
      },
      {
        "id": "resource-456",
        "name": "Development Resources",
        "description": "Tools and documentation for developers",
        "is_global": false,
        "user_count": 25,
        "direct_shares": 5,
        "group_shares": 20,
        "created_at": "2024-01-10T12:00:00Z"
      }
    ]
  },
  "pagination": {
    "total": 2,
    "limit": 50,
    "offset": 0,
    "has_more": false
  },
  "summary": {
    "total_resources": 10,
    "global_resources": 2,
    "total_unique_users": 150,
    "avg_users_per_resource": 35.5
  }
}
```

---

### 4. Users with Resource Count

**Endpoint**: `GET /users/with-resource-count`

**Description**: Returns aggregated data showing how many resources each user has access to.

**Query Parameters**:
- `limit` (number, optional): Maximum number of users (default: 50, max: 100)
- `offset` (number, optional): Number of users to skip (default: 0)
- `min_resources` (number, optional): Filter users with at least N resources (default: 0)
- `sort` (string, optional): Sort by `name`, `resource_count`, `created_at` (default: `resource_count`)
- `order` (string, optional): Sort order - `asc`, `desc` (default: `desc`)

**Response Format**:
```typescript
{
  "success": boolean,
  "data": {
    "users": Array<{
      "id": string,
      "name": string,
      "email": string,
      "resource_count": number,
      "direct_resources": number,
      "group_resources": number,
      "global_resources": number,
      "created_at": string
    }>
  },
  "pagination": {
    "total": number,
    "limit": number,
    "offset": number,
    "has_more": boolean
  },
  "summary": {
    "total_users": number,
    "total_resources": number,
    "avg_resources_per_user": number
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
  "request_id": string
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
"INVALID_SORT_FIELD"   // Unknown sort field

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
    "message": "Resource with ID '123e4567-e89b-12d3-a456-426614174000' not found",
    "details": {
      "resource_id": "123e4567-e89b-12d3-a456-426614174000"
    }
  },
  "request_id": "req_abc123def456"
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
X-Request-ID: <unique_request_id>
X-Response-Time: <response_time_ms>
```

---

## 📈 Rate Limiting

**Current Limits**: 100 requests per minute per IP address

**Headers in Response**:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

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
curl -X GET "http://localhost:3000/api/v1/resource/123e4567-e89b-12d3-a456-426614174000/access-list" \
  -H "Accept: application/json"

# Get user resources with pagination
curl -X GET "http://localhost:3000/api/v1/user/user-123/resources?limit=10&offset=0" \
  -H "Accept: application/json"

# Get resource statistics
curl -X GET "http://localhost:3000/api/v1/resources/with-user-count?sort=user_count&order=desc" \
  -H "Accept: application/json"
```

### JavaScript/TypeScript Examples

```typescript
// Using fetch API
const getResourceAccessList = async (resourceId: string) => {
  const response = await fetch(`/api/v1/resource/${resourceId}/access-list`);
  const data = await response.json();
  return data;
};

// Using axios
import axios from 'axios';

const getUserResources = async (userId: string, limit = 50) => {
  const response = await axios.get(`/api/v1/user/${userId}/resources`, {
    params: { limit }
  });
  return response.data;
};
```

---

*API specification follows RESTful principles with consistent error handling and comprehensive documentation.* 
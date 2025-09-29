# 🔌 API Documentation

## 🏗️ API Architecture

RateMe uses Next.js API Routes with a layered architecture:
- **API Layer**: Request handling and validation
- **Service Layer**: Business logic implementation
- **Repository Layer**: Database operations
- **Validation Layer**: Zod schemas for type safety

## 🛠️ API Structure

### Base Configuration
```typescript
// src/lib/api-handler.ts
export const createApiRoute = (handlers: RouteHandlers, options?: RouteOptions) => {
  // Unified request/response handling
  // Built-in authentication middleware
  // Automatic validation
  // Error handling
}
```

### Response Format
All API responses follow a consistent format:

#### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

#### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "ERROR_CODE"
}
```

#### Paginated Response
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

## 🔐 Authentication

### NextAuth Integration
```typescript
// Authentication required for protected routes
export default createApiRoute({
  GET: requireAuth(async (ctx) => {
    // ctx.user contains authenticated user
    // ctx.session contains session data
  })
})
```

### Session Structure
```typescript
interface Session {
  user: {
    id: string
    email: string
    username: string
    firstName?: string
    lastName?: string
  }
  expires: string
}
```

## 📋 API Endpoints

### Authentication Endpoints

#### POST `/api/auth/signup`
Create new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "username",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user-id",
    "email": "user@example.com",
    "username": "username"
  }
}
```

**Validation:**
- Email: Valid email format, unique
- Username: 3-20 characters, alphanumeric + underscore
- Password: Minimum 6 characters
- Names: Optional, 1-50 characters

#### POST `/api/auth/signin`
Handled by NextAuth - use `signIn()` from `next-auth/react`

#### POST `/api/auth/signout`
Handled by NextAuth - use `signOut()` from `next-auth/react`

### Video Endpoints

#### GET `/api/videos`
Get paginated list of videos.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `search` (optional): Search term for video titles
- `tags` (optional): Comma-separated tag filters
- `sort` (optional): Sort order (`newest`, `oldest`, `rating`, `title`)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "video-id",
      "title": "Video Title",
      "originalUrl": "https://example.com/video",
      "embedUrl": "https://example.com/embed/video",
      "averageRating": 4.5,
      "totalRatings": 10,
      "tags": ["tag1", "tag2"],
      "user": {
        "id": "user-id",
        "username": "creator"
      },
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

#### POST `/api/videos`
Create new video entry. **Requires authentication.**

**Request Body:**
```json
{
  "title": "Video Title",
  "originalUrl": "https://example.com/video",
  "description": "Optional description",
  "tags": ["tag1", "tag2"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "video-id",
    "title": "Video Title",
    "embedUrl": "https://example.com/embed/video",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

**Validation:**
- Title: 1-200 characters, required
- URL: Valid video URL, supported platforms
- Description: Optional, max 1000 characters
- Tags: Optional array, max 10 tags per video

#### GET `/api/videos/[id]`
Get specific video by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "video-id",
    "title": "Video Title",
    "originalUrl": "https://example.com/video",
    "embedUrl": "https://example.com/embed/video",
    "description": "Video description",
    "averageRating": 4.5,
    "totalRatings": 10,
    "tags": ["tag1", "tag2"],
    "user": {
      "id": "user-id",
      "username": "creator",
      "firstName": "John",
      "lastName": "Doe"
    },
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

#### PUT `/api/videos/[id]`
Update video. **Requires authentication and ownership.**

**Request Body:**
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "tags": ["new-tag"]
}
```

#### DELETE `/api/videos/[id]`
Delete video. **Requires authentication and ownership.**

### Rating Endpoints

#### GET `/api/videos/[id]/ratings`
Get ratings for specific video.

**Response:**
```json
{
  "success": true,
  "data": {
    "averageRating": 4.5,
    "totalRatings": 10,
    "userRating": 5, // If authenticated
    "distribution": {
      "1": 0,
      "2": 1,
      "3": 2,
      "4": 3,
      "5": 4
    }
  }
}
```

#### POST `/api/videos/[id]/ratings`
Rate a video. **Requires authentication.**

**Request Body:**
```json
{
  "rating": 5,
  "tags": ["tag1", "tag2"] // Tags being rated
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "rating": 5,
    "averageRating": 4.5,
    "totalRatings": 11
  }
}
```

### User Endpoints

#### GET `/api/users/[id]`
Get user profile information.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user-id",
    "username": "username",
    "firstName": "John",
    "lastName": "Doe",
    "createdAt": "2024-01-01T00:00:00Z",
    "stats": {
      "videosUploaded": 5,
      "ratingsGiven": 20,
      "averageRatingReceived": 4.2
    }
  }
}
```

#### PUT `/api/users/profile`
Update user profile. **Requires authentication.**

**Request Body:**
```json
{
  "firstName": "Updated First",
  "lastName": "Updated Last",
  "username": "newusername"
}
```

### Tag Endpoints

#### GET `/api/tags`
Get list of available tags.

**Query Parameters:**
- `search` (optional): Search term for tag names
- `popular` (optional): Return most popular tags

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "tag-id",
      "name": "tag-name",
      "usageCount": 25
    }
  ]
}
```

## 🔍 Health Check

#### GET `/api/health`
System health check endpoint.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-01T00:00:00Z",
    "version": "1.0.0",
    "database": "connected",
    "uptime": 86400
  }
}
```

## 🚨 Error Handling

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate data)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

### Error Response Format
```json
{
  "success": false,
  "message": "Human-readable error message",
  "error": "ERROR_CODE",
  "details": { ... } // Additional error details (development only)
}
```

### Common Error Codes
- `VALIDATION_ERROR` - Input validation failed
- `AUTHENTICATION_REQUIRED` - User must be authenticated
- `AUTHORIZATION_FAILED` - User lacks required permissions
- `RESOURCE_NOT_FOUND` - Requested resource doesn't exist
- `DUPLICATE_RESOURCE` - Resource already exists
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `DATABASE_ERROR` - Database operation failed

## 🔒 Security

### Input Validation
All endpoints use Zod schemas for validation:
```typescript
// Example validation schema
const createVideoSchema = z.object({
  title: z.string().min(1).max(200),
  originalUrl: videoUrlSchema,
  description: z.string().max(1000).optional(),
  tags: z.array(z.string()).max(10).optional()
})
```

### Rate Limiting
- **General**: 100 requests per minute per IP
- **Authentication**: 5 login attempts per minute per IP
- **Upload**: 10 video uploads per hour per user

### CORS Policy
- **Development**: Accepts requests from localhost
- **Production**: Restricted to production domain
- **API**: JSON responses only, no JSONP

## 📊 Performance

### Caching Strategy
- **Static Data**: Long-term cache headers
- **Dynamic Data**: Short-term cache with revalidation
- **User Data**: No caching for personalized content

### Database Optimization
- **Pagination**: Cursor-based for large datasets
- **Indexing**: Optimized queries with proper indexes
- **Connection Pooling**: Managed by Prisma

### Response Times
- **Simple queries**: < 100ms
- **Complex aggregations**: < 500ms
- **File uploads**: < 2s (depending on size)

## 🧪 Testing APIs

### Using curl
```bash
# Get videos
curl "http://localhost:3000/api/videos?page=1&limit=10"

# Create video (with auth)
curl -X POST "http://localhost:3000/api/videos" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{"title":"Test Video","originalUrl":"https://example.com/video"}'
```

### Using Postman/Insomnia
Import the collection with base URL `http://localhost:3000/api`

### Development Tools
- **Prisma Studio**: Database browser at `http://localhost:5555`
- **API Health**: Monitor at `/api/health`
- **Logs**: Check console output for request/response logging
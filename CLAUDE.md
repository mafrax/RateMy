# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**RateMe** is a modern full-stack video rating platform built with Next.js 14, PostgreSQL, Prisma, and NextAuth. The application follows enterprise-grade architecture patterns with a clean separation of concerns.

## Technology Stack

- **Frontend**: Next.js 14 with App Router, React 18, TypeScript
- **Styling**: Tailwind CSS with Headless UI components
- **Backend**: Next.js API Routes with layered architecture
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with credentials provider
- **Validation**: Zod schemas with type safety
- **Error Handling**: Custom error classes with proper HTTP status codes
- **Logging**: Structured logging with context preservation

## Architecture Overview

### Project Structure
```
src/
├── types/           # TypeScript interfaces and types
├── lib/            # Core utilities and configuration
│   ├── config.ts   # Environment configuration
│   ├── constants.ts # Application constants
│   ├── logger.ts   # Structured logging
│   ├── database.ts # Enhanced Prisma client
│   ├── errors.ts   # Custom error classes
│   ├── validation.ts # Zod schemas
│   └── api-handler.ts # Unified API wrapper
├── repositories/   # Database access layer
│   ├── base.repository.ts
│   ├── user.repository.ts
│   ├── video.repository.ts
│   ├── rating.repository.ts
│   └── tag.repository.ts
└── services/       # Business logic layer
    ├── auth.service.ts
    ├── video.service.ts
    └── user.service.ts

app/                # Next.js App Router
├── layout.tsx     # Root layout
├── page.tsx       # Home page
├── providers.tsx  # React context providers
├── globals.css    # Global styles
├── auth/         # Authentication pages
└── upload/       # Video upload page

components/        # React components
├── Navbar.tsx
├── HeroSection.tsx
├── VideoGrid.tsx
├── VideoCard.tsx
└── SearchBar.tsx

pages/api/        # API routes
├── auth/
└── videos/

prisma/           # Database schema and migrations
lib/             # Legacy compatibility layer
```

## Development Commands

### Primary Commands
- `npm run dev` - Start Next.js development server on port 3000
- `npm run build` - Build the application for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint for code quality

### Database Commands
- `npm run db:generate` - Generate Prisma client after schema changes
- `npm run db:migrate` - Apply database migrations
- `npm run db:studio` - Open Prisma Studio for database management

## Architecture Patterns

### Repository Pattern
- **Base Repository**: Generic CRUD operations with logging
- **Specialized Repositories**: Domain-specific queries and operations
- **Pagination Support**: Built-in pagination with configurable limits
- **Error Handling**: Automatic error logging and context preservation

### Service Layer
- **Business Logic**: All business rules and validations
- **Input Validation**: Zod schemas for type-safe validation
- **Error Management**: Custom error classes with proper HTTP status codes
- **Logging**: Structured logging for all operations

### API Layer
- **Unified Handler**: Consistent request/response handling
- **Authentication Middleware**: Built-in auth checks
- **Validation Middleware**: Automatic request validation
- **Error Responses**: Standardized error format
- **Rate Limiting**: Built-in rate limiting support

## Database Schema

### Core Entities
- **User**: Authentication and profile data
- **Video**: Video metadata with embed URLs
- **Tag**: Categorization system
- **Rating**: User ratings for video-tag combinations
- **VideoTag**: Many-to-many relationship between videos and tags
- **Follow**: User following relationships

### Key Relationships
- User → Videos (one-to-many)
- User → Ratings (one-to-many)
- Video → Ratings (one-to-many)
- Video ↔ Tags (many-to-many through VideoTag)
- User ↔ User (many-to-many through Follow)

## Type System

### Core Types
```typescript
// All entities have complete TypeScript definitions
interface User {
  id: string
  email: string
  username: string
  // ... additional fields
}

interface Video {
  id: string
  title: string
  originalUrl: string
  embedUrl: string
  // ... additional fields
}

// API responses are typed
interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}
```

### Validation Schemas
```typescript
// Zod schemas for validation
export const createVideoSchema = z.object({
  title: z.string().min(1).max(200),
  originalUrl: videoUrlSchema,
  description: z.string().max(1000).optional(),
  tags: z.array(z.string()).max(10).optional()
})
```

## API Patterns

### Request/Response Format
```typescript
// Success response
{ success: true, data: any }

// Error response  
{ success: false, message: string, error?: string }

// Paginated response
{ 
  success: true, 
  data: T[], 
  pagination: {
    page: number,
    limit: number,
    total: number,
    totalPages: number
  }
}
```

### API Route Structure
```typescript
export default createApiRoute({
  GET: async (ctx) => {
    // Handle GET request
  },
  POST: requireAuth(validateBody(schema, async (ctx, body) => {
    // Handle authenticated POST with validation
  }))
}, {
  methods: ['GET', 'POST'],
  requireAuth: false
})
```

## Error Handling

### Custom Error Classes
- **ValidationError**: Input validation failures
- **AuthenticationError**: Authentication required
- **AuthorizationError**: Access forbidden
- **NotFoundError**: Resource not found
- **ConflictError**: Resource conflicts
- **DatabaseError**: Database operation failures

### Error Responses
All errors are automatically converted to consistent HTTP responses with appropriate status codes and error messages.

## Development Workflow

### Making Changes
1. **Database changes**: Update `prisma/schema.prisma` → run `npm run db:generate` → `npm run db:migrate`
2. **API changes**: Use the service layer pattern with proper validation
3. **UI changes**: Modify components with proper TypeScript types
4. **Types**: Update `src/types/index.ts` for new interfaces

### Adding New Features
1. **Define Types**: Add interfaces to `src/types/index.ts`
2. **Repository Layer**: Add database operations to appropriate repository
3. **Service Layer**: Implement business logic in service classes
4. **API Routes**: Create API endpoints using `createApiRoute`
5. **Frontend**: Build React components with proper typing

### Environment Setup
1. Copy `.env.example` to `.env`
2. Set up PostgreSQL database
3. Update `DATABASE_URL` in `.env`
4. Set `NEXTAUTH_SECRET` for authentication
5. Run database migrations: `npm run db:migrate`

## Testing and Quality

### Code Quality
- **TypeScript**: Strict typing enabled
- **ESLint**: Code quality checks
- **Error Boundaries**: Comprehensive error handling
- **Logging**: Structured logging for debugging

### Performance
- **Database**: Optimized queries with proper indexing
- **Caching**: Repository-level caching ready for Redis
- **API**: Request validation and rate limiting
- **Frontend**: Optimized React components

## Security

### Authentication
- **NextAuth**: Session-based authentication
- **Password Hashing**: bcryptjs with salt rounds
- **Session Storage**: Database-backed sessions

### Input Validation
- **Zod Schemas**: Type-safe validation
- **Sanitization**: Input cleaning and validation
- **SQL Injection**: Prisma ORM protection
- **XSS Prevention**: Proper input/output handling

## Important Notes

- **App Router**: Uses Next.js 14 App Router exclusively
- **TypeScript**: Strict typing throughout the application
- **Error Handling**: Never expose internal errors to clients
- **Logging**: All operations are logged with proper context
- **Database**: PostgreSQL required (not SQLite compatible)
- **Authentication**: Database sessions via Prisma adapter

## Migration from Legacy

This application was completely rewritten from Express.js/Neo4j to Next.js/PostgreSQL with modern architecture patterns:

- **Express.js** → **Next.js API Routes with layered architecture**
- **Neo4j** → **PostgreSQL with Prisma ORM**
- **EJS templates** → **React components with TypeScript**
- **Custom auth** → **NextAuth.js with proper session management**
- **Ad-hoc validation** → **Zod schemas with type safety**
- **Basic error handling** → **Custom error classes with proper HTTP codes**

The new architecture provides better maintainability, type safety, performance, and developer experience while preserving all original functionality.

# Important Instruction Reminders

Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.
Use the established architecture patterns and don't bypass the service/repository layers.
Always validate inputs using the established Zod schemas.
Follow the error handling patterns with proper HTTP status codes.
Use the structured logging system for all operations.
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**NexusCore** is a comprehensive TODO management API system built with modern TypeScript tooling. The system provides REST API endpoints for task management, including features like task assignments, threaded comments with soft deletion, time tracking with detailed logging, projects, categories, tags, and extensive reporting capabilities. The system implements domain-driven design with functional error handling and complete type safety.

## Technology Stack

- **Runtime**: Bun
- **Web Framework**: Hono.js
- **Language**: TypeScript
- **ORM**: Drizzle ORM
- **Database**: SQLite 3
- **Validation**: Zod
- **DI Container**: TSyringe (with decorators enabled)

## Development Commands

### Essential Commands

- `bun run dev` - Start development server with hot reload
- `bun run build` - Type check and build for production
- `bun run typecheck` - Run TypeScript type checking only
- `bun run start` - Start production server
- `bun test` - Run all tests
- `bun test <filename>` - Run specific test file

### Code Quality

- `bun run lint` - Run Biome linter
- `bun run format` - Format code with Biome (auto-fix)

### Database Management

- `bun run generate` - Generate Drizzle migrations
- `bun run migrate` - Run database migrations
- `bun run studio` - Launch Drizzle Studio for database inspection

## Architecture Overview

### Domain-Driven Design Structure

The codebase follows DDD principles with clean separation of concerns:

- **`src/entities/`** - Domain models with business logic and repositories (User, Task, TaskComment)
- **`src/features/`** - Application services that orchestrate business operations (task-management, user-management)
- **`src/shared/`** - Cross-cutting concerns (database, validation, error handling, API utilities)
- **`src/app/`** - Application entry point and route configuration

### Key Architectural Patterns

**Result Type Pattern**: Functional error handling throughout the application

```typescript
type Result<T, E = Error> = Success<T> | Failure<E>;
```

- Eliminates try/catch in business logic
- Enables chainable operations with compile-time error safety

**Type-Safe API Routes**: Custom RouteBuilder pattern with Hono + Zod

```typescript
routes.post("/api/tasks", {
  body: createTaskRequestSchema,
  handler: async (c) => {
    const taskData = c.get("validatedBody"); // Fully typed
  },
});
```

**Enhanced Error System**: Structured errors with HTTP status mapping

- Type-safe error codes and automatic HTTP status resolution
- Consistent error responses across all endpoints

**Domain Namespaces**: Business logic encapsulated in TypeScript namespaces

```typescript
export namespace TaskDomain {
  export function calculateEisenhowerQuadrant(
    importance: boolean,
    urgency: boolean
  ): EisenhowerQuadrant;
}
```

### Database Design

Sophisticated SQLite schema with Drizzle ORM providing:

- **Type-safe queries**: Full compile-time type checking for all database operations
- **Complex relationships**: Tasks with subtasks, assignments, tags, comments, time logs, and dependencies
- **Soft deletion**: Built-in trash/restore functionality for tasks and comments with deletedAt timestamps
- **Threaded comments**: Parent-child relationships for nested discussion threads with full query support
- **Time tracking**: Detailed work session logging with start/end times and duration calculations
- **Batch operations**: Efficient loading of related data using custom query builders and relation loaders
- **Business rules**: Eisenhower Matrix auto-calculation, task status transitions, comment authorization, and edit time limits

### Dependency Injection

TSyringe is configured but **not currently used** - the codebase uses manual dependency injection:

```typescript
const userRepository = new UserRepository();
const userService = new UserService(userRepository);
```

Decorators are enabled for future TSyringe adoption.

### Testing Patterns

- **Domain-focused testing**: Unit tests for business logic and validation
- **Result pattern testing**: Type-safe error and success case validation
- **Integration ready**: Test setup supports database migrations
- **Comprehensive coverage**: 181+ tests covering all entities, features, and API endpoints

### TaskComment System Architecture

The TaskComment system implements a sophisticated commenting infrastructure:

**Domain Layer** (`src/entities/task-comment/model/`):
- **Business Rules**: Content validation, user authorization, edit time limits, threading logic
- **Validation Schemas**: Zod schemas for create/update/query operations with proper error messages
- **Validation Service**: Type-safe validation with Result pattern integration

**Repository Layer** (`src/entities/task-comment/api/repository.ts`):
- **CRUD Operations**: Create, read, update, soft delete comments
- **Threaded Queries**: Fetch comment hierarchies with parent-child relationships
- **Filtering**: Query by task, user, deleted status, and pagination
- **Batch Operations**: Efficient loading of comment trees and user data

**Service Layer** (`src/features/task-management/api/task-comment-service.ts`):
- **Authorization**: Ensure users can only modify their own comments
- **Threading Logic**: Validate parent comments belong to the same task
- **Soft Deletion**: Delete and restore comments with proper state management
- **Query Processing**: Handle complex filtering and sorting requirements

**Database Schema** (`src/shared/lib/db/schemas/task-comment-schema.ts`):
- **Core Fields**: id, taskId, userId, content, createdAt, updatedAt
- **Threading**: parentId for reply relationships
- **Soft Deletion**: deletedAt timestamp for trash/restore functionality
- **Indexes**: Optimized for common query patterns (task, user, parent, deletion status)

## Development Workflow

### Working with the Result Pattern

Always handle both success and failure cases when working with domain operations:

```typescript
const result = UserDomain.validateCreate(userData);
if (!result.success) {
  return result; // Propagate error
}
// Work with result.data (typed success value)
```

### Adding New Features

1. **Domain First**: Define business logic in `src/entities/{domain}/model/`
2. **Repository Layer**: Add data access methods in `src/entities/{domain}/api/repository.ts`
3. **Application Service**: Create orchestration logic in `src/features/{feature}/api/service.ts`
4. **API Routes**: Define type-safe endpoints in `src/features/{feature}/api/routes-typed.ts`
5. **Testing**: Add tests for domain logic and API endpoints

### Database Changes

1. Modify schema in `src/shared/lib/db/schemas/{entity}-schema.ts`
2. Generate migration: `bun run generate`
3. Apply migration: `bun run migrate`
4. Update TypeScript types (auto-inferred by Drizzle)
5. Update domain models and validation schemas accordingly

### Recent Architectural Improvements

**Merge Conflict Resolution (2025-06-24)**:
- Successfully merged TaskComment threaded commenting features with time tracking functionality
- Consolidated database migrations maintaining chronological order
- Unified TaskComment domain models with both threading (parentId, deletedAt) and query validation
- Removed duplicate schema definitions to eliminate type conflicts
- Enhanced validation system with comprehensive error messages and field-specific validation

**Database Schema Consolidation**:
- Centralized TaskComment schema in dedicated file (`task-comment-schema.ts`)
- Eliminated duplicate exports and conflicting type definitions
- Added proper indexes for optimal query performance
- Implemented check constraints for data integrity

**Type Safety Enhancements**:
- Full end-to-end type safety from database to API responses
- Consolidated CreateTaskCommentRequest interface without userId (handled by auth context)
- Enhanced TaskCommentQuery interface with pagination and sorting options
- Improved error handling with field-specific validation messages

## Current API Endpoints

### Task Management
- `GET /api/tasks` - List tasks with filtering, pagination, and sorting
- `POST /api/tasks` - Create new task with validation
- `GET /api/tasks/:id` - Get task details with relations
- `PUT /api/tasks/:id` - Update task with business rule validation
- `DELETE /api/tasks/:id` - Soft delete task
- `POST /api/tasks/:id/restore` - Restore soft-deleted task
- `GET /api/tasks/deleted` - List soft-deleted tasks

### Task Comments (Threaded)
- `GET /api/tasks/:taskId/comments` - Get threaded comments for task
- `POST /api/tasks/:taskId/comments` - Create comment (with optional parentId for threading)
- `GET /api/comments/:id` - Get comment details with replies
- `PUT /api/comments/:id` - Update comment (authorization required)
- `DELETE /api/comments/:id` - Soft delete comment (authorization required)
- `POST /api/comments/:id/restore` - Restore soft-deleted comment
- `GET /api/tasks/:taskId/comments/count` - Get comment count for task

### User Management
- `GET /api/users` - List users with pagination
- `POST /api/users` - Create new user
- `GET /api/users/:id` - Get user details
- `PUT /api/users/:id` - Update user information
- `DELETE /api/users/:id` - Delete user

### Time Tracking
- Task time logs are integrated into the task system with start/end times and duration tracking

## Specification Reference

Refer to `docs/仕様書.md` for the complete Japanese API specification document, which includes:

- Detailed database schema with ER diagrams
- Complete API endpoint definitions with request/response examples
- Data validation rules and business logic specifications
- Comprehensive feature requirements including advanced analytics and reporting capabilities
- Database relationship mappings and constraint definitions

## Important Development Notes

- **NEVER create files unless absolutely necessary** - prefer editing existing files
- **ALWAYS prefer editing existing files** to creating new ones
- **NEVER proactively create documentation files** unless explicitly requested
- **Run `bun run typecheck` and `bun run build`** after significant changes to ensure type safety
- **Use the Result pattern** for all business logic error handling
- **Follow domain-driven design principles** when adding new features
- **Write tests** for both domain logic and API endpoints
- **Use safeParse** for Zod validation in services to maintain Result pattern consistency

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**NexusCore** is a comprehensive TODO management API system built with modern TypeScript tooling. The system provides REST API endpoints for task management, including features like task assignments, threaded comments, time tracking, projects, categories, and extensive reporting capabilities.

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
- **Complex relationships**: Tasks with subtasks, assignments, tags, comments, and dependencies
- **Soft deletion**: Built-in trash/restore functionality for tasks and comments
- **Threaded comments**: Parent-child relationships for discussion threads
- **Batch operations**: Efficient loading of related data
- **Business rules**: Eisenhower Matrix auto-calculation, task status transitions, comment authorization

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

1. Modify schema in `src/shared/lib/db/schema.ts`
2. Generate migration: `bun run generate`
3. Apply migration: `bun run migrate`
4. Update TypeScript types (auto-inferred by Drizzle)

## Specification Reference

Refer to `docs/仕様書.md` for the complete Japanese API specification document, which includes:

- Detailed database schema with ER diagrams
- Complete API endpoint definitions
- Data validation rules and business logic
- Comprehensive feature requirements including advanced analytics and reporting capabilities

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**NexusCore** is a comprehensive TODO management API system built with modern TypeScript tooling. The system provides REST API endpoints for task management, including features like task assignments, time tracking, projects, categories, and extensive reporting capabilities.

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
- `bun run dev` - Start development server
- `bun run build` - Type check and build for production
- `bun run type-check` - Run TypeScript type checking only
- `bun run start` - Start production server
- `bun test` - Run tests

### Code Quality
- `bun run lint` - Run Biome linter
- `bun run format` - Format code with Biome (auto-fix)

### Database Management
- `bun run generate` - Generate Drizzle migrations
- `bun run migrate` - Run database migrations
- `bun run studio` - Launch Drizzle Studio for database inspection

## Architecture Overview

### Database Design
The system uses SQLite with a comprehensive schema supporting:
- **Core entities**: Users, Tasks, Projects, Categories, Tags
- **Advanced features**: Task assignments, time logging, task dependencies, recurring tasks
- **Collaboration**: Comments, attachments, task history
- **Analytics**: Smart lists, saved searches, comprehensive reporting

Key architectural decisions:
- Tasks support Eisenhower Matrix categorization (auto-calculated from importance/urgency)
- Soft deletion for tasks (trash/restore functionality)
- Complex task relationships (parent/child, dependencies)
- Multi-level filtering and search capabilities

### Code Organization
- `src/` - Main application code (currently empty - initial setup phase)
- `src/db/` - Database schema, migrations, and connection logic
- Dependency injection using TSyringe with decorator support
- Strict TypeScript configuration extending `@tsconfig/strictest`

### Configuration
- **TypeScript**: Strictest possible configuration with experimental decorators
- **Biome**: Code formatting (2 spaces, 120 char line width) and linting
- **Husky**: Git hooks for pre-commit formatting
- **Drizzle**: Database schema at `src/db/schema.ts`, migrations in `src/db/migrations/`

## Important Notes

- The project is in initial setup phase - core implementation is not yet present
- Database schema is comprehensively designed as per the Japanese specification document
- Uses Bun as the runtime, which provides faster execution and built-in bundling
- TypeScript decorators are enabled for dependency injection patterns
- SQLite database file will be `todo.db` in the project root

## Specification Reference

Refer to `docs/仕様書.md` for the complete Japanese API specification document, which includes:
- Detailed database schema with ER diagrams  
- Complete API endpoint definitions
- Data validation rules and business logic
- Comprehensive feature requirements including advanced analytics and reporting capabilities
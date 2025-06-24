# NexusCore

A comprehensive TODO management API system built with modern TypeScript tooling.

## 🚀 Features

### Core Task Management
- **CRUD Operations**: Create, read, update, and delete tasks
- **Subtask Management**: Hierarchical task organization
- **Task Assignment**: Delegate tasks to team members
- **Progress Tracking**: Monitor task completion with progress percentages
- **Soft Deletion**: Trash/restore functionality for accidental deletions

### Comments & Collaboration  
- **Threaded Comments**: Reply to comments with parent-child relationships
- **Soft Deletion**: Comments can be deleted and restored with full audit trail
- **User Authorization**: Users can only modify their own comments with edit time limits
- **Advanced Querying**: Filter, sort, and paginate comments with comprehensive query support
- **Real-time Tracking**: Comment counts and threading support

### Organization & Classification
- **Projects**: Group related tasks under projects
- **Categories**: Classify tasks by type or context
- **Tags**: Flexible labeling system
- **Eisenhower Matrix**: Automatic priority quadrant calculation

### Advanced Features
- **Time Tracking**: Record detailed work sessions with start/end times and duration calculations
- **Schedule Management**: Set start dates, end dates, and due dates with validation
- **Priority Management**: Importance and urgency-based prioritization with Eisenhower Matrix
- **Assignment Workflow**: Request, accept, and reject task assignments with full audit trail
- **Type Safety**: End-to-end TypeScript with functional error handling using Result pattern

## 🛠 Technology Stack

- **Runtime**: Bun
- **Web Framework**: Hono.js
- **Language**: TypeScript
- **ORM**: Drizzle ORM
- **Database**: SQLite 3
- **Validation**: Zod
- **DI Container**: TSyringe (with decorators)

## 📁 Project Structure

```
src/
├── entities/           # Domain models with business logic
│   ├── user/          # User domain and repository
│   ├── task/          # Task domain and repository  
│   └── task-comment/  # Comment domain and repository
├── features/          # Application services
│   ├── user-management/
│   └── task-management/
├── shared/            # Cross-cutting concerns
│   ├── config/        # Database and app configuration
│   ├── lib/           # Utilities, errors, and DB schema
│   └── types/         # Shared TypeScript types
└── app/               # Application entry point
```

## 🚀 Getting Started

### Prerequisites
- Bun runtime installed
- Node.js 18+ (for compatibility)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd NexusCore

# Install dependencies
bun install

# Set up database
bun run migrate

# Start development server
bun run dev
```

### Development Commands

```bash
# Development
bun run dev          # Start with hot reload
bun run build        # Build for production
bun run start        # Start production server

# Code Quality
bun run typecheck    # TypeScript type checking
bun run lint         # Run linter
bun run format       # Format code

# Database
bun run generate     # Generate migrations
bun run migrate      # Run migrations
bun run studio       # Launch Drizzle Studio

# Testing
bun test             # Run all tests
bun test <file>      # Run specific test file
```

## 📋 API Documentation

### Core Endpoints

#### Tasks
- `GET /api/tasks` - List tasks with filtering
- `POST /api/tasks` - Create new task
- `GET /api/tasks/:id` - Get task details
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Soft delete task
- `POST /api/tasks/:id/restore` - Restore deleted task

#### Comments
- `GET /api/tasks/:taskId/comments` - Get task comments (threaded)
- `POST /api/tasks/:taskId/comments` - Create comment
- `GET /api/comments/:id` - Get comment details
- `PUT /api/comments/:id` - Update comment
- `DELETE /api/comments/:id` - Delete comment
- `POST /api/comments/:id/restore` - Restore deleted comment
- `GET /api/tasks/:taskId/comments/count` - Get comment count

#### Users
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `GET /api/users/:id` - Get user details
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

For complete API documentation, see [docs/仕様書.md](docs/仕様書.md).

## 🏗 Architecture

### Domain-Driven Design
- **Entities**: Business objects with domain logic
- **Repositories**: Data access abstraction
- **Services**: Application orchestration layer
- **API Routes**: Type-safe HTTP endpoints

### Key Patterns
- **Result Pattern**: Functional error handling with neverthrow
- **Type Safety**: End-to-end TypeScript with Zod validation
- **Clean Architecture**: Separation of concerns across layers
- **Enhanced Errors**: Structured error system with HTTP mapping

### Database Design
- **SQLite**: Lightweight, file-based database
- **Migrations**: Version-controlled schema changes
- **Indexes**: Optimized for common query patterns
- **Soft Deletion**: Preserve data with deleted_at timestamps

## 🧪 Testing

The project includes comprehensive test coverage:

- **Unit Tests**: Domain logic and validation
- **Integration Tests**: API endpoints and database operations
- **Type Safety**: Compile-time error prevention

```bash
# Run all tests
bun test

# Run with coverage
bun test --coverage

# Run specific test suite
bun test src/entities/task/
```

## 🔧 Configuration

Key configuration files:
- `CLAUDE.md` - Development guidelines and commands
- `drizzle.config.ts` - Database configuration
- `tsconfig.json` - TypeScript configuration
- `biome.json` - Linting and formatting rules

## 📈 Development Workflow

1. **Feature Development**: Follow domain-driven design patterns
2. **Testing**: Write tests for domain logic and API endpoints
3. **Code Quality**: Run lint and type checks
4. **Database Changes**: Generate and apply migrations
5. **Documentation**: Update API specs and README

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Ensure all checks pass
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🔗 Related Documentation

- [API Specification](docs/仕様書.md) - Complete API documentation
- [Development Guide](CLAUDE.md) - Development setup and patterns

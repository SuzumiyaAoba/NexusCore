import { Hono } from "hono";
import { taskRoutesTyped } from "../features/task-management/api/routes-typed";
import { userRoutesTyped } from "../features/user-management/api/routes-typed";

// Create main app with complete type inference
const app = new Hono();

// Register typed routes
app.route("/", userRoutesTyped);
app.route("/", taskRoutesTyped);

// Basic API documentation endpoint
app.get("/api/docs", (c) => {
  return c.json({
    name: "NexusCore API",
    version: "1.0.0",
    description: "TODO management system API with complete type safety",
    endpoints: {
      tasks: {
        "POST /api/tasks": "Create a new task",
        "GET /api/tasks": "Get all tasks with filtering",
        "GET /api/tasks/:id": "Get a specific task",
        "PUT /api/tasks/:id": "Update a task",
        "DELETE /api/tasks/:id": "Delete a task",
        "GET /api/tasks/deleted": "Get deleted tasks",
        "PUT /api/tasks/:id/restore": "Restore a deleted task",
        "DELETE /api/tasks/:id/permanent": "Permanently delete a task",
      },
      users: {
        "POST /api/users": "Create a new user",
        "GET /api/users": "Get all users",
        "GET /api/users/:id": "Get a specific user",
        "PUT /api/users/:id": "Update a user",
        "DELETE /api/users/:id": "Delete a user",
      },
    },
  });
});

// Health check endpoint
app.get("/api/health", (c) =>
  c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  }),
);

export default app;

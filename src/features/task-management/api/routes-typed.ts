import { Hono } from "hono";
import { z } from "zod";
import { TaskRepository } from "../../../entities/task/api/repository";
import { RouteBuilder } from "../../../shared/lib/api/route-builder";
import { idParamSchema } from "../../../shared/lib/validation/params";
import { paginationQuerySchema } from "../../../shared/lib/validation/query";
import {
  createTaskRequestSchema,
  taskQuerySchema,
  updateTaskRequestSchema,
} from "../../../shared/lib/validation/request";
import { TaskService } from "./service";

const taskRepository = new TaskRepository();
const taskService = new TaskService(taskRepository);

const taskRoutes = new Hono();
const routes = new RouteBuilder(taskRoutes);

// Create task
routes.post("/api/tasks", {
  body: createTaskRequestSchema,
  handler: async (c) => {
    const taskData = c.get("validatedBody");
    // TODO: Get createdBy from authenticated user context
    // For now, get from header for testing or use default
    const userIdHeader = c.req.header("x-user-id");
    const createdBy = userIdHeader ? Number.parseInt(userIdHeader) : 1;
    const result = await taskService.createTask(taskData, createdBy);

    if (!result.success) {
      const statusCode = result.error.statusCode || 500;
      return c.json(
        {
          error: {
            code: result.error.code,
            message: result.error.message,
          },
        },
        statusCode as 400 | 401 | 403 | 404 | 409 | 500,
      );
    }

    return c.json(result.data, 201);
  },
});

// Get all tasks
routes.get("/api/tasks", {
  query: taskQuerySchema,
  handler: async (c) => {
    const query = c.get("validatedQuery");
    const result = await taskService.getTasks(query);

    if (!result.success) {
      const statusCode = result.error.statusCode || 500;
      return c.json(
        {
          error: {
            code: result.error.code,
            message: result.error.message,
          },
        },
        statusCode as 400 | 401 | 403 | 404 | 409 | 500,
      );
    }

    return c.json(result.data);
  },
});

// Get deleted tasks (must be before /api/tasks/:id)
routes.get("/api/tasks/deleted", {
  query: paginationQuerySchema,
  handler: async (c) => {
    const query = c.get("validatedQuery");
    const result = await taskService.getDeletedTasks(query);

    if (!result.success) {
      const statusCode = result.error.statusCode || 500;
      return c.json(
        {
          error: {
            code: result.error.code,
            message: result.error.message,
          },
        },
        statusCode as 400 | 401 | 403 | 404 | 409 | 500,
      );
    }

    return c.json(result.data);
  },
});

// Get task by ID
routes.get("/api/tasks/:id", {
  params: idParamSchema,
  handler: async (c) => {
    const { id } = c.get("validatedParams");
    const result = await taskService.getTaskById(id);

    if (!result.success) {
      const statusCode = result.error.statusCode || 500;
      return c.json(
        {
          error: {
            code: result.error.code,
            message: result.error.message,
          },
        },
        statusCode as 400 | 401 | 403 | 404 | 409 | 500,
      );
    }

    return c.json(result.data);
  },
});

// Update task
routes.put("/api/tasks/:id", {
  params: idParamSchema,
  body: updateTaskRequestSchema,
  handler: async (c) => {
    const { id } = c.get("validatedParams");
    const taskData = c.get("validatedBody");
    const result = await taskService.updateTask(id, taskData);

    if (!result.success) {
      const statusCode = result.error.statusCode || 500;
      return c.json(
        {
          error: {
            code: result.error.code,
            message: result.error.message,
          },
        },
        statusCode as 400 | 401 | 403 | 404 | 409 | 500,
      );
    }

    return c.json(result.data);
  },
});

// Delete task
routes.delete("/api/tasks/:id", {
  params: idParamSchema,
  handler: async (c) => {
    const { id } = c.get("validatedParams");
    const result = await taskService.deleteTask(id);

    if (!result.success) {
      const statusCode = result.error.statusCode || 500;
      return c.json(
        {
          error: {
            code: result.error.code,
            message: result.error.message,
          },
        },
        statusCode as 400 | 401 | 403 | 404 | 409 | 500,
      );
    }

    return new Response(null, { status: 204 });
  },
});

// Restore task
routes.put("/api/tasks/:id/restore", {
  params: idParamSchema,
  body: z.object({}), // Empty body schema for PUT without body
  handler: async (c) => {
    const { id } = c.get("validatedParams");
    const result = await taskService.restoreTask(id);

    if (!result.success) {
      const statusCode = result.error.statusCode || 500;
      return c.json(
        {
          error: {
            code: result.error.code,
            message: result.error.message,
          },
        },
        statusCode as 400 | 401 | 403 | 404 | 409 | 500,
      );
    }

    return c.json(result.data);
  },
});

// Permanently delete task
routes.delete("/api/tasks/:id/permanent", {
  params: idParamSchema,
  handler: async (c) => {
    const { id } = c.get("validatedParams");
    const result = await taskService.permanentDeleteTask(id);

    if (!result.success) {
      const statusCode = result.error.statusCode || 500;
      return c.json(
        {
          error: {
            code: result.error.code,
            message: result.error.message,
          },
        },
        statusCode as 400 | 401 | 403 | 404 | 409 | 500,
      );
    }

    return new Response(null, { status: 204 });
  },
});

export { taskRoutes as taskRoutesTyped };

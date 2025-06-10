import { TaskRepository } from "@/entities/task/api/repository";
import { idParamSchema } from "@/shared/lib/validation/params";
import { paginationQuerySchema } from "@/shared/lib/validation/query";
import { createTaskRequestSchema, taskQuerySchema, updateTaskRequestSchema } from "@/shared/lib/validation/request";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { validator as zValidator } from "hono-openapi/zod";
import { z } from "zod";
import { TaskService } from "./service";

const taskRepository = new TaskRepository();
const taskService = new TaskService(taskRepository);

const taskRoutes = new Hono();

const setupTaskRoutes = (app: Hono) => {
  app.post(
    "/api/tasks",
    describeRoute({
      description: "Create a new task",
      responses: {
        201: {
          description: "Task created successfully",
        },
      },
    }),
    zValidator("json", createTaskRequestSchema),
    async (c) => {
      const taskData = c.req.valid("json");
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
  );

  app.get(
    "/api/tasks",
    describeRoute({
      description: "Get all tasks",
      responses: {
        200: {
          description: "Tasks fetched successfully",
        },
      },
    }),
    zValidator("query", taskQuerySchema),
    async (c) => {
      const query = c.req.valid("query");
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
  );

  app.get(
    "/api/tasks/deleted",
    describeRoute({
      description: "Get deleted tasks",
      responses: {
        200: {
          description: "Deleted tasks fetched successfully",
        },
      },
    }),
    zValidator("query", paginationQuerySchema),
    async (c) => {
      const query = c.req.valid("query");
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
  );

  app.get(
    "/api/tasks/:id",
    describeRoute({
      description: "Get task by ID",
      responses: {
        200: {
          description: "Task fetched successfully",
        },
      },
    }),
    zValidator("param", idParamSchema),
    async (c) => {
      const { id } = c.req.valid("param");
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
  );

  app.put(
    "/api/tasks/:id",
    describeRoute({
      description: "Update task",
      responses: {
        200: {
          description: "Task updated successfully",
        },
      },
    }),
    zValidator("param", idParamSchema),
    zValidator("json", updateTaskRequestSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const taskData = c.req.valid("json");
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
  );

  app.delete(
    "/api/tasks/:id",
    describeRoute({
      description: "Delete task",
      responses: {
        204: {
          description: "Task deleted successfully",
        },
      },
    }),
    zValidator("param", idParamSchema),
    async (c) => {
      const { id } = c.req.valid("param");
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
  );

  app.put(
    "/api/tasks/:id/restore",
    describeRoute({
      description: "Restore deleted task",
      responses: {
        200: {
          description: "Task restored successfully",
        },
      },
    }),
    zValidator("param", idParamSchema),
    zValidator("json", z.object({})),
    async (c) => {
      const { id } = c.req.valid("param");
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
  );

  app.delete(
    "/api/tasks/:id/permanent",
    describeRoute({
      description: "Permanently delete task",
      responses: {
        204: {
          description: "Task permanently deleted successfully",
        },
      },
    }),
    zValidator("param", idParamSchema),
    async (c) => {
      const { id } = c.req.valid("param");
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
  );
};

export { setupTaskRoutes };

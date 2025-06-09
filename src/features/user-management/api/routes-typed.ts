import { Hono } from "hono";
import { UserRepository } from "../../../entities/user/api/repository";
import { RouteBuilder } from "../../../shared/lib/api/route-builder";
import { idParamSchema } from "../../../shared/lib/validation/params";
import { paginationQuerySchema } from "../../../shared/lib/validation/query";
import { createUserRequestSchema, updateUserRequestSchema } from "../../../shared/lib/validation/request";
import { UserService } from "./service";

const userRepository = new UserRepository();
const userService = new UserService(userRepository);

const userRoutes = new Hono();
const routes = new RouteBuilder(userRoutes);

// Create user
routes.post("/api/users", {
  body: createUserRequestSchema,
  handler: async (c) => {
    const userData = c.get("validatedBody");
    const result = await userService.createUser(userData);

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

// Get all users
routes.get("/api/users", {
  query: paginationQuerySchema,
  handler: async (c) => {
    const query = c.get("validatedQuery");
    const result = await userService.getUsers(query);

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

// Get user by ID
routes.get("/api/users/:id", {
  params: idParamSchema,
  handler: async (c) => {
    const { id } = c.get("validatedParams");
    const result = await userService.getUserById(id);

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

// Update user
routes.put("/api/users/:id", {
  params: idParamSchema,
  body: updateUserRequestSchema,
  handler: async (c) => {
    const { id } = c.get("validatedParams");
    const userData = c.get("validatedBody");
    const result = await userService.updateUser(id, userData);

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

// Delete user
routes.delete("/api/users/:id", {
  params: idParamSchema,
  handler: async (c) => {
    const { id } = c.get("validatedParams");
    const result = await userService.deleteUser(id);

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

export { userRoutes as userRoutesTyped };

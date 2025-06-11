import { UserRepository } from "@/entities/user/api/repository";
import { handleResultError } from "@/shared/lib/api/error-helpers";
import { idParamSchema } from "@/shared/lib/validation/params";
import { paginationQuerySchema } from "@/shared/lib/validation/query";
import { createUserRequestSchema, updateUserRequestSchema } from "@/shared/lib/validation/request";
import type { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";
import { paginatedUserResponseSchema } from "./schemas";
import { UserService } from "./service";

const userRepository = new UserRepository();
const userService = new UserService(userRepository);

const setupUserRoutes = (app: Hono) => {
  app.post(
    "/api/users",
    describeRoute({
      description: "Create a new user",
      responses: {
        201: {
          description: "User created successfully",
        },
      },
    }),
    zValidator("json", createUserRequestSchema),
    async (c) => {
      const userData = c.req.valid("json");
      const result = await userService.createUser(userData);

      if (!result.success) {
        return handleResultError(c, result);
      }

      return c.json(result.data, 201);
    },
  );

  app.get(
    "/api/users",
    describeRoute({
      description: "Get all users",
      responses: {
        200: {
          description: "Users fetched successfully",
          content: {
            "application/json": {
              schema: resolver(paginatedUserResponseSchema),
            },
          },
        },
      },
    }),
    zValidator("query", paginationQuerySchema),
    async (c) => {
      const query = c.req.valid("query");
      const result = await userService.getUsers(query);

      if (!result.success) {
        return handleResultError(c, result);
      }

      return c.json(result.data);
    },
  );

  app.get(
    "/api/users/:id",
    describeRoute({
      description: "Get user by ID",
      responses: {
        200: {
          description: "User fetched successfully",
        },
      },
    }),
    zValidator("param", idParamSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const result = await userService.getUserById(id);

      if (!result.success) {
        return handleResultError(c, result);
      }

      return c.json(result.data);
    },
  );

  app.put(
    "/api/users/:id",
    describeRoute({
      description: "Update user",
      responses: {
        200: {
          description: "User updated successfully",
        },
      },
    }),
    zValidator("param", idParamSchema),
    zValidator("json", updateUserRequestSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const userData = c.req.valid("json");
      const result = await userService.updateUser(id, userData);

      if (!result.success) {
        return handleResultError(c, result);
      }

      return c.json(result.data);
    },
  );

  app.delete(
    "/api/users/:id",
    describeRoute({
      description: "Delete user",
      responses: {
        204: {
          description: "User deleted successfully",
        },
      },
    }),
    zValidator("param", idParamSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const result = await userService.deleteUser(id);

      if (!result.success) {
        return handleResultError(c, result);
      }

      return new Response(null, { status: 204 });
    },
  );
};

export { setupUserRoutes };

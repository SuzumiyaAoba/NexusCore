import type { Context, Next } from "hono";
import { z } from "zod";

export function validateJson<T>(schema: z.ZodSchema<T>) {
  return async (c: Context, next: Next) => {
    try {
      const body = await c.req.json();
      const validated = schema.parse(body);
      c.set("validatedBody", validated);
      await next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json(
          {
            error: {
              code: "VALIDATION_ERROR",
              message: "Invalid request body",
              details: error.errors.map((err) => ({
                field: err.path.join("."),
                message: err.message,
              })),
            },
          },
          400 as any,
        );
      }
      return c.json(
        {
          error: {
            code: "INVALID_JSON",
            message: "Invalid JSON format",
          },
        },
        400,
      );
    }
  };
}

export function validateQuery<T>(schema: z.ZodSchema<T>) {
  return async (c: Context, next: Next) => {
    try {
      const query = c.req.query();
      const validated = schema.parse(query);
      c.set("validatedQuery", validated);
      await next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json(
          {
            error: {
              code: "VALIDATION_ERROR",
              message: "Invalid query parameters",
              details: error.errors.map((err) => ({
                field: err.path.join("."),
                message: err.message,
              })),
            },
          },
          400 as any,
        );
      }
      return c.json(
        {
          error: {
            code: "INTERNAL_ERROR",
            message: "Unexpected error during query validation",
          },
        },
        500 as any,
      );
    }
  };
}

export function validateParams<T>(schema: z.ZodSchema<T>) {
  return async (c: Context, next: Next) => {
    try {
      const params = c.req.param();
      const validated = schema.parse(params);
      c.set("validatedParams", validated);
      await next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json(
          {
            error: {
              code: "VALIDATION_ERROR",
              message: "Invalid path parameters",
              details: error.errors.map((err) => ({
                field: err.path.join("."),
                message: err.message,
              })),
            },
          },
          400 as any,
        );
      }
      return c.json(
        {
          error: {
            code: "INTERNAL_ERROR",
            message: "Unexpected error during parameter validation",
          },
        },
        500 as any,
      );
    }
  };
}

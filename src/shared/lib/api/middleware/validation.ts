import { validator as zValidator } from "hono-openapi/zod";
import type { z } from "zod";

declare module "hono" {
  interface ContextVariableMap {
    validatedBody: any;
    validatedQuery: any;
    validatedParam: any;
  }
}

export const createValidationMiddleware = <T extends z.ZodTypeAny>(target: "json" | "query" | "param", schema: T) => {
  return zValidator(target, schema);
};

export const validateJson = <T extends z.ZodTypeAny>(schema: T) => createValidationMiddleware("json", schema);

export const validateQuery = <T extends z.ZodTypeAny>(schema: T) => createValidationMiddleware("query", schema);

export const validateParam = <T extends z.ZodTypeAny>(schema: T) => createValidationMiddleware("param", schema);

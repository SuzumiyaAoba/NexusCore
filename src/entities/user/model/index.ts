import { type Result, err, ok } from "neverthrow";
import { z } from "zod";
import { type AppError, ErrorFactory } from "../../../shared/lib/errors/enhanced";
import type { CreateUserRequest, UpdateUserRequest, User } from "../../../shared/types";

// Validation schemas
export const createUserSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-zA-Z0-9_]+$/, "Username must contain only letters, numbers, and underscores"),
  displayName: z.string().min(1).max(100),
  email: z.string().email(),
  avatarUrl: z.string().url().optional(),
});

export const updateUserSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  avatarUrl: z.string().url().optional(),
});

export const userIdSchema = z.coerce.number().int().positive();

// Domain logic
export namespace UserDomain {
  export function validateCreate(data: unknown): Result<CreateUserRequest, AppError> {
    try {
      const validated = createUserSchema.parse(data);
      return ok(validated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const message = error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
        return err(ErrorFactory.validation(message, error.errors[0]?.path[0]?.toString()));
      }
      return err(ErrorFactory.validation("Invalid user data"));
    }
  }

  export function validateUpdate(data: unknown): Result<UpdateUserRequest, AppError> {
    try {
      const validated = updateUserSchema.parse(data);
      return ok(validated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const message = error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
        return err(ErrorFactory.validation(message, error.errors[0]?.path[0]?.toString()));
      }
      return err(ErrorFactory.validation("Invalid user update data"));
    }
  }

  export function validateId(id: unknown): Result<number, AppError> {
    try {
      const validated = userIdSchema.parse(id);
      return ok(validated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return err(ErrorFactory.validation("Invalid user ID"));
      }
      return err(ErrorFactory.validation("Invalid user ID"));
    }
  }

  export function isValidUsername(username: string): boolean {
    return /^[a-zA-Z0-9_]{3,50}$/.test(username);
  }

  export function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}

export type { User, CreateUserRequest, UpdateUserRequest };

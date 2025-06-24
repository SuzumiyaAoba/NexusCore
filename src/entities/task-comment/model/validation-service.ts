import { type Result, err, ok } from "neverthrow";
import { z } from "zod";
import { type AppError, ErrorFactory } from "../../../shared/lib/errors/enhanced";
import type { CreateTaskCommentRequest, TaskCommentQuery, UpdateTaskCommentRequest } from "../../../shared/types";
import {
  createTaskCommentSchema,
  taskCommentIdSchema,
  taskCommentQuerySchema,
  updateTaskCommentSchema,
} from "./validation-schemas";

function handleZodError(error: unknown, fallbackMessage: string): Result<never, AppError> {
  if (error instanceof z.ZodError) {
    const message = error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
    return err(ErrorFactory.validation(message, error.errors[0]?.path[0]?.toString()));
  }
  return err(ErrorFactory.validation(fallbackMessage));
}

export function validateCreate(data: unknown): Result<CreateTaskCommentRequest, AppError> {
  const result = createTaskCommentSchema.safeParse(data);
  if (!result.success) {
    return handleZodError(result.error, "Invalid task comment data");
  }
  return ok(result.data);
}

export function validateUpdate(data: unknown): Result<UpdateTaskCommentRequest, AppError> {
  const result = updateTaskCommentSchema.safeParse(data);
  if (!result.success) {
    return handleZodError(result.error, "Invalid task comment update data");
  }
  return ok(result.data);
}

export function validateId(id: unknown): Result<number, AppError> {
  const result = taskCommentIdSchema.safeParse(id);
  if (!result.success) {
    return handleZodError(result.error, "Invalid task comment ID");
  }
  return ok(result.data);
}

export function validateQuery(query: unknown): Result<TaskCommentQuery, AppError> {
  const result = taskCommentQuerySchema.safeParse(query);
  if (!result.success) {
    return handleZodError(result.error, "Invalid task comment query parameters");
  }
  return ok(result.data);
}

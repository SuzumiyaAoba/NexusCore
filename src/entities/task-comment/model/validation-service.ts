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
  try {
    const validated = createTaskCommentSchema.parse(data);
    return ok(validated);
  } catch (error) {
    return handleZodError(error, "Invalid task comment data");
  }
}

export function validateUpdate(data: unknown): Result<UpdateTaskCommentRequest, AppError> {
  try {
    const validated = updateTaskCommentSchema.parse(data);
    return ok(validated);
  } catch (error) {
    return handleZodError(error, "Invalid task comment update data");
  }
}

export function validateId(id: unknown): Result<number, AppError> {
  try {
    const validated = taskCommentIdSchema.parse(id);
    return ok(validated);
  } catch (error) {
    return handleZodError(error, "Invalid task comment ID");
  }
}

export function validateQuery(query: unknown): Result<TaskCommentQuery, AppError> {
  try {
    const validated = taskCommentQuerySchema.parse(query);
    return ok(validated);
  } catch (error) {
    return handleZodError(error, "Invalid task comment query parameters");
  }
}

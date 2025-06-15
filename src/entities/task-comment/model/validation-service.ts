import { type Result, err, ok } from "neverthrow";
import { z } from "zod";
import { type AppError, ErrorFactory } from "../../../shared/lib/errors/enhanced";
import {
  createTaskCommentRequestSchema,
  taskCommentIdSchema,
  updateTaskCommentRequestSchema,
} from "./validation-schemas";
import type { CreateTaskCommentRequest, UpdateTaskCommentRequest } from "./validation-schemas";

function handleZodError(error: unknown, fallbackMessage: string): Result<never, AppError> {
  if (error instanceof z.ZodError) {
    const message = error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
    return err(ErrorFactory.validation(message, error.errors[0]?.path[0]?.toString()));
  }
  return err(ErrorFactory.validation(fallbackMessage));
}

export function validateCreate(data: unknown): Result<CreateTaskCommentRequest, AppError> {
  const result = createTaskCommentRequestSchema.safeParse(data);
  if (!result.success) {
    return handleZodError(result.error, "Invalid comment creation data");
  }
  return ok(result.data);
}

export function validateUpdate(data: unknown): Result<UpdateTaskCommentRequest, AppError> {
  const result = updateTaskCommentRequestSchema.safeParse(data);
  if (!result.success) {
    return handleZodError(result.error, "Invalid comment update data");
  }
  return ok(result.data);
}

export function validateId(id: unknown): Result<number, AppError> {
  const result = taskCommentIdSchema.safeParse(id);
  if (!result.success) {
    return handleZodError(result.error, "Invalid comment ID");
  }
  return ok(result.data);
}

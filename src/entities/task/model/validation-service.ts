import { type Result, err, ok } from "neverthrow";
import { z } from "zod";
import { type AppError, ErrorFactory } from "../../../shared/lib/errors/enhanced";
import type { CreateTaskRequest, UpdateTaskRequest } from "../../../shared/types";
import { createTaskSchema, taskIdSchema, updateTaskSchema } from "./validation-schemas";

function handleZodError(error: unknown, fallbackMessage: string): Result<never, AppError> {
  if (error instanceof z.ZodError) {
    const message = error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
    return err(ErrorFactory.validation(message, error.errors[0]?.path[0]?.toString()));
  }
  return err(ErrorFactory.validation(fallbackMessage));
}

export function validateCreate(data: unknown): Result<CreateTaskRequest, AppError> {
  try {
    const validated = createTaskSchema.parse(data);
    return ok(validated);
  } catch (error) {
    return handleZodError(error, "Invalid task data");
  }
}

export function validateUpdate(data: unknown): Result<UpdateTaskRequest, AppError> {
  try {
    const validated = updateTaskSchema.parse(data);
    return ok(validated);
  } catch (error) {
    return handleZodError(error, "Invalid task update data");
  }
}

export function validateId(id: unknown): Result<number, AppError> {
  try {
    const validated = taskIdSchema.parse(id);
    return ok(validated);
  } catch (error) {
    return handleZodError(error, "Invalid task ID");
  }
}

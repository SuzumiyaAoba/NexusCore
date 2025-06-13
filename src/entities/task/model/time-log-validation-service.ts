import { type Result, err, ok } from "neverthrow";
import { type AppError, ErrorFactory } from "../../../shared/lib/errors/enhanced";
import type { CreateTimeLogRequest, TimeLogQuery, UpdateTimeLogRequest } from "../../../shared/types";
import {
  createTimeLogSchema,
  timeLogIdSchema,
  timeLogQuerySchema,
  updateTimeLogSchema,
} from "./time-log-validation-schemas";

function handleZodError(error: unknown, context: string): AppError {
  if (error && typeof error === "object" && "issues" in error) {
    const zodError = error as { issues: Array<{ path: string[]; message: string }> };
    const firstIssue = zodError.issues[0];
    return ErrorFactory.validation(`${context}: ${firstIssue?.message}`, firstIssue?.path.join("."));
  }
  return ErrorFactory.validation(context);
}

export function validateCreateTimeLog(data: unknown): Result<CreateTimeLogRequest, AppError> {
  try {
    const validated = createTimeLogSchema.parse(data);
    return ok(validated);
  } catch (error) {
    return err(handleZodError(error, "Invalid time log data"));
  }
}

export function validateUpdateTimeLog(data: unknown): Result<UpdateTimeLogRequest, AppError> {
  try {
    const validated = updateTimeLogSchema.parse(data);
    return ok(validated);
  } catch (error) {
    return err(handleZodError(error, "Invalid time log update data"));
  }
}

export function validateTimeLogQuery(data: unknown): Result<TimeLogQuery, AppError> {
  try {
    const validated = timeLogQuerySchema.parse(data);
    return ok(validated);
  } catch (error) {
    return err(handleZodError(error, "Invalid time log query"));
  }
}

export function validateTimeLogId(data: unknown): Result<number, AppError> {
  try {
    const validated = timeLogIdSchema.parse(data);
    return ok(validated);
  } catch (error) {
    return err(handleZodError(error, "Invalid time log ID"));
  }
}

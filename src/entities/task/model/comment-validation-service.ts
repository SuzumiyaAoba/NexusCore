import { type Result, err, ok } from "neverthrow";
import { type AppError, ErrorFactory } from "../../../shared/lib/errors/enhanced";
import type { CommentQuery, CreateCommentRequest, UpdateCommentRequest } from "../../../shared/types";
import {
  commentIdSchema,
  commentQuerySchema,
  createCommentSchema,
  updateCommentSchema,
} from "./comment-validation-schemas";

function handleZodError(error: unknown, context: string): AppError {
  if (error && typeof error === "object" && "issues" in error) {
    const zodError = error as { issues: Array<{ path: string[]; message: string }> };
    const firstIssue = zodError.issues[0];
    return ErrorFactory.validation(`${context}: ${firstIssue?.message}`, firstIssue?.path.join("."));
  }
  return ErrorFactory.validation(context);
}

export function validateCreateComment(data: unknown): Result<CreateCommentRequest, AppError> {
  try {
    const validated = createCommentSchema.parse(data);
    return ok(validated);
  } catch (error) {
    return err(handleZodError(error, "Invalid comment data"));
  }
}

export function validateUpdateComment(data: unknown): Result<UpdateCommentRequest, AppError> {
  try {
    const validated = updateCommentSchema.parse(data);
    return ok(validated);
  } catch (error) {
    return err(handleZodError(error, "Invalid comment update data"));
  }
}

export function validateCommentQuery(data: unknown): Result<CommentQuery, AppError> {
  try {
    const validated = commentQuerySchema.parse(data);
    return ok(validated);
  } catch (error) {
    return err(handleZodError(error, "Invalid comment query"));
  }
}

export function validateCommentId(data: unknown): Result<number, AppError> {
  try {
    const validated = commentIdSchema.parse(data);
    return ok(validated);
  } catch (error) {
    return err(handleZodError(error, "Invalid comment ID"));
  }
}

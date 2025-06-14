import { type Result, err, ok } from "neverthrow";
import { type AppError, ErrorFactory } from "../../../shared/lib/errors/enhanced";
import type { AttachmentQuery, CreateAttachmentRequest } from "../../../shared/types";
import {
  attachmentIdSchema,
  attachmentQuerySchema,
  createAttachmentSchema,
  fileUploadSchema,
} from "./attachment-validation-schemas";

function handleZodError(error: unknown, context: string): AppError {
  if (error && typeof error === "object" && "issues" in error) {
    const zodError = error as { issues: Array<{ path: string[]; message: string }> };
    const firstIssue = zodError.issues[0];
    return ErrorFactory.validation(`${context}: ${firstIssue?.message}`, firstIssue?.path.join("."));
  }
  return ErrorFactory.validation(context);
}

export function validateCreateAttachment(data: unknown): Result<CreateAttachmentRequest, AppError> {
  try {
    const validated = createAttachmentSchema.parse(data);
    return ok(validated);
  } catch (error) {
    return err(handleZodError(error, "Invalid attachment data"));
  }
}

export function validateAttachmentQuery(data: unknown): Result<AttachmentQuery, AppError> {
  try {
    const validated = attachmentQuerySchema.parse(data);
    return ok(validated);
  } catch (error) {
    return err(handleZodError(error, "Invalid attachment query"));
  }
}

export function validateAttachmentId(data: unknown): Result<number, AppError> {
  try {
    const validated = attachmentIdSchema.parse(data);
    return ok(validated);
  } catch (error) {
    return err(handleZodError(error, "Invalid attachment ID"));
  }
}

export function validateFileUpload(data: unknown): Result<any, AppError> {
  try {
    const validated = fileUploadSchema.parse(data);
    return ok(validated);
  } catch (error) {
    return err(handleZodError(error, "Invalid file upload"));
  }
}

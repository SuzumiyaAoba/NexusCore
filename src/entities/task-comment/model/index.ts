import type { CreateTaskCommentRequest, TaskComment, UpdateTaskCommentRequest } from "../../../shared/types";

export * from "./validation-schemas";
export * from "./validation-service";
export * from "./business-rules";

import * as BusinessRules from "./business-rules";
import * as ValidationService from "./validation-service";

export namespace TaskCommentDomain {
  export const validateCreate = ValidationService.validateCreate;
  export const validateUpdate = ValidationService.validateUpdate;
  export const validateId = ValidationService.validateId;
  export const canEditComment = BusinessRules.canEditComment;
  export const canDeleteComment = BusinessRules.canDeleteComment;
  export const isCommentDeleted = BusinessRules.isCommentDeleted;
  export const isReplyToComment = BusinessRules.isReplyToComment;
}

export type { TaskComment, CreateTaskCommentRequest, UpdateTaskCommentRequest };

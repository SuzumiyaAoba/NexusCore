import type {
  CreateTaskCommentRequest,
  TaskComment,
  TaskCommentQuery,
  UpdateTaskCommentRequest,
} from "../../../shared/types";

export * from "./validation-schemas";
export * from "./validation-service";
export * from "./business-rules";

import * as BusinessRules from "./business-rules";
import * as ValidationService from "./validation-service";

export namespace TaskCommentDomain {
  export const validateCreate = ValidationService.validateCreate;
  export const validateUpdate = ValidationService.validateUpdate;
  export const validateId = ValidationService.validateId;
  export const validateQuery = ValidationService.validateQuery;
  export const isValidContent = BusinessRules.isValidContent;
  export const canUserModifyComment = BusinessRules.canUserModifyComment;
  export const isCommentEditable = BusinessRules.isCommentEditable;
  export const sanitizeContent = BusinessRules.sanitizeContent;
}

export type { TaskComment, CreateTaskCommentRequest, UpdateTaskCommentRequest, TaskCommentQuery };

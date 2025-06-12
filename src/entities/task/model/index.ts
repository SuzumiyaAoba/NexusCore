import type { CreateTaskRequest, Priority, Task, TaskStatus, UpdateTaskRequest } from "../../../shared/types";

export * from "./validation-schemas";
export { TaskValidation } from "./validation-service";
export { TaskBusinessRules } from "./business-rules";

import { TaskBusinessRules } from "./business-rules";
import { TaskValidation } from "./validation-service";

export namespace TaskDomain {
  export const validateCreate = TaskValidation.validateCreate;
  export const validateUpdate = TaskValidation.validateUpdate;
  export const validateId = TaskValidation.validateId;
  export const calculateEisenhowerQuadrant = TaskBusinessRules.calculateEisenhowerQuadrant;
  export const isOverdue = TaskBusinessRules.isOverdue;
  export const canUpdateStatus = TaskBusinessRules.canUpdateStatus;
  export const canUpdatePriority = TaskBusinessRules.canUpdatePriority;
  export const isValidProgress = TaskBusinessRules.isValidProgress;
  export const isValidDateRange = TaskBusinessRules.isValidDateRange;
}

export type { Task, CreateTaskRequest, UpdateTaskRequest, TaskStatus, Priority };

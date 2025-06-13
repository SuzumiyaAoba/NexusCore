import type { CreateTaskRequest, Priority, Task, TaskStatus, UpdateTaskRequest } from "../../../shared/types";

export * from "./validation-schemas";
export * from "./validation-service";
export * from "./business-rules";

import * as BusinessRules from "./business-rules";
import * as ValidationService from "./validation-service";

export namespace TaskDomain {
  export const validateCreate = ValidationService.validateCreate;
  export const validateUpdate = ValidationService.validateUpdate;
  export const validateId = ValidationService.validateId;
  export const calculateEisenhowerQuadrant = BusinessRules.calculateEisenhowerQuadrant;
  export const isOverdue = BusinessRules.isOverdue;
  export const canUpdateStatus = BusinessRules.canUpdateStatus;
  export const canUpdatePriority = BusinessRules.canUpdatePriority;
  export const isValidProgress = BusinessRules.isValidProgress;
  export const isValidDateRange = BusinessRules.isValidDateRange;
}

export type { Task, CreateTaskRequest, UpdateTaskRequest, TaskStatus, Priority };

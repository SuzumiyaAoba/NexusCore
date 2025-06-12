import { type Result, err, ok } from "neverthrow";
import { TaskDomain } from "../../../entities/task/model";
import { type AppError, ErrorFactory } from "../../../shared/lib/errors/enhanced";
import type { CreateTaskRequest, UpdateTaskRequest } from "../../../shared/types";

export class TaskValidationService {
  static validateCreate(taskData: CreateTaskRequest): Result<CreateTaskRequest, AppError> {
    const validationResult = TaskDomain.validateCreate(taskData);
    if (validationResult.isErr()) {
      return err(validationResult.error);
    }
    return ok(validationResult.value);
  }

  static validateUpdate(taskData: UpdateTaskRequest): Result<UpdateTaskRequest, AppError> {
    const validationResult = TaskDomain.validateUpdate(taskData);
    if (validationResult.isErr()) {
      return err(validationResult.error);
    }
    return ok(validationResult.value);
  }

  static validateStatusTransition(currentStatus: any, newStatus: any): Result<void, AppError> {
    if (!TaskDomain.canUpdateStatus(currentStatus, newStatus)) {
      return err(ErrorFactory.validation("Cannot change status from DONE to other statuses"));
    }
    return ok(undefined);
  }

  static validatePriorityUpdate(currentStatus: any): Result<void, AppError> {
    if (!TaskDomain.canUpdatePriority(currentStatus)) {
      return err(ErrorFactory.validation("Cannot change priority of completed tasks"));
    }
    return ok(undefined);
  }
}

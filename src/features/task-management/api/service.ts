import { type Result, err, ok } from "neverthrow";
import type { TaskRepository } from "../../../entities/task/api/repository";
import { type AppError, ErrorFactory } from "../../../shared/lib/errors/enhanced";
import type {
  CreateTaskRequest,
  PaginatedResponse,
  Task,
  TaskQuery,
  TaskWithRelations,
  UpdateTaskRequest,
} from "../../../shared/types";
import { BulkOperationService } from "./bulk-operation-service";
import * as TaskBusinessLogic from "./task-business-logic";
import * as TaskValidationService from "./task-validation-service";

export class TaskService {
  constructor(private readonly taskRepository: TaskRepository) {}

  async createTask(taskData: CreateTaskRequest, createdBy: number): Promise<Result<Task, AppError>> {
    try {
      const validationResult = TaskValidationService.validateCreate(taskData);
      if (validationResult.isErr()) {
        return err(validationResult.error);
      }

      const eisenhowerQuadrant = TaskBusinessLogic.calculateEisenhowerQuadrant(
        validationResult.value.importance || false,
        validationResult.value.urgency || false,
      );

      const task = await this.taskRepository.create({
        ...validationResult.value,
        createdBy,
        eisenhowerQuadrant,
      });

      return ok(task);
    } catch (error) {
      return err(ErrorFactory.database("Failed to create task", error instanceof Error ? error : undefined));
    }
  }

  async getTaskById(id: number): Promise<Result<TaskWithRelations, AppError>> {
    try {
      const task = await this.taskRepository.findByIdWithRelations(id);
      if (!task) {
        return err(ErrorFactory.notFound("Task", id));
      }
      return ok(task);
    } catch (error) {
      return err(ErrorFactory.database("Failed to retrieve task", error instanceof Error ? error : undefined));
    }
  }

  async getTasks(query: TaskQuery = {}): Promise<Result<PaginatedResponse<TaskWithRelations>, AppError>> {
    try {
      const result = await this.taskRepository.findAll(query);
      return ok(result);
    } catch (error) {
      return err(ErrorFactory.database("Failed to retrieve tasks", error instanceof Error ? error : undefined));
    }
  }

  async getDeletedTasks(
    options: { limit?: number; offset?: number } = {},
  ): Promise<Result<PaginatedResponse<TaskWithRelations>, AppError>> {
    try {
      const query: TaskQuery = { ...options, deletedOnly: true };
      const result = await this.taskRepository.findAll(query);
      return ok(result);
    } catch (error) {
      return err(ErrorFactory.database("Failed to retrieve deleted tasks", error instanceof Error ? error : undefined));
    }
  }

  async updateTask(id: number, taskData: UpdateTaskRequest): Promise<Result<Task, AppError>> {
    try {
      const validationResult = TaskValidationService.validateUpdate(taskData);
      if (validationResult.isErr()) {
        return err(validationResult.error);
      }

      const existingTask = await this.taskRepository.findById(id);
      if (!existingTask) {
        return err(ErrorFactory.notFound("Task", id));
      }

      const validatedData = validationResult.value;

      if (validatedData.status) {
        const statusValidation = TaskValidationService.validateStatusTransition(
          existingTask.status,
          validatedData.status,
        );
        if (statusValidation.isErr()) {
          return err(statusValidation.error);
        }
      }

      if (validatedData.priority) {
        const priorityValidation = TaskValidationService.validatePriorityUpdate(existingTask.status);
        if (priorityValidation.isErr()) {
          return err(priorityValidation.error);
        }
      }

      const { eisenhowerQuadrant } = TaskBusinessLogic.shouldRecalculateEisenhowerQuadrant(validatedData, existingTask);

      const updatedTask = await this.taskRepository.update(id, {
        ...validatedData,
        eisenhowerQuadrant,
      });

      if (!updatedTask) {
        return err(ErrorFactory.notFound("Task", id));
      }

      return ok(updatedTask);
    } catch (error) {
      return err(ErrorFactory.database("Failed to update task", error instanceof Error ? error : undefined));
    }
  }

  async deleteTask(id: number): Promise<Result<boolean, AppError>> {
    try {
      const existingTask = await this.taskRepository.findById(id);
      if (!existingTask) {
        return err(ErrorFactory.notFound("Task", id));
      }

      const result = await this.taskRepository.softDelete(id);
      return ok(result);
    } catch (error) {
      return err(ErrorFactory.database("Failed to delete task", error instanceof Error ? error : undefined));
    }
  }

  async restoreTask(id: number): Promise<Result<Task, AppError>> {
    try {
      const existingTask = await this.taskRepository.findById(id, true);
      if (!existingTask || !existingTask.deletedAt) {
        return err(ErrorFactory.notFound("Deleted task", id));
      }

      const restoredTask = await this.taskRepository.restore(id);
      if (!restoredTask) {
        return err(ErrorFactory.database("Failed to restore task"));
      }

      return ok(restoredTask);
    } catch (error) {
      return err(ErrorFactory.database("Failed to restore task", error instanceof Error ? error : undefined));
    }
  }

  async permanentDeleteTask(id: number): Promise<Result<boolean, AppError>> {
    try {
      const existingTask = await this.taskRepository.findById(id, true);
      if (!existingTask) {
        return err(ErrorFactory.notFound("Task", id));
      }

      const result = await this.taskRepository.permanentDelete(id);
      return ok(result);
    } catch (error) {
      return err(
        ErrorFactory.database("Failed to permanently delete task", error instanceof Error ? error : undefined),
      );
    }
  }

  async bulkUpdateTasks(
    ids: number[],
    taskData: UpdateTaskRequest,
  ): Promise<Result<{ updated: number; failed: number; errors: AppError[] }, AppError>> {
    const bulkOperationService = new BulkOperationService(this);
    const result = await bulkOperationService.bulkUpdate(ids, taskData);
    return result.map((data) => ({
      updated: data.successful,
      failed: data.failed,
      errors: data.errors,
    }));
  }

  async bulkDeleteTasks(
    ids: number[],
  ): Promise<Result<{ deleted: number; failed: number; errors: AppError[] }, AppError>> {
    const bulkOperationService = new BulkOperationService(this);
    const result = await bulkOperationService.bulkDelete(ids);
    return result.map((data) => ({
      deleted: data.successful,
      failed: data.failed,
      errors: data.errors,
    }));
  }
}

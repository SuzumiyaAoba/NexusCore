import type { TaskRepository } from "../../../entities/task/api/repository";
import { TaskDomain } from "../../../entities/task/model";
import { type AppError, ErrorFactory } from "../../../shared/lib/errors/enhanced";
import { type Result, failure, success } from "../../../shared/lib/types/result";
import type {
  CreateTaskRequest,
  PaginatedResponse,
  Task,
  TaskQuery,
  TaskWithRelations,
  UpdateTaskRequest,
} from "../../../shared/types";

export class TaskService {
  constructor(private readonly taskRepository: TaskRepository) {}

  async createTask(taskData: CreateTaskRequest, createdBy: number): Promise<Result<Task, AppError>> {
    try {
      // Validate input with domain logic
      const validationResult = TaskDomain.validateCreate(taskData);
      if (!validationResult.success) {
        return failure(validationResult.error);
      }

      // Calculate Eisenhower quadrant
      const eisenhowerQuadrant = TaskDomain.calculateEisenhowerQuadrant(
        validationResult.data.importance || false,
        validationResult.data.urgency || false,
      );

      const task = await this.taskRepository.create({
        ...validationResult.data,
        createdBy,
        eisenhowerQuadrant,
      });

      return success(task);
    } catch (error) {
      return failure(ErrorFactory.database("Failed to create task", error instanceof Error ? error : undefined));
    }
  }

  async getTaskById(id: number): Promise<Result<TaskWithRelations, AppError>> {
    try {
      const task = await this.taskRepository.findByIdWithRelations(id);

      if (!task) {
        return failure(ErrorFactory.notFound("Task", id));
      }

      return success(task);
    } catch (error) {
      return failure(ErrorFactory.database("Failed to retrieve task", error instanceof Error ? error : undefined));
    }
  }

  async getTasks(query: TaskQuery = {}): Promise<Result<PaginatedResponse<TaskWithRelations>, AppError>> {
    try {
      const result = await this.taskRepository.findAll(query);
      return success(result);
    } catch (error) {
      return failure(ErrorFactory.database("Failed to retrieve tasks", error instanceof Error ? error : undefined));
    }
  }

  async getDeletedTasks(
    options: { limit?: number; offset?: number } = {},
  ): Promise<Result<PaginatedResponse<TaskWithRelations>, AppError>> {
    try {
      const query: TaskQuery = {
        ...options,
        deletedOnly: true,
      };
      const result = await this.taskRepository.findAll(query);
      return success(result);
    } catch (error) {
      return failure(
        ErrorFactory.database("Failed to retrieve deleted tasks", error instanceof Error ? error : undefined),
      );
    }
  }

  async updateTask(id: number, taskData: UpdateTaskRequest): Promise<Result<Task, AppError>> {
    try {
      // Validate input
      const validationResult = TaskDomain.validateUpdate(taskData);
      if (!validationResult.success) {
        return failure(validationResult.error);
      }

      // Check if task exists and is not deleted
      const existingTask = await this.taskRepository.findById(id);
      if (!existingTask) {
        return failure(ErrorFactory.notFound("Task", id));
      }

      const validatedData = validationResult.data;

      // Check business rules
      if (validatedData.status && !TaskDomain.canUpdateStatus(existingTask.status, validatedData.status)) {
        return failure(ErrorFactory.validation("Cannot change status from DONE to other statuses"));
      }

      if (validatedData.priority && !TaskDomain.canUpdatePriority(existingTask.status)) {
        return failure(ErrorFactory.validation("Cannot change priority of completed tasks"));
      }

      // Recalculate Eisenhower quadrant if importance/urgency changed
      let eisenhowerQuadrant: number | undefined;
      if (validatedData.importance !== undefined || validatedData.urgency !== undefined) {
        const importance = validatedData.importance !== undefined ? validatedData.importance : existingTask.importance;
        const urgency = validatedData.urgency !== undefined ? validatedData.urgency : existingTask.urgency;
        eisenhowerQuadrant = TaskDomain.calculateEisenhowerQuadrant(importance, urgency);
      }

      const updatedTask = await this.taskRepository.update(id, {
        ...validatedData,
        eisenhowerQuadrant,
      });

      if (!updatedTask) {
        return failure(ErrorFactory.notFound("Task", id));
      }

      return success(updatedTask);
    } catch (error) {
      return failure(ErrorFactory.database("Failed to update task", error instanceof Error ? error : undefined));
    }
  }

  async deleteTask(id: number): Promise<Result<boolean, AppError>> {
    try {
      // Check if task exists and is not already deleted
      const existingTask = await this.taskRepository.findById(id);
      if (!existingTask) {
        return failure(ErrorFactory.notFound("Task", id));
      }

      const result = await this.taskRepository.softDelete(id);
      return success(result);
    } catch (error) {
      return failure(ErrorFactory.database("Failed to delete task", error instanceof Error ? error : undefined));
    }
  }

  async restoreTask(id: number): Promise<Result<Task, AppError>> {
    try {
      // Check if task exists and is deleted
      const existingTask = await this.taskRepository.findById(id, true);
      if (!existingTask || !existingTask.deletedAt) {
        return failure(ErrorFactory.notFound("Deleted task", id));
      }

      const restoredTask = await this.taskRepository.restore(id);
      if (!restoredTask) {
        return failure(ErrorFactory.database("Failed to restore task"));
      }

      return success(restoredTask);
    } catch (error) {
      return failure(ErrorFactory.database("Failed to restore task", error instanceof Error ? error : undefined));
    }
  }

  async permanentDeleteTask(id: number): Promise<Result<boolean, AppError>> {
    try {
      // Check if task exists
      const existingTask = await this.taskRepository.findById(id, true);
      if (!existingTask) {
        return failure(ErrorFactory.notFound("Task", id));
      }

      const result = await this.taskRepository.permanentDelete(id);
      return success(result);
    } catch (error) {
      return failure(
        ErrorFactory.database("Failed to permanently delete task", error instanceof Error ? error : undefined),
      );
    }
  }

  async bulkUpdateTasks(
    ids: number[],
    taskData: UpdateTaskRequest,
  ): Promise<Result<{ updated: number; failed: number; errors: AppError[] }, AppError>> {
    let updated = 0;
    let failed = 0;
    const errors: AppError[] = [];

    for (const id of ids) {
      const result = await this.updateTask(id, taskData);
      if (result.success) {
        updated++;
      } else {
        failed++;
        errors.push(result.error);
      }
    }

    return success({ updated, failed, errors });
  }

  async bulkDeleteTasks(
    ids: number[],
  ): Promise<Result<{ deleted: number; failed: number; errors: AppError[] }, AppError>> {
    let deleted = 0;
    let failed = 0;
    const errors: AppError[] = [];

    for (const id of ids) {
      const result = await this.deleteTask(id);
      if (result.success && result.data) {
        deleted++;
      } else {
        failed++;
        if (!result.success) {
          errors.push(result.error);
        }
      }
    }

    return success({ deleted, failed, errors });
  }
}

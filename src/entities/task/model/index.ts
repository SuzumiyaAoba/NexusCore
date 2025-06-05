import { z } from "zod";
import { type AppError, ErrorFactory } from "../../../shared/lib/errors/enhanced";
import { type Result, failure, success } from "../../../shared/lib/types/result";
import type {
  CreateTaskRequest,
  EisenhowerQuadrant,
  Priority,
  Task,
  TaskStatus,
  UpdateTaskRequest,
} from "../../../shared/types";

// Validation schemas
const taskStatusSchema = z.enum(["TODO", "DOING", "PENDING", "DONE"]);
const prioritySchema = z.enum(["low", "medium", "high"]);

export const createTaskSchema = z
  .object({
    title: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    status: taskStatusSchema.default("TODO"),
    priority: prioritySchema.default("medium"),
    importance: z.boolean().default(false),
    urgency: z.boolean().default(false),
    projectId: z.number().int().positive().optional(),
    categoryId: z.number().int().positive().optional(),
    parentId: z.number().int().positive().optional(),
    assignedTo: z.number().int().positive().optional(),
    assignmentNote: z.string().max(500).optional(),
    tagIds: z.array(z.number().int().positive()).optional(),
    estimatedTime: z.number().int().positive().optional(),
    scheduledStartDate: z.string().datetime().optional(),
    scheduledEndDate: z.string().datetime().optional(),
    dueDate: z.string().datetime().optional(),
  })
  .refine(
    (data) => {
      if (data.scheduledStartDate && data.scheduledEndDate) {
        return new Date(data.scheduledStartDate) <= new Date(data.scheduledEndDate);
      }
      return true;
    },
    {
      message: "Scheduled end date must be after start date",
      path: ["scheduledEndDate"],
    },
  );

export const updateTaskSchema = z
  .object({
    title: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    status: taskStatusSchema.optional(),
    priority: prioritySchema.optional(),
    importance: z.boolean().optional(),
    urgency: z.boolean().optional(),
    projectId: z.number().int().positive().nullable().optional(),
    categoryId: z.number().int().positive().nullable().optional(),
    assignedTo: z.number().int().positive().nullable().optional(),
    assignmentNote: z.string().max(500).optional(),
    tagIds: z.array(z.number().int().positive()).optional(),
    estimatedTime: z.number().int().positive().nullable().optional(),
    progress: z.number().int().min(0).max(100).optional(),
    scheduledStartDate: z.string().datetime().nullable().optional(),
    scheduledEndDate: z.string().datetime().nullable().optional(),
    dueDate: z.string().datetime().nullable().optional(),
  })
  .refine(
    (data) => {
      if (data.scheduledStartDate && data.scheduledEndDate) {
        return new Date(data.scheduledStartDate) <= new Date(data.scheduledEndDate);
      }
      return true;
    },
    {
      message: "Scheduled end date must be after start date",
      path: ["scheduledEndDate"],
    },
  );

export const taskIdSchema = z.coerce.number().int().positive();

// Domain logic
export namespace TaskDomain {
  export function validateCreate(data: unknown): Result<CreateTaskRequest, AppError> {
    try {
      const validated = createTaskSchema.parse(data);
      return success(validated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const message = error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
        return failure(ErrorFactory.validation(message, error.errors[0]?.path[0]?.toString()));
      }
      return failure(ErrorFactory.validation("Invalid task data"));
    }
  }

  export function validateUpdate(data: unknown): Result<UpdateTaskRequest, AppError> {
    try {
      const validated = updateTaskSchema.parse(data);
      return success(validated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const message = error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
        return failure(ErrorFactory.validation(message, error.errors[0]?.path[0]?.toString()));
      }
      return failure(ErrorFactory.validation("Invalid task update data"));
    }
  }

  export function validateId(id: unknown): Result<number, AppError> {
    try {
      const validated = taskIdSchema.parse(id);
      return success(validated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return failure(ErrorFactory.validation("Invalid task ID"));
      }
      return failure(ErrorFactory.validation("Invalid task ID"));
    }
  }

  export function calculateEisenhowerQuadrant(importance: boolean, urgency: boolean): EisenhowerQuadrant {
    if (importance && urgency) return 1; // Important & Urgent
    if (importance && !urgency) return 2; // Important & Not Urgent
    if (!importance && urgency) return 3; // Not Important & Urgent
    return 4; // Not Important & Not Urgent
  }

  export function isOverdue(dueDate: string | null | undefined): boolean {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  }

  export function canUpdateStatus(currentStatus: TaskStatus, newStatus: TaskStatus): boolean {
    // DONE tasks cannot change priority (business rule)
    if (currentStatus === "DONE" && newStatus !== "DONE") {
      return false;
    }
    return true;
  }

  export function canUpdatePriority(status: TaskStatus): boolean {
    // DONE tasks cannot change priority (business rule)
    return status !== "DONE";
  }

  export function isValidProgress(progress: number): boolean {
    return progress >= 0 && progress <= 100;
  }

  export function isValidDateRange(startDate?: string, endDate?: string): boolean {
    if (!startDate || !endDate) return true;
    return new Date(startDate) <= new Date(endDate);
  }
}

export type { Task, CreateTaskRequest, UpdateTaskRequest, TaskStatus, Priority };

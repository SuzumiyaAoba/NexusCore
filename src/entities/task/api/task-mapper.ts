import type { Task as DbTask, User as DbUser } from "../../../shared/lib/db/schema";
import { mapToUserInfo } from "../../../shared/lib/mappers/user";
import type { Task, TaskWithRelations } from "../../../shared/types";

export function toTask(dbTask: DbTask): Task {
  return {
    id: dbTask.id,
    title: dbTask.title,
    description: dbTask.description,
    status: dbTask.status,
    priority: dbTask.priority,
    importance: dbTask.importance,
    urgency: dbTask.urgency,
    eisenhowerQuadrant: dbTask.eisenhowerQuadrant,
    projectId: dbTask.projectId,
    categoryId: dbTask.categoryId,
    parentId: dbTask.parentId,
    createdBy: dbTask.createdBy,
    assignedTo: dbTask.assignedTo,
    assignmentStatus: dbTask.assignmentStatus,
    assignmentNote: dbTask.assignmentNote,
    estimatedTime: dbTask.estimatedTime,
    progress: dbTask.progress,
    scheduledDate: dbTask.scheduledDate,
    scheduledStartDate: dbTask.scheduledStartDate,
    scheduledEndDate: dbTask.scheduledEndDate,
    dueDate: dbTask.dueDate,
    deletedAt: dbTask.deletedAt,
    createdAt: dbTask.createdAt,
    updatedAt: dbTask.updatedAt,
  };
}

export function toTaskWithRelations(
  dbTask: DbTask,
  relations: {
    creator?: DbUser | null;
    assignee?: DbUser | null;
    category?: { id: number; name: string; color: string | null; createdAt: string } | null;
    tags?: Array<{ id: number; name: string; color: string | null; createdAt: string }>;
    subtaskCount?: number;
    completedSubtaskCount?: number;
  },
): TaskWithRelations {
  const task = toTask(dbTask);

  return {
    ...task,
    creator: relations.creator ? mapToUserInfo(relations.creator) : undefined,
    assignee: relations.assignee ? mapToUserInfo(relations.assignee) : undefined,
    category: relations.category
      ? {
          id: relations.category.id,
          name: relations.category.name,
          color: relations.category.color,
          createdAt: relations.category.createdAt,
        }
      : undefined,
    tags: relations.tags || [],
    subtaskCount: relations.subtaskCount || 0,
    completedSubtaskCount: relations.completedSubtaskCount || 0,
  };
}

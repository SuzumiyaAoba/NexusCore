// Common types
export type TaskStatus = "TODO" | "DOING" | "PENDING" | "DONE";
export type Priority = "low" | "medium" | "high";
export type ProjectStatus = "active" | "archived";
export type AssignmentStatus = "pending" | "accepted" | "rejected";
export type EisenhowerQuadrant = 1 | 2 | 3 | 4;

// Database entity types (inferred from schema)
import type {
  Category as DbCategory,
  Project as DbProject,
  Tag as DbTag,
  Task as DbTask,
  TaskComment as DbTaskComment,
  User as DbUser,
} from "../lib/db/schema";

export type User = DbUser;
export type Category = DbCategory;
export type Tag = DbTag;
export type Project = DbProject;
export type Task = DbTask;
export type TaskComment = DbTaskComment;

// API request/response types
export interface CreateUserRequest {
  username: string;
  displayName: string;
  email: string;
  avatarUrl?: string | undefined;
}

export interface UpdateUserRequest {
  displayName?: string | undefined;
  email?: string | undefined;
  avatarUrl?: string | undefined;
}

export interface CreateTaskRequest {
  title: string;
  description?: string | null | undefined;
  status?: TaskStatus | undefined;
  priority?: Priority | undefined;
  importance?: boolean | undefined;
  urgency?: boolean | undefined;
  projectId?: number | undefined;
  categoryId?: number | undefined;
  parentId?: number | undefined;
  assignedTo?: number | undefined;
  assignmentNote?: string | undefined;
  tagIds?: number[] | undefined;
  estimatedTime?: number | undefined;
  scheduledStartDate?: string | undefined;
  scheduledEndDate?: string | undefined;
  dueDate?: string | undefined;
}

export interface UpdateTaskRequest {
  title?: string | undefined;
  description?: string | null | undefined;
  status?: TaskStatus | undefined;
  priority?: Priority | undefined;
  importance?: boolean | undefined;
  urgency?: boolean | undefined;
  projectId?: number | null | undefined;
  categoryId?: number | null | undefined;
  assignedTo?: number | null | undefined;
  assignmentNote?: string | undefined;
  tagIds?: number[] | undefined;
  estimatedTime?: number | null | undefined;
  progress?: number | undefined;
  scheduledStartDate?: string | null | undefined;
  scheduledEndDate?: string | null | undefined;
  dueDate?: string | null | undefined;
}

// API response types with related data
export interface TaskWithRelations extends Task {
  creator?: User;
  assignee?: User;
  category?: Category;
  project?: Project;
  tags?: Tag[];
  subtaskCount?: number;
  completedSubtaskCount?: number;
}

export interface UserWithStats extends User {
  taskCount?: number;
  completedTaskCount?: number;
}

export interface ProjectWithStats extends Project {
  taskCount?: number;
  completedTaskCount?: number;
  owner?: User;
}

// Error types
export interface ApiError {
  code: string;
  message: string;
  details?: Array<{
    field: string;
    message: string;
  }>;
}

// Query types
export interface TaskQuery {
  status?: TaskStatus;
  importance?: boolean;
  urgency?: boolean;
  eisenhowerQuadrant?: EisenhowerQuadrant;
  categoryId?: number;
  projectId?: number;
  tagId?: number;
  tagIds?: number[];
  parentId?: number;
  priority?: Priority;
  search?: string;
  q?: string;
  createdBy?: number;
  assignedTo?: number;
  assignmentStatus?: AssignmentStatus;
  scheduledStartFrom?: string;
  scheduledStartTo?: string;
  scheduledEndFrom?: string;
  scheduledEndTo?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  hasAttachments?: boolean;
  hasComments?: boolean;
  isOverdue?: boolean;
  progressMin?: number;
  progressMax?: number;
  includeSubtasks?: boolean;
  includeDeleted?: boolean;
  deletedOnly?: boolean;
  sortBy?: string;
  order?: "asc" | "desc";
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

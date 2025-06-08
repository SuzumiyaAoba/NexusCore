import { z } from "zod";

export const createTaskRequestSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(["TODO", "DOING", "PENDING", "DONE"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  importance: z.boolean().optional(),
  urgency: z.boolean().optional(),
  projectId: z.number().optional(),
  categoryId: z.number().optional(),
  parentId: z.number().optional(),
  assignedTo: z.number().optional(),
  assignmentNote: z.string().optional(),
  estimatedTime: z.number().optional(),
  scheduledStartDate: z.string().optional(),
  scheduledEndDate: z.string().optional(),
  dueDate: z.string().optional(),
  tagIds: z.array(z.number()).optional(),
});

export const updateTaskRequestSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(["TODO", "DOING", "PENDING", "DONE"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  importance: z.boolean().optional(),
  urgency: z.boolean().optional(),
  projectId: z.number().optional(),
  categoryId: z.number().optional(),
  assignedTo: z.number().optional(),
  assignmentNote: z.string().optional(),
  estimatedTime: z.number().optional(),
  progress: z.number().min(0).max(100).optional(),
  scheduledStartDate: z.string().optional(),
  scheduledEndDate: z.string().optional(),
  dueDate: z.string().optional(),
  tagIds: z.array(z.number()).optional(),
});

export const createUserRequestSchema = z.object({
  username: z.string().min(1),
  displayName: z.string().min(1),
  email: z.string().email(),
  avatarUrl: z.string().optional(),
});

export const updateUserRequestSchema = z.object({
  displayName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  avatarUrl: z.string().optional(),
});

export const taskQuerySchema = z.object({
  status: z.enum(["TODO", "DOING", "PENDING", "DONE"]).optional(),
  importance: z.boolean().optional(),
  urgency: z.boolean().optional(),
  eisenhowerQuadrant: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]).optional(),
  categoryId: z.number().optional(),
  projectId: z.number().optional(),
  parentId: z.number().optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  search: z.string().optional(),
  createdBy: z.number().optional(),
  assignedTo: z.number().optional(),
  includeDeleted: z.boolean().optional(),
  deletedOnly: z.boolean().optional(),
  sortBy: z.string().optional(),
  order: z.enum(["asc", "desc"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export type CreateTaskRequest = z.infer<typeof createTaskRequestSchema>;
export type UpdateTaskRequest = z.infer<typeof updateTaskRequestSchema>;
export type CreateUserRequest = z.infer<typeof createUserRequestSchema>;
export type UpdateUserRequest = z.infer<typeof updateUserRequestSchema>;
export type TaskQuery = z.infer<typeof taskQuerySchema>;
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

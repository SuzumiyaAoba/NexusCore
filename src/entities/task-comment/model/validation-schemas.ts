import { z } from "zod";

export const createTaskCommentSchema = z.object({
  taskId: z.number().int().positive(),
  content: z
    .string()
    .min(1, "Comment content cannot be empty")
    .max(1000, "Comment content cannot exceed 1000 characters"),
  parentId: z.number().int().positive().optional(),
});

export const updateTaskCommentSchema = z.object({
  content: z
    .string()
    .min(1, "Comment content cannot be empty")
    .max(1000, "Comment content cannot exceed 1000 characters"),
});

export const taskCommentIdSchema = z.coerce.number().int().positive();

export const taskCommentQuerySchema = z.object({
  taskId: z.coerce.number().int().positive().optional(),
  userId: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  sortBy: z.enum(["created_at", "updated_at"]).default("created_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

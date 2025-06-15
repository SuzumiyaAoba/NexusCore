import { z } from "zod";

export const createTaskCommentRequestSchema = z.object({
  taskId: z.number().int().positive(),
  content: z.string().min(1).max(2000),
  parentId: z.number().int().positive().optional(),
});

export const updateTaskCommentRequestSchema = z.object({
  content: z.string().min(1).max(2000),
});

export const taskCommentIdSchema = z.number().int().positive();

export type CreateTaskCommentRequest = z.infer<typeof createTaskCommentRequestSchema>;
export type UpdateTaskCommentRequest = z.infer<typeof updateTaskCommentRequestSchema>;

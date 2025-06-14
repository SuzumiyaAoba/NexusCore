import { z } from "zod";

export const commentIdSchema = z.coerce.number().int().positive();

export const createCommentSchema = z.object({
  content: z.string().min(1, "コメント内容は必須です").max(1000, "コメント内容は1000文字以内で入力してください"),
});

export const updateCommentSchema = z.object({
  content: z
    .string()
    .min(1, "コメント内容は必須です")
    .max(1000, "コメント内容は1000文字以内で入力してください")
    .optional(),
});

export const commentQuerySchema = z.object({
  taskId: z.coerce.number().int().positive().optional(),
  userId: z.coerce.number().int().positive().optional(),
  sortBy: z.enum(["createdAt", "updatedAt", "content"]).default("createdAt").optional(),
  order: z.enum(["asc", "desc"]).default("desc").optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50).optional(),
  offset: z.coerce.number().int().min(0).default(0).optional(),
});

export type CreateCommentSchema = z.infer<typeof createCommentSchema>;
export type UpdateCommentSchema = z.infer<typeof updateCommentSchema>;
export type CommentQuerySchema = z.infer<typeof commentQuerySchema>;

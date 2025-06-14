import { z } from "zod";

export const attachmentIdSchema = z.coerce.number().int().positive();

export const createAttachmentSchema = z.object({
  fileName: z.string().min(1, "ファイル名は必須です").max(255, "ファイル名は255文字以内で入力してください"),
  fileSize: z.number().int().positive("ファイルサイズは正の整数である必要があります"),
  fileType: z.string().min(1, "ファイルタイプは必須です"),
  filePath: z.string().min(1, "ファイルパスは必須です"),
});

export const attachmentQuerySchema = z.object({
  taskId: z.coerce.number().int().positive().optional(),
  uploadedBy: z.coerce.number().int().positive().optional(),
  fileType: z.string().optional(),
  sortBy: z.enum(["uploadedAt", "fileName", "fileSize"]).default("uploadedAt").optional(),
  order: z.enum(["asc", "desc"]).default("desc").optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50).optional(),
  offset: z.coerce.number().int().min(0).default(0).optional(),
});

// File upload validation (for multipart form data)
export const fileUploadSchema = z.object({
  file: z.any().refine((file) => {
    // Basic file validation - can be enhanced based on requirements
    return file && file.size > 0;
  }, "有効なファイルを選択してください"),
});

// File type restrictions
export const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
] as const;

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export type CreateAttachmentSchema = z.infer<typeof createAttachmentSchema>;
export type AttachmentQuerySchema = z.infer<typeof attachmentQuerySchema>;
export type FileUploadSchema = z.infer<typeof fileUploadSchema>;

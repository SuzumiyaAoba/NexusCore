import { AttachmentRepository } from "@/entities/task/api/attachment-repository";
import { TaskRepository } from "@/entities/task/api/repository";
import {
  attachmentIdSchema,
  attachmentQuerySchema,
  createAttachmentSchema,
} from "@/entities/task/model/attachment-validation-schemas";
import { handleResultError } from "@/shared/lib/api/error-helpers";
import type { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { validator as zValidator } from "hono-openapi/zod";
import { z } from "zod";
import { AttachmentService } from "./service";

const attachmentRepository = new AttachmentRepository();
const taskRepository = new TaskRepository();
const attachmentService = new AttachmentService(attachmentRepository, taskRepository);

export function setupAttachmentRoutes(app: Hono) {
  // タスクの添付ファイル一覧取得
  app.get(
    "/api/tasks/:taskId/attachments",
    describeRoute({
      summary: "Get attachments for a task",
      tags: ["Attachments"],
    }),
    zValidator("param", z.object({ taskId: attachmentIdSchema })),
    async (c) => {
      const { taskId } = c.req.valid("param");

      const result = await attachmentService.getAttachmentsByTaskId(taskId);
      if (result.isErr()) {
        return handleResultError(c, result.error);
      }

      return c.json(result.value);
    },
  );

  // ファイル添付（JSONデータ版）
  app.post(
    "/api/tasks/:taskId/attachments",
    describeRoute({
      summary: "Attach file to a task",
      tags: ["Attachments"],
    }),
    zValidator("param", z.object({ taskId: attachmentIdSchema })),
    zValidator("json", createAttachmentSchema),
    async (c) => {
      const { taskId } = c.req.valid("param");
      const attachmentData = c.req.valid("json");

      // FIXME: Replace with proper authentication
      const userId = Number.parseInt(c.req.header("x-user-id") || "1", 10);

      const result = await attachmentService.createAttachment(taskId, userId, attachmentData);

      if (result.isErr()) {
        return handleResultError(c, result.error);
      }

      return c.json(result.value, 201);
    },
  );

  // ファイルアップロード検証
  app.post(
    "/api/tasks/:taskId/attachments/validate",
    describeRoute({
      summary: "Validate file upload for a task",
      tags: ["Attachments"],
    }),
    zValidator("param", z.object({ taskId: attachmentIdSchema })),
    zValidator(
      "json",
      z.object({
        fileName: z.string(),
        fileSize: z.number().int().positive(),
        fileType: z.string(),
      }),
    ),
    async (c) => {
      const { taskId } = c.req.valid("param");
      const { fileName, fileSize, fileType } = c.req.valid("json");

      const result = await attachmentService.validateFileUpload(taskId, fileName, fileSize, fileType);

      if (result.isErr()) {
        return handleResultError(c, result.error);
      }

      return c.json(result.value);
    },
  );

  // 添付ファイル詳細取得
  app.get(
    "/api/attachments/:id",
    describeRoute({
      summary: "Get attachment by ID",
      tags: ["Attachments"],
    }),
    zValidator("param", z.object({ id: attachmentIdSchema })),
    async (c) => {
      const { id } = c.req.valid("param");

      const result = await attachmentService.getAttachmentById(id);
      if (result.isErr()) {
        return handleResultError(c, result.error);
      }

      return c.json(result.value);
    },
  );

  // 添付ファイル削除
  app.delete(
    "/api/attachments/:id",
    describeRoute({
      summary: "Delete attachment",
      tags: ["Attachments"],
    }),
    zValidator("param", z.object({ id: attachmentIdSchema })),
    async (c) => {
      const { id } = c.req.valid("param");

      // FIXME: Replace with proper authentication
      const userId = Number.parseInt(c.req.header("x-user-id") || "1", 10);

      const result = await attachmentService.deleteAttachment(id, userId);
      if (result.isErr()) {
        return handleResultError(c, result.error);
      }

      return c.json({ success: result.value });
    },
  );

  // 添付ファイル一覧取得（全体）
  app.get(
    "/api/attachments",
    describeRoute({
      summary: "Get attachments with filters",
      tags: ["Attachments"],
    }),
    zValidator("query", attachmentQuerySchema),
    async (c) => {
      const query = c.req.valid("query");

      const result = await attachmentService.getAttachments(query);
      if (result.isErr()) {
        return handleResultError(c, result.error);
      }

      return c.json(result.value);
    },
  );

  // ファイルダウンロード（実際のファイル内容を返す）
  // Note: 実際の実装では、ファイルストレージ（ローカル、S3等）からファイルを読み込む処理が必要
  app.get(
    "/api/attachments/:id/download",
    describeRoute({
      summary: "Download attachment file",
      tags: ["Attachments"],
    }),
    zValidator("param", z.object({ id: attachmentIdSchema })),
    async (c) => {
      const { id } = c.req.valid("param");

      const result = await attachmentService.getAttachmentById(id);
      if (result.isErr()) {
        return handleResultError(c, result.error);
      }

      const attachment = result.value;

      // TODO: 実際のファイルストレージからファイルを読み込む処理を実装
      // 現在はプレースホルダーとして404を返す
      return c.json(
        {
          code: "NOT_IMPLEMENTED",
          message: "File download functionality not yet implemented",
          details: {
            fileName: attachment.fileName,
            filePath: attachment.filePath,
          },
        },
        501,
      );
    },
  );
}

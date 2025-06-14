import { CommentRepository } from "@/entities/task/api/comment-repository";
import { TaskRepository } from "@/entities/task/api/repository";
import {
  commentIdSchema,
  commentQuerySchema,
  createCommentSchema,
  updateCommentSchema,
} from "@/entities/task/model/comment-validation-schemas";
import { handleResultError } from "@/shared/lib/api/error-helpers";
import type { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { validator as zValidator } from "hono-openapi/zod";
import { z } from "zod";
import { CommentService } from "./service";

const commentRepository = new CommentRepository();
const taskRepository = new TaskRepository();
const commentService = new CommentService(commentRepository, taskRepository);

export function setupCommentRoutes(app: Hono) {
  // タスクのコメント一覧取得
  app.get(
    "/api/tasks/:taskId/comments",
    describeRoute({
      summary: "Get comments for a task",
      tags: ["Comments"],
    }),
    zValidator("param", z.object({ taskId: commentIdSchema })),
    async (c) => {
      const { taskId } = c.req.valid("param");

      const result = await commentService.getCommentsByTaskId(taskId);
      if (result.isErr()) {
        return handleResultError(c, result.error);
      }

      return c.json(result.value);
    },
  );

  // コメント追加
  app.post(
    "/api/tasks/:taskId/comments",
    describeRoute({
      summary: "Add comment to a task",
      tags: ["Comments"],
    }),
    zValidator("param", z.object({ taskId: commentIdSchema })),
    zValidator("json", createCommentSchema),
    async (c) => {
      const { taskId } = c.req.valid("param");
      const commentData = c.req.valid("json");

      // FIXME: Replace with proper authentication
      const userId = Number.parseInt(c.req.header("x-user-id") || "1", 10);

      const result = await commentService.createComment(taskId, userId, commentData);

      if (result.isErr()) {
        return handleResultError(c, result.error);
      }

      return c.json(result.value, 201);
    },
  );

  // コメント詳細取得
  app.get(
    "/api/comments/:id",
    describeRoute({
      summary: "Get comment by ID",
      tags: ["Comments"],
    }),
    zValidator("param", z.object({ id: commentIdSchema })),
    async (c) => {
      const { id } = c.req.valid("param");

      const result = await commentService.getCommentById(id);
      if (result.isErr()) {
        return handleResultError(c, result.error);
      }

      return c.json(result.value);
    },
  );

  // コメント更新
  app.put(
    "/api/comments/:id",
    describeRoute({
      summary: "Update comment",
      tags: ["Comments"],
    }),
    zValidator("param", z.object({ id: commentIdSchema })),
    zValidator("json", updateCommentSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const updateData = c.req.valid("json");

      // FIXME: Replace with proper authentication
      const userId = Number.parseInt(c.req.header("x-user-id") || "1", 10);

      const result = await commentService.updateComment(id, userId, updateData);
      if (result.isErr()) {
        return handleResultError(c, result.error);
      }

      return c.json(result.value);
    },
  );

  // コメント削除
  app.delete(
    "/api/comments/:id",
    describeRoute({
      summary: "Delete comment",
      tags: ["Comments"],
    }),
    zValidator("param", z.object({ id: commentIdSchema })),
    async (c) => {
      const { id } = c.req.valid("param");

      // FIXME: Replace with proper authentication
      const userId = Number.parseInt(c.req.header("x-user-id") || "1", 10);

      const result = await commentService.deleteComment(id, userId);
      if (result.isErr()) {
        return handleResultError(c, result.error);
      }

      return c.json({ success: result.value });
    },
  );

  // コメント一覧取得（全体）
  app.get(
    "/api/comments",
    describeRoute({
      summary: "Get comments with filters",
      tags: ["Comments"],
    }),
    zValidator("query", commentQuerySchema),
    async (c) => {
      const query = c.req.valid("query");

      const result = await commentService.getComments(query);
      if (result.isErr()) {
        return handleResultError(c, result.error);
      }

      return c.json(result.value);
    },
  );
}

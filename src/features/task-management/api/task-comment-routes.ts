import type { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { validator as zValidator } from "hono-openapi/zod";
import { z } from "zod";
import { TaskCommentRepository } from "../../../entities/task-comment/api/repository";
import { TaskRepository } from "../../../entities/task/api/repository";
import { handleResultError } from "../../../shared/lib/api/error-helpers";
import { TaskCommentService } from "./task-comment-service";

const taskRepository = new TaskRepository();
const commentRepository = new TaskCommentRepository();
const commentService = new TaskCommentService(commentRepository, taskRepository);

const createCommentSchema = z.object({
  content: z.string().min(1).max(2000),
  parentId: z.number().int().positive().optional(),
});

const updateCommentSchema = z.object({
  content: z.string().min(1).max(2000),
});

const taskIdParamSchema = z.object({
  taskId: z.string().transform((val) => {
    const num = Number.parseInt(val);
    if (Number.isNaN(num) || num <= 0) {
      throw new Error("Invalid task ID");
    }
    return num;
  }),
});

const commentIdParamSchema = z.object({
  commentId: z.string().transform((val) => {
    const num = Number.parseInt(val);
    if (Number.isNaN(num) || num <= 0) {
      throw new Error("Invalid comment ID");
    }
    return num;
  }),
});

export const setupTaskCommentRoutes = (app: Hono) => {
  // Create comment
  app.post(
    "/api/tasks/:taskId/comments",
    describeRoute({
      description: "Create a new comment on a task",
      responses: { 201: { description: "Comment created successfully" } },
    }),
    zValidator("param", taskIdParamSchema),
    zValidator("json", createCommentSchema),
    async (c) => {
      const { taskId } = c.req.valid("param");
      const commentData = c.req.valid("json");
      const userIdHeader = c.req.header("x-user-id");
      const userId = userIdHeader ? Number.parseInt(userIdHeader) : 1;

      const result = await commentService.createComment(
        {
          taskId,
          content: commentData.content,
          parentId: commentData.parentId,
        },
        userId,
      );

      if (result.isErr()) {
        return handleResultError(c, result.error);
      }

      return c.json(result.value, 201);
    },
  );

  // Get comments for task
  app.get(
    "/api/tasks/:taskId/comments",
    describeRoute({
      description: "Get all comments for a task",
      responses: { 200: { description: "Comments fetched successfully" } },
    }),
    zValidator("param", taskIdParamSchema),
    async (c) => {
      const { taskId } = c.req.valid("param");

      const result = await commentService.getCommentsByTaskId(taskId);

      if (result.isErr()) {
        return handleResultError(c, result.error);
      }

      return c.json(result.value);
    },
  );

  // Get specific comment
  app.get(
    "/api/comments/:commentId",
    describeRoute({
      description: "Get a specific comment by ID",
      responses: { 200: { description: "Comment fetched successfully" } },
    }),
    zValidator("param", commentIdParamSchema),
    async (c) => {
      const { commentId } = c.req.valid("param");

      const result = await commentService.getCommentById(commentId);

      if (result.isErr()) {
        return handleResultError(c, result.error);
      }

      return c.json(result.value);
    },
  );

  // Update comment
  app.put(
    "/api/comments/:commentId",
    describeRoute({
      description: "Update a comment",
      responses: { 200: { description: "Comment updated successfully" } },
    }),
    zValidator("param", commentIdParamSchema),
    zValidator("json", updateCommentSchema),
    async (c) => {
      const { commentId } = c.req.valid("param");
      const updateData = c.req.valid("json");
      const userIdHeader = c.req.header("x-user-id");
      const userId = userIdHeader ? Number.parseInt(userIdHeader) : 1;

      const result = await commentService.updateComment(commentId, updateData, userId);

      if (result.isErr()) {
        return handleResultError(c, result.error);
      }

      return c.json(result.value);
    },
  );

  // Delete comment
  app.delete(
    "/api/comments/:commentId",
    describeRoute({
      description: "Delete a comment",
      responses: { 204: { description: "Comment deleted successfully" } },
    }),
    zValidator("param", commentIdParamSchema),
    async (c) => {
      const { commentId } = c.req.valid("param");
      const userIdHeader = c.req.header("x-user-id");
      const userId = userIdHeader ? Number.parseInt(userIdHeader) : 1;

      const result = await commentService.deleteComment(commentId, userId);

      if (result.isErr()) {
        return handleResultError(c, result.error);
      }

      return c.body(null, 204);
    },
  );

  // Restore comment
  app.post(
    "/api/comments/:commentId/restore",
    describeRoute({
      description: "Restore a deleted comment",
      responses: { 200: { description: "Comment restored successfully" } },
    }),
    zValidator("param", commentIdParamSchema),
    async (c) => {
      const { commentId } = c.req.valid("param");
      const userIdHeader = c.req.header("x-user-id");
      const userId = userIdHeader ? Number.parseInt(userIdHeader) : 1;

      const result = await commentService.restoreComment(commentId, userId);

      if (result.isErr()) {
        return handleResultError(c, result.error);
      }

      return c.json(result.value);
    },
  );

  // Get comment count for task
  app.get(
    "/api/tasks/:taskId/comments/count",
    describeRoute({
      description: "Get comment count for a task",
      responses: { 200: { description: "Comment count fetched successfully" } },
    }),
    zValidator("param", taskIdParamSchema),
    async (c) => {
      const { taskId } = c.req.valid("param");

      const result = await commentService.getCommentCount(taskId);

      if (result.isErr()) {
        return handleResultError(c, result.error);
      }

      return c.json({ count: result.value });
    },
  );
};

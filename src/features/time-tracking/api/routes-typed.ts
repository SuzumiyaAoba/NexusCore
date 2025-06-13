import { TaskRepository } from "@/entities/task/api/repository";
import { TimeLogRepository } from "@/entities/task/api/time-log-repository";
import {
  createTimeLogSchema,
  timeLogIdSchema,
  timeLogQuerySchema,
  updateTimeLogSchema,
} from "@/entities/task/model/time-log-validation-schemas";
import { handleResultError } from "@/shared/lib/api/error-helpers";
import type { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { validator as zValidator } from "hono-openapi/zod";
import { z } from "zod";
import { TimeTrackingService } from "./service";

const timeLogRepository = new TimeLogRepository();
const taskRepository = new TaskRepository();
const timeTrackingService = new TimeTrackingService(timeLogRepository, taskRepository);

export function setupTimeTrackingRoutes(app: Hono) {
  // 作業開始
  app.post(
    "/api/tasks/:taskId/time-logs/start",
    describeRoute({
      summary: "Start time tracking for a task",
      tags: ["Time Logs"],
    }),
    zValidator("param", z.object({ taskId: timeLogIdSchema })),
    zValidator("json", createTimeLogSchema),
    async (c) => {
      const { taskId } = c.req.valid("param");
      const timeLogData = c.req.valid("json");

      // FIXME: Replace with proper authentication
      const userId = Number.parseInt(c.req.header("x-user-id") || "1", 10);

      const result = await timeTrackingService.startTimeLog(taskId, userId, timeLogData);

      if (result.isErr()) {
        return handleResultError(c, result.error);
      }

      return c.json(result.value, 201);
    },
  );

  // 作業終了
  app.put(
    "/api/time-logs/:id/end",
    describeRoute({
      summary: "End time tracking",
      tags: ["Time Logs"],
    }),
    zValidator("param", z.object({ id: timeLogIdSchema })),
    zValidator("json", updateTimeLogSchema.optional()),
    async (c) => {
      const { id } = c.req.valid("param");
      const updateData = c.req.valid("json") || {};

      const result = await timeTrackingService.endTimeLog(id, updateData);
      if (result.isErr()) {
        return handleResultError(c, result.error);
      }

      return c.json(result.value);
    },
  );

  // 時間記録更新
  app.put(
    "/api/time-logs/:id",
    describeRoute({
      summary: "Update time log",
      tags: ["Time Logs"],
    }),
    zValidator("param", z.object({ id: timeLogIdSchema })),
    zValidator("json", updateTimeLogSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const updateData = c.req.valid("json");

      const result = await timeTrackingService.updateTimeLog(id, updateData);
      if (result.isErr()) {
        return handleResultError(c, result.error);
      }

      return c.json(result.value);
    },
  );

  // 時間記録詳細取得
  app.get(
    "/api/time-logs/:id",
    describeRoute({
      summary: "Get time log by ID",
      tags: ["Time Logs"],
    }),
    zValidator("param", z.object({ id: timeLogIdSchema })),
    async (c) => {
      const { id } = c.req.valid("param");

      const result = await timeTrackingService.getTimeLogById(id);
      if (result.isErr()) {
        return handleResultError(c, result.error);
      }

      return c.json(result.value);
    },
  );

  // 時間記録一覧取得
  app.get(
    "/api/time-logs",
    describeRoute({
      summary: "Get time logs with filters",
      tags: ["Time Logs"],
    }),
    zValidator("query", timeLogQuerySchema),
    async (c) => {
      const query = c.req.valid("query");

      const result = await timeTrackingService.getTimeLogs(query);
      if (result.isErr()) {
        return handleResultError(c, result.error);
      }

      return c.json(result.value);
    },
  );

  // タスクの時間記録取得
  app.get(
    "/api/tasks/:taskId/time-logs",
    describeRoute({
      summary: "Get time logs for a task",
      tags: ["Time Logs"],
    }),
    zValidator("param", z.object({ taskId: timeLogIdSchema })),
    async (c) => {
      const { taskId } = c.req.valid("param");

      const result = await timeTrackingService.getTimeLogsByTaskId(taskId);
      if (result.isErr()) {
        return handleResultError(c, result.error);
      }

      return c.json(result.value);
    },
  );

  // ユーザーのアクティブな時間記録取得
  app.get(
    "/api/users/me/active-time-logs",
    describeRoute({
      summary: "Get active time logs for current user",
      tags: ["Time Logs"],
    }),
    async (c) => {
      // FIXME: Replace with proper authentication
      const userId = Number.parseInt(c.req.header("x-user-id") || "1", 10);

      const result = await timeTrackingService.getActiveTimeLogsByUserId(userId);
      if (result.isErr()) {
        return handleResultError(c, result.error);
      }

      return c.json(result.value);
    },
  );

  // 時間記録削除
  app.delete(
    "/api/time-logs/:id",
    describeRoute({
      summary: "Delete time log",
      tags: ["Time Logs"],
    }),
    zValidator("param", z.object({ id: timeLogIdSchema })),
    async (c) => {
      const { id } = c.req.valid("param");

      const result = await timeTrackingService.deleteTimeLog(id);
      if (result.isErr()) {
        return handleResultError(c, result.error);
      }

      return c.json({ success: result.value });
    },
  );
}

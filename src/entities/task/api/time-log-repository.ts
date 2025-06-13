import { and, desc, eq, gte, isNull, lte, sql } from "drizzle-orm";
import { db } from "../../../shared/config/database";
import { type TaskTimeLog as DbTaskTimeLog, taskTimeLogs, tasks, users } from "../../../shared/lib/db/schema";
import type {
  CreateTimeLogRequest,
  PaginatedResponse,
  TaskTimeLog,
  TimeLogQuery,
  TimeLogWithRelations,
  UpdateTimeLogRequest,
} from "../../../shared/types";
import { calculateDuration } from "../model/time-log-business-rules";

const DEFAULT_LIMIT = 50;

export class TimeLogRepository {
  /**
   * 新しい時間記録を開始します
   */
  async startTimeLog(taskId: number, userId: number, data: CreateTimeLogRequest): Promise<TaskTimeLog> {
    const startedAt = new Date().toISOString();

    const result = await db
      .insert(taskTimeLogs)
      .values({
        taskId,
        userId,
        startedAt,
        description: data.description,
      })
      .returning();

    if (!result || result.length === 0) {
      throw new Error("Failed to start time log");
    }

    return this.mapToTimeLog(result[0]);
  }

  /**
   * 時間記録を終了します
   */
  async endTimeLog(id: number, data: UpdateTimeLogRequest): Promise<TaskTimeLog | null> {
    const endedAt = data.endedAt ?? new Date().toISOString();

    // 既存の記録を取得
    const existing = await this.findById(id);
    if (!existing || existing.endedAt) {
      return null;
    }

    // 期間を計算
    const duration = calculateDuration(existing.startedAt, endedAt);

    const result = await db
      .update(taskTimeLogs)
      .set({
        endedAt,
        duration,
        description: data.description ?? existing.description,
      })
      .where(eq(taskTimeLogs.id, id))
      .returning();

    const [timeLog] = result;
    return timeLog ? this.mapToTimeLog(timeLog) : null;
  }

  /**
   * 時間記録を更新します
   */
  async update(id: number, data: UpdateTimeLogRequest): Promise<TaskTimeLog | null> {
    const updateData: any = {};

    if (data.endedAt !== undefined) {
      updateData.endedAt = data.endedAt;

      // 終了時刻が設定された場合、期間を再計算
      if (data.endedAt) {
        const existing = await this.findById(id);
        if (existing) {
          updateData.duration = calculateDuration(existing.startedAt, data.endedAt);
        }
      } else {
        updateData.duration = null;
      }
    }

    if (data.description !== undefined) {
      updateData.description = data.description;
    }

    if (Object.keys(updateData).length === 0) {
      return this.findById(id);
    }

    const result = await db.update(taskTimeLogs).set(updateData).where(eq(taskTimeLogs.id, id)).returning();

    const [timeLog] = result;
    return timeLog ? this.mapToTimeLog(timeLog) : null;
  }

  /**
   * 時間記録をIDで取得します
   */
  async findById(id: number): Promise<TaskTimeLog | null> {
    const [timeLog] = await db.select().from(taskTimeLogs).where(eq(taskTimeLogs.id, id)).limit(1);

    return timeLog ? this.mapToTimeLog(timeLog) : null;
  }

  /**
   * 時間記録を関連データと共に取得します
   */
  async findByIdWithRelations(id: number): Promise<TimeLogWithRelations | null> {
    const [result] = await db
      .select({
        timeLog: taskTimeLogs,
        task: tasks,
        user: users,
      })
      .from(taskTimeLogs)
      .leftJoin(tasks, eq(taskTimeLogs.taskId, tasks.id))
      .leftJoin(users, eq(taskTimeLogs.userId, users.id))
      .where(eq(taskTimeLogs.id, id))
      .limit(1);

    if (!result) return null;

    return {
      ...this.mapToTimeLog(result.timeLog),
      task: result.task || undefined,
      user: result.user || undefined,
    };
  }

  /**
   * 時間記録を検索します
   */
  async findAll(query: TimeLogQuery = {}): Promise<PaginatedResponse<TimeLogWithRelations>> {
    const { sortBy = "startedAt", order = "desc", limit = DEFAULT_LIMIT, offset = 0 } = query;

    const whereConditions: any[] = [];

    // フィルタ条件の構築
    if (query.taskId) {
      whereConditions.push(eq(taskTimeLogs.taskId, query.taskId));
    }

    if (query.userId) {
      whereConditions.push(eq(taskTimeLogs.userId, query.userId));
    }

    if (query.startFrom) {
      whereConditions.push(gte(taskTimeLogs.startedAt, query.startFrom));
    }

    if (query.startTo) {
      whereConditions.push(lte(taskTimeLogs.startedAt, query.startTo));
    }

    if (query.endFrom) {
      whereConditions.push(gte(taskTimeLogs.endedAt, query.endFrom));
    }

    if (query.endTo) {
      whereConditions.push(lte(taskTimeLogs.endedAt, query.endTo));
    }

    const whereCondition = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    // データ取得
    const timeLogsResult = await db
      .select({
        timeLog: taskTimeLogs,
        task: tasks,
        user: users,
      })
      .from(taskTimeLogs)
      .leftJoin(tasks, eq(taskTimeLogs.taskId, tasks.id))
      .leftJoin(users, eq(taskTimeLogs.userId, users.id))
      .$dynamic()
      .where(whereCondition)
      .orderBy(
        order === "desc"
          ? desc(taskTimeLogs[sortBy as keyof typeof taskTimeLogs] as any)
          : (taskTimeLogs[sortBy as keyof typeof taskTimeLogs] as any),
      )
      .limit(limit)
      .offset(offset);

    // 総数取得
    const [totalResult] = await db
      .select({ count: sql`COUNT(*)`.as("count") })
      .from(taskTimeLogs)
      .$dynamic()
      .where(whereCondition);

    const total = Number(totalResult?.count) || 0;

    const data = timeLogsResult.map((result) => ({
      ...this.mapToTimeLog(result.timeLog),
      task: result.task || undefined,
      user: result.user || undefined,
    }));

    return {
      data,
      total,
      limit,
      offset,
    };
  }

  /**
   * タスクの時間記録を取得します
   */
  async findByTaskId(taskId: number): Promise<TimeLogWithRelations[]> {
    const result = await db
      .select({
        timeLog: taskTimeLogs,
        task: tasks,
        user: users,
      })
      .from(taskTimeLogs)
      .leftJoin(tasks, eq(taskTimeLogs.taskId, tasks.id))
      .leftJoin(users, eq(taskTimeLogs.userId, users.id))
      .where(eq(taskTimeLogs.taskId, taskId))
      .orderBy(desc(taskTimeLogs.startedAt));

    return result.map((r) => ({
      ...this.mapToTimeLog(r.timeLog),
      task: r.task || undefined,
      user: r.user || undefined,
    }));
  }

  /**
   * ユーザーのアクティブな時間記録を取得します
   */
  async findActiveByUserId(userId: number): Promise<TimeLogWithRelations[]> {
    const result = await db
      .select({
        timeLog: taskTimeLogs,
        task: tasks,
        user: users,
      })
      .from(taskTimeLogs)
      .leftJoin(tasks, eq(taskTimeLogs.taskId, tasks.id))
      .leftJoin(users, eq(taskTimeLogs.userId, users.id))
      .where(and(eq(taskTimeLogs.userId, userId), isNull(taskTimeLogs.endedAt)))
      .orderBy(desc(taskTimeLogs.startedAt));

    return result.map((r) => ({
      ...this.mapToTimeLog(r.timeLog),
      task: r.task || undefined,
      user: r.user || undefined,
    }));
  }

  /**
   * 時間記録を削除します
   */
  async delete(id: number): Promise<boolean> {
    const result = await db.delete(taskTimeLogs).where(eq(taskTimeLogs.id, id));

    return (result as unknown as { changes: number }).changes > 0;
  }

  /**
   * DBの時間記録をドメインオブジェクトにマップします
   */
  private mapToTimeLog(dbTimeLog: DbTaskTimeLog): TaskTimeLog {
    return {
      id: dbTimeLog.id,
      taskId: dbTimeLog.taskId,
      userId: dbTimeLog.userId,
      startedAt: dbTimeLog.startedAt,
      endedAt: dbTimeLog.endedAt,
      duration: dbTimeLog.duration,
      description: dbTimeLog.description,
      createdAt: dbTimeLog.createdAt,
    };
  }
}

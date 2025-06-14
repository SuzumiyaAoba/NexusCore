import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../../../shared/config/database";
import { type TaskComment as DbTaskComment, taskComments, tasks, users } from "../../../shared/lib/db/schema";
import type {
  CommentQuery,
  CommentWithRelations,
  CreateCommentRequest,
  PaginatedResponse,
  TaskComment,
  UpdateCommentRequest,
} from "../../../shared/types";

const DEFAULT_LIMIT = 50;

export class CommentRepository {
  /**
   * 新しいコメントを作成します
   */
  async create(taskId: number, userId: number, data: CreateCommentRequest): Promise<TaskComment> {
    const createdAt = new Date().toISOString();

    const result = await db
      .insert(taskComments)
      .values({
        taskId,
        userId,
        content: data.content,
        createdAt,
        updatedAt: createdAt,
      })
      .returning();

    if (!result || result.length === 0) {
      throw new Error("Failed to create comment");
    }

    return this.mapToComment(result[0]);
  }

  /**
   * コメントを更新します
   */
  async update(id: number, data: UpdateCommentRequest): Promise<TaskComment | null> {
    const updatedAt = new Date().toISOString();

    const updateData: any = {
      updatedAt,
    };

    if (data.content !== undefined) {
      updateData.content = data.content;
    }

    const result = await db.update(taskComments).set(updateData).where(eq(taskComments.id, id)).returning();

    const [comment] = result;
    return comment ? this.mapToComment(comment) : null;
  }

  /**
   * コメントをIDで取得します
   */
  async findById(id: number): Promise<TaskComment | null> {
    const [comment] = await db.select().from(taskComments).where(eq(taskComments.id, id)).limit(1);

    return comment ? this.mapToComment(comment) : null;
  }

  /**
   * コメントを関連データと共に取得します
   */
  async findByIdWithRelations(id: number): Promise<CommentWithRelations | null> {
    const [result] = await db
      .select({
        comment: taskComments,
        task: tasks,
        user: users,
      })
      .from(taskComments)
      .leftJoin(tasks, eq(taskComments.taskId, tasks.id))
      .leftJoin(users, eq(taskComments.userId, users.id))
      .where(eq(taskComments.id, id))
      .limit(1);

    if (!result) return null;

    return {
      ...this.mapToComment(result.comment),
      task: result.task || undefined,
      user: result.user || undefined,
    };
  }

  /**
   * コメントを検索します
   */
  async findAll(query: CommentQuery = {}): Promise<PaginatedResponse<CommentWithRelations>> {
    const { sortBy = "createdAt", order = "desc", limit = DEFAULT_LIMIT, offset = 0 } = query;

    const whereConditions: any[] = [];

    // フィルタ条件の構築
    if (query.taskId) {
      whereConditions.push(eq(taskComments.taskId, query.taskId));
    }

    if (query.userId) {
      whereConditions.push(eq(taskComments.userId, query.userId));
    }

    const whereCondition = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    // データ取得
    const commentsResult = await db
      .select({
        comment: taskComments,
        task: tasks,
        user: users,
      })
      .from(taskComments)
      .leftJoin(tasks, eq(taskComments.taskId, tasks.id))
      .leftJoin(users, eq(taskComments.userId, users.id))
      .$dynamic()
      .where(whereCondition)
      .orderBy(
        order === "desc"
          ? desc(taskComments[sortBy as keyof typeof taskComments] as any)
          : (taskComments[sortBy as keyof typeof taskComments] as any),
      )
      .limit(limit)
      .offset(offset);

    // 総数取得
    const [totalResult] = await db
      .select({ count: sql`COUNT(*)`.as("count") })
      .from(taskComments)
      .$dynamic()
      .where(whereCondition);

    const total = Number(totalResult?.count) || 0;

    const data = commentsResult.map((result) => ({
      ...this.mapToComment(result.comment),
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
   * タスクのコメントを取得します
   */
  async findByTaskId(taskId: number): Promise<CommentWithRelations[]> {
    const result = await db
      .select({
        comment: taskComments,
        task: tasks,
        user: users,
      })
      .from(taskComments)
      .leftJoin(tasks, eq(taskComments.taskId, tasks.id))
      .leftJoin(users, eq(taskComments.userId, users.id))
      .where(eq(taskComments.taskId, taskId))
      .orderBy(desc(taskComments.createdAt));

    return result.map((r) => ({
      ...this.mapToComment(r.comment),
      task: r.task || undefined,
      user: r.user || undefined,
    }));
  }

  /**
   * タスクのコメント数を取得します
   */
  async countByTaskId(taskId: number): Promise<number> {
    const [result] = await db
      .select({ count: sql`COUNT(*)`.as("count") })
      .from(taskComments)
      .where(eq(taskComments.taskId, taskId));

    return Number(result?.count) || 0;
  }

  /**
   * コメントを削除します
   */
  async delete(id: number): Promise<boolean> {
    const result = await db.delete(taskComments).where(eq(taskComments.id, id));

    return (result as unknown as { changes: number }).changes > 0;
  }

  /**
   * DBのコメントをドメインオブジェクトにマップします
   */
  private mapToComment(dbComment: DbTaskComment): TaskComment {
    return {
      id: dbComment.id,
      taskId: dbComment.taskId,
      userId: dbComment.userId,
      content: dbComment.content,
      createdAt: dbComment.createdAt,
      updatedAt: dbComment.updatedAt,
    };
  }
}

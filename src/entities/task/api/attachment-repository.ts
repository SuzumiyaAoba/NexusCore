import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../../../shared/config/database";
import { type TaskAttachment as DbTaskAttachment, taskAttachments, tasks, users } from "../../../shared/lib/db/schema";
import type {
  AttachmentQuery,
  AttachmentWithRelations,
  CreateAttachmentRequest,
  PaginatedResponse,
  TaskAttachment,
} from "../../../shared/types";

const DEFAULT_LIMIT = 50;

export class AttachmentRepository {
  /**
   * 新しい添付ファイルを作成します
   */
  async create(taskId: number, uploadedBy: number, data: CreateAttachmentRequest): Promise<TaskAttachment> {
    const uploadedAt = new Date().toISOString();

    const result = await db
      .insert(taskAttachments)
      .values({
        taskId,
        uploadedBy,
        fileName: data.fileName,
        fileSize: data.fileSize,
        fileType: data.fileType,
        filePath: data.filePath,
        uploadedAt,
      })
      .returning();

    if (!result || result.length === 0) {
      throw new Error("Failed to create attachment");
    }

    return this.mapToAttachment(result[0]);
  }

  /**
   * 添付ファイルをIDで取得します
   */
  async findById(id: number): Promise<TaskAttachment | null> {
    const [attachment] = await db.select().from(taskAttachments).where(eq(taskAttachments.id, id)).limit(1);

    return attachment ? this.mapToAttachment(attachment) : null;
  }

  /**
   * 添付ファイルを関連データと共に取得します
   */
  async findByIdWithRelations(id: number): Promise<AttachmentWithRelations | null> {
    const [result] = await db
      .select({
        attachment: taskAttachments,
        task: tasks,
        uploadedByUser: users,
      })
      .from(taskAttachments)
      .leftJoin(tasks, eq(taskAttachments.taskId, tasks.id))
      .leftJoin(users, eq(taskAttachments.uploadedBy, users.id))
      .where(eq(taskAttachments.id, id))
      .limit(1);

    if (!result) return null;

    return {
      ...this.mapToAttachment(result.attachment),
      task: result.task || undefined,
      uploadedByUser: result.uploadedByUser || undefined,
    };
  }

  /**
   * 添付ファイルを検索します
   */
  async findAll(query: AttachmentQuery = {}): Promise<PaginatedResponse<AttachmentWithRelations>> {
    const { sortBy = "uploadedAt", order = "desc", limit = DEFAULT_LIMIT, offset = 0 } = query;

    const whereConditions: any[] = [];

    // フィルタ条件の構築
    if (query.taskId) {
      whereConditions.push(eq(taskAttachments.taskId, query.taskId));
    }

    if (query.uploadedBy) {
      whereConditions.push(eq(taskAttachments.uploadedBy, query.uploadedBy));
    }

    if (query.fileType) {
      whereConditions.push(eq(taskAttachments.fileType, query.fileType));
    }

    const whereCondition = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    // データ取得
    const attachmentsResult = await db
      .select({
        attachment: taskAttachments,
        task: tasks,
        uploadedByUser: users,
      })
      .from(taskAttachments)
      .leftJoin(tasks, eq(taskAttachments.taskId, tasks.id))
      .leftJoin(users, eq(taskAttachments.uploadedBy, users.id))
      .$dynamic()
      .where(whereCondition)
      .orderBy(
        order === "desc"
          ? desc(taskAttachments[sortBy as keyof typeof taskAttachments] as any)
          : (taskAttachments[sortBy as keyof typeof taskAttachments] as any),
      )
      .limit(limit)
      .offset(offset);

    // 総数取得
    const [totalResult] = await db
      .select({ count: sql`COUNT(*)`.as("count") })
      .from(taskAttachments)
      .$dynamic()
      .where(whereCondition);

    const total = Number(totalResult?.count) || 0;

    const data = attachmentsResult.map((result) => ({
      ...this.mapToAttachment(result.attachment),
      task: result.task || undefined,
      uploadedByUser: result.uploadedByUser || undefined,
    }));

    return {
      data,
      total,
      limit,
      offset,
    };
  }

  /**
   * タスクの添付ファイルを取得します
   */
  async findByTaskId(taskId: number): Promise<AttachmentWithRelations[]> {
    const result = await db
      .select({
        attachment: taskAttachments,
        task: tasks,
        uploadedByUser: users,
      })
      .from(taskAttachments)
      .leftJoin(tasks, eq(taskAttachments.taskId, tasks.id))
      .leftJoin(users, eq(taskAttachments.uploadedBy, users.id))
      .where(eq(taskAttachments.taskId, taskId))
      .orderBy(desc(taskAttachments.uploadedAt));

    return result.map((r) => ({
      ...this.mapToAttachment(r.attachment),
      task: r.task || undefined,
      uploadedByUser: r.uploadedByUser || undefined,
    }));
  }

  /**
   * タスクの添付ファイル数を取得します
   */
  async countByTaskId(taskId: number): Promise<number> {
    const [result] = await db
      .select({ count: sql`COUNT(*)`.as("count") })
      .from(taskAttachments)
      .where(eq(taskAttachments.taskId, taskId));

    return Number(result?.count) || 0;
  }

  /**
   * タスクの添付ファイルの合計サイズを取得します
   */
  async getTotalSizeByTaskId(taskId: number): Promise<number> {
    const [result] = await db
      .select({ totalSize: sql`SUM(${taskAttachments.fileSize})`.as("totalSize") })
      .from(taskAttachments)
      .where(eq(taskAttachments.taskId, taskId));

    return Number(result?.totalSize) || 0;
  }

  /**
   * 添付ファイルを削除します
   */
  async delete(id: number): Promise<boolean> {
    const result = await db.delete(taskAttachments).where(eq(taskAttachments.id, id));

    return (result as unknown as { changes: number }).changes > 0;
  }

  /**
   * DBの添付ファイルをドメインオブジェクトにマップします
   */
  private mapToAttachment(dbAttachment: DbTaskAttachment): TaskAttachment {
    return {
      id: dbAttachment.id,
      taskId: dbAttachment.taskId,
      uploadedBy: dbAttachment.uploadedBy,
      fileName: dbAttachment.fileName,
      fileSize: dbAttachment.fileSize,
      fileType: dbAttachment.fileType,
      filePath: dbAttachment.filePath,
      uploadedAt: dbAttachment.uploadedAt,
    };
  }
}

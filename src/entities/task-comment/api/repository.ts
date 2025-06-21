import { and, desc, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { db } from "../../../shared/config/database";
import { taskComments, users } from "../../../shared/lib/db/schema";
import type {
  CreateTaskCommentRequest,
  TaskComment,
  TaskCommentWithRelations,
  UpdateTaskCommentRequest,
} from "../../../shared/types";

export class TaskCommentRepository {
  async create(commentData: CreateTaskCommentRequest & { userId: number }): Promise<TaskComment> {
    const result = await db
      .insert(taskComments)
      .values({
        taskId: commentData.taskId,
        userId: commentData.userId,
        content: commentData.content,
        parentId: commentData.parentId,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .returning();

    return result[0];
  }

  async findById(id: number): Promise<TaskComment | null> {
    const result = await db.select().from(taskComments).where(eq(taskComments.id, id)).limit(1);
    return result[0] || null;
  }

  async findByIdWithRelations(id: number): Promise<TaskCommentWithRelations | null> {
    const result = await db
      .select({
        comment: taskComments,
        user: users,
      })
      .from(taskComments)
      .leftJoin(users, eq(taskComments.userId, users.id))
      .where(and(eq(taskComments.id, id), isNull(taskComments.deletedAt)))
      .limit(1);

    if (!result[0]) return null;

    const comment = result[0].comment;
    const user = result[0].user;

    return {
      ...comment,
      user: user || undefined,
    };
  }

  async findByTaskId(taskId: number): Promise<TaskCommentWithRelations[]> {
    const result = await db
      .select({
        comment: taskComments,
        user: users,
      })
      .from(taskComments)
      .leftJoin(users, eq(taskComments.userId, users.id))
      .where(and(eq(taskComments.taskId, taskId), isNull(taskComments.deletedAt)))
      .orderBy(desc(taskComments.createdAt));

    return result.map((row) => ({
      ...row.comment,
      user: row.user || undefined,
    }));
  }

  async findRepliesByParentId(parentId: number): Promise<TaskCommentWithRelations[]> {
    const result = await db
      .select({
        comment: taskComments,
        user: users,
      })
      .from(taskComments)
      .leftJoin(users, eq(taskComments.userId, users.id))
      .where(and(eq(taskComments.parentId, parentId), isNull(taskComments.deletedAt)))
      .orderBy(taskComments.createdAt);

    return result.map((row) => ({
      ...row.comment,
      user: row.user || undefined,
    }));
  }

  async update(id: number, updateData: UpdateTaskCommentRequest): Promise<TaskComment | null> {
    const result = await db
      .update(taskComments)
      .set({
        content: updateData.content,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(and(eq(taskComments.id, id), isNull(taskComments.deletedAt)))
      .returning();

    return result[0] || null;
  }

  async softDelete(id: number): Promise<boolean> {
    const result = await db
      .update(taskComments)
      .set({
        deletedAt: sql`CURRENT_TIMESTAMP`,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(and(eq(taskComments.id, id), isNull(taskComments.deletedAt)))
      .returning();

    return result.length > 0;
  }

  async restore(id: number): Promise<boolean> {
    const result = await db
      .update(taskComments)
      .set({
        deletedAt: null,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(and(eq(taskComments.id, id), isNotNull(taskComments.deletedAt)))
      .returning();

    return result.length > 0;
  }

  async hardDelete(id: number): Promise<boolean> {
    const result = await db.delete(taskComments).where(eq(taskComments.id, id)).returning();

    return result.length > 0;
  }

  async countByTaskId(taskId: number): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(taskComments)
      .where(and(eq(taskComments.taskId, taskId), isNull(taskComments.deletedAt)));

    return result[0]?.count || 0;
  }

  async countRepliesByParentId(parentId: number): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(taskComments)
      .where(and(eq(taskComments.parentId, parentId), isNull(taskComments.deletedAt)));

    return result[0]?.count || 0;
  }
}

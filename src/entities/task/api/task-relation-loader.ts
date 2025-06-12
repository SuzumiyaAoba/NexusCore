import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "../../../shared/config/database";
import { type User as DbUser, tags, taskTags, tasks, users } from "../../../shared/lib/db/schema";

export class TaskRelationLoader {
  async loadAssignee(assignedTo: number | null): Promise<DbUser | null> {
    if (!assignedTo) return null;

    const [assignee] = await db.select().from(users).where(eq(users.id, assignedTo)).limit(1);

    return assignee || null;
  }

  async loadTaskTags(taskId: number) {
    const result = await db
      .select({ tag: tags })
      .from(taskTags)
      .innerJoin(tags, eq(taskTags.tagId, tags.id))
      .where(eq(taskTags.taskId, taskId));

    return result.map((r) => r.tag);
  }

  async loadSubtaskCounts(parentId: number) {
    const [counts] = await db
      .select({
        total: sql`COUNT(*)`.as("total"),
        completed: sql`COUNT(CASE WHEN status = 'DONE' THEN 1 END)`.as("completed"),
      })
      .from(tasks)
      .where(and(eq(tasks.parentId, parentId), isNull(tasks.deletedAt)));

    return counts;
  }

  async loadUsersByIds(ids: number[]): Promise<DbUser[]> {
    if (ids.length === 0) return [];

    return db
      .select()
      .from(users)
      .where(
        sql`${users.id} IN (${sql.join(
          ids.map((id) => sql`${id}`),
          sql`, `,
        )})`,
      );
  }

  async loadTaskTagsBatch(taskIds: number[]) {
    if (taskIds.length === 0) return [];

    return db
      .select({ taskId: taskTags.taskId, tag: tags })
      .from(taskTags)
      .innerJoin(tags, eq(taskTags.tagId, tags.id))
      .where(
        sql`${taskTags.taskId} IN (${sql.join(
          taskIds.map((id) => sql`${id}`),
          sql`, `,
        )})`,
      );
  }

  async loadSubtaskCountsBatch(parentIds: number[]) {
    if (parentIds.length === 0) return [];

    return db
      .select({
        parentId: tasks.parentId,
        total: sql`COUNT(*)`.as("total"),
        completed: sql`COUNT(CASE WHEN status = 'DONE' THEN 1 END)`.as("completed"),
      })
      .from(tasks)
      .where(
        and(
          sql`${tasks.parentId} IN (${sql.join(
            parentIds.map((id) => sql`${id}`),
            sql`, `,
          )})`,
          isNull(tasks.deletedAt),
        ),
      )
      .groupBy(tasks.parentId);
  }
}

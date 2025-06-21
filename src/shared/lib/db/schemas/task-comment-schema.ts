import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { tasks } from "./task-schema";
import { users } from "./user-schema";

export const taskComments = sqliteTable(
  "task_comments",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    taskId: integer("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    parentId: integer("parent_id"),
    deletedAt: text("deleted_at"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    // Indexes
    taskIdx: index("idx_task_comments_task").on(table.taskId),
    userIdx: index("idx_task_comments_user").on(table.userId),
    parentIdx: index("idx_task_comments_parent").on(table.parentId),
    deletedAtIdx: index("idx_task_comments_deleted_at").on(table.deletedAt),
    createdAtIdx: index("idx_task_comments_created_at").on(table.createdAt),
    taskNotDeletedIdx: index("idx_task_comments_task_not_deleted").on(table.taskId, table.deletedAt),
  }),
);

export type TaskComment = typeof taskComments.$inferSelect;
export type NewTaskComment = typeof taskComments.$inferInsert;

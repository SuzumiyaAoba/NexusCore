import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { users } from "./user-schema";

export const projects = sqliteTable(
  "projects",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    description: text("description"),
    color: text("color"),
    status: text("status", { enum: ["active", "archived"] })
      .notNull()
      .default("active"),
    ownerId: integer("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    archivedAt: text("archived_at"),
  },
  (table) => ({
    // Check constraints for enum fields
    statusCheck: check("chk_projects_status", sql`${table.status} IN ('active', 'archived')`),
    // Indexes
    nameIdx: index("idx_projects_name").on(table.name),
    statusIdx: index("idx_projects_status").on(table.status),
    ownerIdx: index("idx_projects_owner").on(table.ownerId),
  }),
);

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

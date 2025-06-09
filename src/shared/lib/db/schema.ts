import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// Users table
export const users = sqliteTable(
  "users",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    username: text("username").notNull().unique(),
    displayName: text("display_name").notNull(),
    email: text("email").notNull().unique(),
    avatarUrl: text("avatar_url"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    usernameIdx: index("idx_users_username").on(table.username),
    emailIdx: index("idx_users_email").on(table.email),
  }),
);

// Categories table
export const categories = sqliteTable(
  "categories",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull().unique(),
    color: text("color"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    nameIdx: index("idx_categories_name").on(table.name),
  }),
);

// Tags table
export const tags = sqliteTable(
  "tags",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull().unique(),
    color: text("color"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    nameIdx: index("idx_tags_name").on(table.name),
  }),
);

// Projects table
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
    nameIdx: index("idx_projects_name").on(table.name),
    statusIdx: index("idx_projects_status").on(table.status),
    ownerIdx: index("idx_projects_owner").on(table.ownerId),
  }),
);

// Tasks table
export const tasks = sqliteTable(
  "tasks",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    title: text("title").notNull(),
    description: text("description"),
    status: text("status", { enum: ["TODO", "DOING", "PENDING", "DONE"] })
      .notNull()
      .default("TODO"),
    priority: text("priority", { enum: ["low", "medium", "high"] })
      .notNull()
      .default("medium"),
    importance: integer("importance", { mode: "boolean" }).notNull().default(false),
    urgency: integer("urgency", { mode: "boolean" }).notNull().default(false),
    eisenhowerQuadrant: integer("eisenhower_quadrant").notNull().default(4),
    projectId: integer("project_id").references(() => projects.id, { onDelete: "set null" }),
    categoryId: integer("category_id").references(() => categories.id, { onDelete: "set null" }),
    parentId: integer("parent_id"),
    createdBy: integer("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    assignedTo: integer("assigned_to").references(() => users.id, { onDelete: "set null" }),
    assignmentStatus: text("assignment_status", { enum: ["pending", "accepted", "rejected"] }),
    assignmentNote: text("assignment_note"),
    estimatedTime: integer("estimated_time"),
    progress: integer("progress").notNull().default(0),
    scheduledDate: text("scheduled_date"),
    scheduledStartDate: text("scheduled_start_date"),
    scheduledEndDate: text("scheduled_end_date"),
    dueDate: text("due_date"),
    deletedAt: text("deleted_at"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    statusIdx: index("idx_tasks_status").on(table.status),
    importanceIdx: index("idx_tasks_importance").on(table.importance),
    urgencyIdx: index("idx_tasks_urgency").on(table.urgency),
    eisenhowerIdx: index("idx_tasks_eisenhower").on(table.eisenhowerQuadrant),
    projectIdx: index("idx_tasks_project").on(table.projectId),
    categoryIdx: index("idx_tasks_category").on(table.categoryId),
    parentIdx: index("idx_tasks_parent").on(table.parentId),
    createdByIdx: index("idx_tasks_created_by").on(table.createdBy),
    assignedToIdx: index("idx_tasks_assigned_to").on(table.assignedTo),
    assignmentStatusIdx: index("idx_tasks_assignment_status").on(table.assignmentStatus),
    scheduledStartDateIdx: index("idx_tasks_scheduled_start_date").on(table.scheduledStartDate),
    scheduledEndDateIdx: index("idx_tasks_scheduled_end_date").on(table.scheduledEndDate),
    dueDateIdx: index("idx_tasks_due_date").on(table.dueDate),
    deletedAtIdx: index("idx_tasks_deleted_at").on(table.deletedAt),
    createdAtIdx: index("idx_tasks_created_at").on(table.createdAt),
    // Composite indexes for common query patterns
    statusCreatedAtIdx: index("idx_tasks_status_created_at").on(table.status, table.createdAt),
    assignedToStatusIdx: index("idx_tasks_assigned_to_status").on(table.assignedTo, table.status),
    projectStatusIdx: index("idx_tasks_project_status").on(table.projectId, table.status),
    categoryStatusIdx: index("idx_tasks_category_status").on(table.categoryId, table.status),
    eisenhowerStatusIdx: index("idx_tasks_eisenhower_status").on(table.eisenhowerQuadrant, table.status),
    dueDateStatusIdx: index("idx_tasks_due_date_status").on(table.dueDate, table.status),
    statusNotDeletedIdx: index("idx_tasks_status_not_deleted").on(table.status, table.deletedAt),
  }),
);

// Task Tags junction table
export const taskTags = sqliteTable(
  "task_tags",
  {
    taskId: integer("task_id").notNull(),
    tagId: integer("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    taskIdx: index("idx_task_tags_task").on(table.taskId),
    tagIdx: index("idx_task_tags_tag").on(table.tagId),
  }),
);

// Task Assignments table
export const taskAssignments = sqliteTable(
  "task_assignments",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    taskId: integer("task_id").notNull(),
    assigneeId: integer("assignee_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    assignerId: integer("assigner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: text("status", { enum: ["pending", "accepted", "rejected", "completed"] })
      .notNull()
      .default("pending"),
    note: text("note"),
    respondedAt: text("responded_at"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    assigneeIdx: index("idx_task_assignments_assignee").on(table.assigneeId),
    assignerIdx: index("idx_task_assignments_assigner").on(table.assignerId),
    statusIdx: index("idx_task_assignments_status").on(table.status),
  }),
);

// Task History table
export const taskHistory = sqliteTable(
  "task_history",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    taskId: integer("task_id").notNull(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    action: text("action").notNull(), // created/updated/deleted/assigned/completed
    changes: text("changes"), // JSON format
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    taskIdx: index("idx_task_history_task").on(table.taskId),
    createdAtIdx: index("idx_task_history_created_at").on(table.createdAt),
  }),
);

// Type exports for schema inference
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type TaskTag = typeof taskTags.$inferSelect;
export type NewTaskTag = typeof taskTags.$inferInsert;
export type TaskAssignment = typeof taskAssignments.$inferSelect;
export type NewTaskAssignment = typeof taskAssignments.$inferInsert;
export type TaskHistory = typeof taskHistory.$inferSelect;
export type NewTaskHistory = typeof taskHistory.$inferInsert;

PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_task_assignments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`task_id` integer NOT NULL,
	`assignee_id` integer NOT NULL,
	`assigner_id` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`note` text,
	`responded_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`assignee_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`assigner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_task_assignments`("id", "task_id", "assignee_id", "assigner_id", "status", "note", "responded_at", "created_at") SELECT "id", "task_id", "assignee_id", "assigner_id", "status", "note", "responded_at", "created_at" FROM `task_assignments`;--> statement-breakpoint
DROP TABLE `task_assignments`;--> statement-breakpoint
ALTER TABLE `__new_task_assignments` RENAME TO `task_assignments`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `idx_task_assignments_assignee` ON `task_assignments` (`assignee_id`);--> statement-breakpoint
CREATE INDEX `idx_task_assignments_assigner` ON `task_assignments` (`assigner_id`);--> statement-breakpoint
CREATE INDEX `idx_task_assignments_status` ON `task_assignments` (`status`);--> statement-breakpoint
CREATE TABLE `__new_task_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`task_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`action` text NOT NULL,
	`changes` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_task_history`("id", "task_id", "user_id", "action", "changes", "created_at") SELECT "id", "task_id", "user_id", "action", "changes", "created_at" FROM `task_history`;--> statement-breakpoint
DROP TABLE `task_history`;--> statement-breakpoint
ALTER TABLE `__new_task_history` RENAME TO `task_history`;--> statement-breakpoint
CREATE INDEX `idx_task_history_task` ON `task_history` (`task_id`);--> statement-breakpoint
CREATE INDEX `idx_task_history_created_at` ON `task_history` (`created_at`);--> statement-breakpoint
CREATE TABLE `__new_task_tags` (
	`task_id` integer NOT NULL,
	`tag_id` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_task_tags`("task_id", "tag_id", "created_at") SELECT "task_id", "tag_id", "created_at" FROM `task_tags`;--> statement-breakpoint
DROP TABLE `task_tags`;--> statement-breakpoint
ALTER TABLE `__new_task_tags` RENAME TO `task_tags`;--> statement-breakpoint
CREATE INDEX `idx_task_tags_task` ON `task_tags` (`task_id`);--> statement-breakpoint
CREATE INDEX `idx_task_tags_tag` ON `task_tags` (`tag_id`);--> statement-breakpoint
CREATE TABLE `__new_tasks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'TODO' NOT NULL,
	`priority` text DEFAULT 'medium' NOT NULL,
	`importance` integer DEFAULT false NOT NULL,
	`urgency` integer DEFAULT false NOT NULL,
	`eisenhower_quadrant` integer DEFAULT 4 NOT NULL,
	`project_id` integer,
	`category_id` integer,
	`parent_id` integer,
	`created_by` integer NOT NULL,
	`assigned_to` integer,
	`assignment_status` text,
	`assignment_note` text,
	`estimated_time` integer,
	`progress` integer DEFAULT 0 NOT NULL,
	`scheduled_date` text,
	`scheduled_start_date` text,
	`scheduled_end_date` text,
	`due_date` text,
	`deleted_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`assigned_to`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_tasks`("id", "title", "description", "status", "priority", "importance", "urgency", "eisenhower_quadrant", "project_id", "category_id", "parent_id", "created_by", "assigned_to", "assignment_status", "assignment_note", "estimated_time", "progress", "scheduled_date", "scheduled_start_date", "scheduled_end_date", "due_date", "deleted_at", "created_at", "updated_at") SELECT "id", "title", "description", "status", "priority", "importance", "urgency", "eisenhower_quadrant", "project_id", "category_id", "parent_id", "created_by", "assigned_to", "assignment_status", "assignment_note", "estimated_time", "progress", "scheduled_date", "scheduled_start_date", "scheduled_end_date", "due_date", "deleted_at", "created_at", "updated_at" FROM `tasks`;--> statement-breakpoint
DROP TABLE `tasks`;--> statement-breakpoint
ALTER TABLE `__new_tasks` RENAME TO `tasks`;--> statement-breakpoint
CREATE INDEX `idx_tasks_status` ON `tasks` (`status`);--> statement-breakpoint
CREATE INDEX `idx_tasks_importance` ON `tasks` (`importance`);--> statement-breakpoint
CREATE INDEX `idx_tasks_urgency` ON `tasks` (`urgency`);--> statement-breakpoint
CREATE INDEX `idx_tasks_eisenhower` ON `tasks` (`eisenhower_quadrant`);--> statement-breakpoint
CREATE INDEX `idx_tasks_project` ON `tasks` (`project_id`);--> statement-breakpoint
CREATE INDEX `idx_tasks_category` ON `tasks` (`category_id`);--> statement-breakpoint
CREATE INDEX `idx_tasks_parent` ON `tasks` (`parent_id`);--> statement-breakpoint
CREATE INDEX `idx_tasks_created_by` ON `tasks` (`created_by`);--> statement-breakpoint
CREATE INDEX `idx_tasks_assigned_to` ON `tasks` (`assigned_to`);--> statement-breakpoint
CREATE INDEX `idx_tasks_assignment_status` ON `tasks` (`assignment_status`);--> statement-breakpoint
CREATE INDEX `idx_tasks_scheduled_start_date` ON `tasks` (`scheduled_start_date`);--> statement-breakpoint
CREATE INDEX `idx_tasks_scheduled_end_date` ON `tasks` (`scheduled_end_date`);--> statement-breakpoint
CREATE INDEX `idx_tasks_due_date` ON `tasks` (`due_date`);--> statement-breakpoint
CREATE INDEX `idx_tasks_deleted_at` ON `tasks` (`deleted_at`);--> statement-breakpoint
CREATE INDEX `idx_tasks_created_at` ON `tasks` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_tasks_status_created_at` ON `tasks` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_tasks_assigned_to_status` ON `tasks` (`assigned_to`,`status`);--> statement-breakpoint
CREATE INDEX `idx_tasks_project_status` ON `tasks` (`project_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_tasks_category_status` ON `tasks` (`category_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_tasks_eisenhower_status` ON `tasks` (`eisenhower_quadrant`,`status`);--> statement-breakpoint
CREATE INDEX `idx_tasks_due_date_status` ON `tasks` (`due_date`,`status`);--> statement-breakpoint
CREATE INDEX `idx_tasks_status_not_deleted` ON `tasks` (`status`,`deleted_at`);
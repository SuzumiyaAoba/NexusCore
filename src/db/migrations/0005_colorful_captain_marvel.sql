CREATE TABLE `task_attachments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`task_id` integer NOT NULL,
	`uploaded_by` integer NOT NULL,
	`file_name` text NOT NULL,
	`file_size` integer NOT NULL,
	`file_type` text NOT NULL,
	`file_path` text NOT NULL,
	`uploaded_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "chk_task_attachments_filename_length" CHECK(LENGTH("task_attachments"."file_name") >= 1 AND LENGTH("task_attachments"."file_name") <= 255),
	CONSTRAINT "chk_task_attachments_file_size" CHECK("task_attachments"."file_size" > 0)
);
--> statement-breakpoint
CREATE INDEX `idx_task_attachments_task` ON `task_attachments` (`task_id`);--> statement-breakpoint
CREATE INDEX `idx_task_attachments_uploaded_by` ON `task_attachments` (`uploaded_by`);--> statement-breakpoint
CREATE INDEX `idx_task_attachments_uploaded_at` ON `task_attachments` (`uploaded_at`);--> statement-breakpoint
CREATE INDEX `idx_task_attachments_task_uploaded_at` ON `task_attachments` (`task_id`,`uploaded_at`);--> statement-breakpoint
CREATE INDEX `idx_task_attachments_file_name` ON `task_attachments` (`file_name`);--> statement-breakpoint
CREATE TABLE `task_comments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`task_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`content` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "chk_task_comments_content_length" CHECK(LENGTH("task_comments"."content") >= 1 AND LENGTH("task_comments"."content") <= 1000)
);
--> statement-breakpoint
CREATE INDEX `idx_task_comments_task` ON `task_comments` (`task_id`);--> statement-breakpoint
CREATE INDEX `idx_task_comments_user` ON `task_comments` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_task_comments_created_at` ON `task_comments` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_task_comments_task_created_at` ON `task_comments` (`task_id`,`created_at`);
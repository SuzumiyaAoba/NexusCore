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
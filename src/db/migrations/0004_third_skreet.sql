CREATE TABLE `task_time_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`task_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`started_at` text NOT NULL,
	`ended_at` text,
	`duration` integer,
	`description` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "chk_task_time_logs_duration" CHECK("task_time_logs"."duration" IS NULL OR "task_time_logs"."duration" >= 0)
);
--> statement-breakpoint
CREATE INDEX `idx_task_time_logs_task` ON `task_time_logs` (`task_id`);--> statement-breakpoint
CREATE INDEX `idx_task_time_logs_user` ON `task_time_logs` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_task_time_logs_started_at` ON `task_time_logs` (`started_at`);--> statement-breakpoint
CREATE INDEX `idx_task_time_logs_ended_at` ON `task_time_logs` (`ended_at`);--> statement-breakpoint
CREATE INDEX `idx_task_time_logs_task_user` ON `task_time_logs` (`task_id`,`user_id`);
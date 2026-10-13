CREATE TABLE `notifications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`recipient_email` text NOT NULL,
	`task_id` integer NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`notification_type` text DEFAULT 'Assignment' NOT NULL,
	`read_at` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `team_members` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`role` text DEFAULT 'Member' NOT NULL,
	`department` text DEFAULT 'Operations' NOT NULL,
	`active` integer DEFAULT 1 NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `team_members_email_unique` ON `team_members` (`email`);--> statement-breakpoint
ALTER TABLE `tasks` ADD `assignee_email` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `wholesale_opportunities` ADD `province` text DEFAULT 'Gauteng' NOT NULL;--> statement-breakpoint
ALTER TABLE `wholesale_opportunities` ADD `zone` text DEFAULT '' NOT NULL;
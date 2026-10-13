ALTER TABLE `tasks` ADD `task_type` text DEFAULT 'General' NOT NULL;--> statement-breakpoint
ALTER TABLE `tasks` ADD `task_group` text DEFAULT 'Store Tasks' NOT NULL;
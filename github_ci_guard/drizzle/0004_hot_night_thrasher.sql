CREATE TABLE `commission_settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`base_target` real DEFAULT 1000000 NOT NULL,
	`base_gp_threshold` real DEFAULT 10 NOT NULL,
	`accelerator_gp_threshold` real DEFAULT 15 NOT NULL,
	`rep_base_rate` real DEFAULT 5 NOT NULL,
	`rep_accelerator_rate` real DEFAULT 6 NOT NULL,
	`coordinator_rate` real DEFAULT 2 NOT NULL,
	`head_rate` real DEFAULT 2 NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sop_documents` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`document_type` text DEFAULT 'SOP' NOT NULL,
	`department` text DEFAULT 'Operations' NOT NULL,
	`workspace` text DEFAULT 'Head Office' NOT NULL,
	`owner` text DEFAULT 'Operations' NOT NULL,
	`review_date` text DEFAULT '' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`file_name` text NOT NULL,
	`mime_type` text NOT NULL,
	`size` integer NOT NULL,
	`object_key` text NOT NULL,
	`status` text DEFAULT 'Uploaded' NOT NULL,
	`ai_summary` text DEFAULT '' NOT NULL,
	`workflow_json` text DEFAULT '[]' NOT NULL,
	`checklist_json` text DEFAULT '[]' NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `wholesale_opportunities` ADD `contact_person` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `wholesale_opportunities` ADD `email` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `wholesale_opportunities` ADD `customer_type` text DEFAULT 'Independent Hardware' NOT NULL;--> statement-breakpoint
ALTER TABLE `wholesale_opportunities` ADD `coordinator` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `wholesale_opportunities` ADD `monthly_target` real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `wholesale_opportunities` ADD `last_visit` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `wholesale_opportunities` ADD `next_follow_up` text DEFAULT '' NOT NULL;
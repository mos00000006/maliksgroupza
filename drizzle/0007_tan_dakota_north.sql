CREATE TABLE `sop_resources` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sop_id` integer NOT NULL,
	`label` text NOT NULL,
	`resource_type` text DEFAULT 'Form / Checklist' NOT NULL,
	`file_name` text NOT NULL,
	`mime_type` text NOT NULL,
	`size` integer NOT NULL,
	`object_key` text NOT NULL,
	`uploaded_by` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sop_training_records` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sop_id` integer NOT NULL,
	`member_email` text NOT NULL,
	`member_name` text NOT NULL,
	`status` text DEFAULT 'Assigned' NOT NULL,
	`signature_name` text DEFAULT '' NOT NULL,
	`read_at` text DEFAULT '' NOT NULL,
	`trained_at` text DEFAULT '' NOT NULL,
	`competency_status` text DEFAULT 'Pending' NOT NULL,
	`assessed_by` text DEFAULT '' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `financial_entries` ADD `expense_nature` text DEFAULT 'Variable' NOT NULL;--> statement-breakpoint
ALTER TABLE `financial_entries` ADD `recurring` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `financial_entries` ADD `effective_to` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `team_members` ADD `access_scope` text DEFAULT 'Assigned workspace' NOT NULL;--> statement-breakpoint
ALTER TABLE `team_members` ADD `workspace_access` text DEFAULT '[]' NOT NULL;
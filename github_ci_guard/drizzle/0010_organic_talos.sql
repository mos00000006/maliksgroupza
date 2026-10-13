CREATE TABLE IF NOT EXISTS `wholesale_customer_sequence` (
	`id` integer PRIMARY KEY NOT NULL,
	`next_number` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `wholesale_visits` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`opportunity_id` integer NOT NULL,
	`visit_date` text NOT NULL,
	`visit_type` text DEFAULT 'In person' NOT NULL,
	`update_type` text DEFAULT 'General follow-up' NOT NULL,
	`contact_person` text DEFAULT '' NOT NULL,
	`outcome` text DEFAULT '' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`next_follow_up` text DEFAULT '' NOT NULL,
	`scheduled_time` text DEFAULT '' NOT NULL,
	`purpose` text DEFAULT '' NOT NULL,
	`visit_status` text DEFAULT 'Completed' NOT NULL,
	`area` text DEFAULT '' NOT NULL,
	`visit_address` text DEFAULT '' NOT NULL,
	`created_by` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL
);

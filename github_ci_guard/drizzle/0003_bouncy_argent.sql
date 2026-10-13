CREATE TABLE `financial_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`workspace` text NOT NULL,
	`entry_type` text NOT NULL,
	`category` text NOT NULL,
	`amount` real DEFAULT 0 NOT NULL,
	`period` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `wholesale_opportunities` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`customer_name` text NOT NULL,
	`contact` text DEFAULT '' NOT NULL,
	`region` text DEFAULT '' NOT NULL,
	`quotation_no` text DEFAULT '' NOT NULL,
	`order_no` text DEFAULT '' NOT NULL,
	`value` real DEFAULT 0 NOT NULL,
	`gp_percent` real DEFAULT 0 NOT NULL,
	`stage` text DEFAULT 'Lead' NOT NULL,
	`assigned_to` text DEFAULT '' NOT NULL,
	`next_action` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL
);

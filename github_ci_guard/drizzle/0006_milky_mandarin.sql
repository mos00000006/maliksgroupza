ALTER TABLE `team_members` ADD `invite_status` text DEFAULT 'Active' NOT NULL;--> statement-breakpoint
ALTER TABLE `team_members` ADD `invite_token` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `team_members` ADD `invite_sent_at` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `team_members` ADD `accepted_at` text DEFAULT '' NOT NULL;
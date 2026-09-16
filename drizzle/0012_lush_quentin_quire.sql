CREATE TABLE IF NOT EXISTS `employee_records` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`workspace` text NOT NULL,
	`employee_number` text DEFAULT '' NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`position` text DEFAULT '' NOT NULL,
	`department` text DEFAULT '' NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`email` text DEFAULT '' NOT NULL,
	`start_date` text DEFAULT '' NOT NULL,
	`employment_status` text DEFAULT 'Active' NOT NULL,
	`attendance_status` text DEFAULT 'At work' NOT NULL,
	`attendance_note` text DEFAULT '' NOT NULL,
	`updated_by` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);

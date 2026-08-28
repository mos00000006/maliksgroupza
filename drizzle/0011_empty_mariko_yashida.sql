CREATE TABLE `development_documents` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer NOT NULL,
	`expense_id` integer DEFAULT 0 NOT NULL,
	`document_type` text DEFAULT 'Invoice / Quotation' NOT NULL,
	`name` text NOT NULL,
	`mime_type` text NOT NULL,
	`size` integer NOT NULL,
	`object_key` text NOT NULL,
	`uploaded_by` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `development_expenses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer NOT NULL,
	`category` text NOT NULL,
	`supplier_contractor` text DEFAULT '' NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`budgeted_amount` real DEFAULT 0 NOT NULL,
	`committed_amount` real DEFAULT 0 NOT NULL,
	`actual_amount` real DEFAULT 0 NOT NULL,
	`paid_amount` real DEFAULT 0 NOT NULL,
	`expense_status` text DEFAULT 'Budgeted' NOT NULL,
	`invoice_number` text DEFAULT '' NOT NULL,
	`expense_date` text DEFAULT '' NOT NULL,
	`due_date` text DEFAULT '' NOT NULL,
	`owner` text DEFAULT '' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `development_projects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_name` text NOT NULL,
	`site_location` text DEFAULT '' NOT NULL,
	`project_type` text DEFAULT 'New Store' NOT NULL,
	`status` text DEFAULT 'Planning' NOT NULL,
	`rag_status` text DEFAULT 'Green' NOT NULL,
	`project_manager` text DEFAULT '' NOT NULL,
	`start_date` text DEFAULT '' NOT NULL,
	`planned_opening_date` text DEFAULT '' NOT NULL,
	`actual_opening_date` text DEFAULT '' NOT NULL,
	`approved_budget` real DEFAULT 0 NOT NULL,
	`contingency_budget` real DEFAULT 0 NOT NULL,
	`stock_budget` real DEFAULT 0 NOT NULL,
	`progress_percent` integer DEFAULT 0 NOT NULL,
	`approval_status` text DEFAULT 'Pending approval' NOT NULL,
	`approved_by` text DEFAULT '' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);

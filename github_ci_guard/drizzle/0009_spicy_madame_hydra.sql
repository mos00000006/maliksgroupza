CREATE TABLE `wholesale_customer_documents` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`opportunity_id` integer NOT NULL,
	`document_type` text DEFAULT 'Supporting document' NOT NULL,
	`name` text NOT NULL,
	`mime_type` text NOT NULL,
	`size` integer NOT NULL,
	`object_key` text NOT NULL,
	`uploaded_by` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `wholesale_opportunities` ADD `customer_number` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `wholesale_opportunities` ADD `application_status` text DEFAULT 'Pending approval' NOT NULL;--> statement-breakpoint
ALTER TABLE `wholesale_opportunities` ADD `registered_name` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `wholesale_opportunities` ADD `registration_number` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `wholesale_opportunities` ADD `vat_number` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `wholesale_opportunities` ADD `nature_of_business` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `wholesale_opportunities` ADD `years_in_business` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `wholesale_opportunities` ADD `branch_count` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `wholesale_opportunities` ADD `head_office_address` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `wholesale_opportunities` ADD `postal_code` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `wholesale_opportunities` ADD `website` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `wholesale_opportunities` ADD `legal_entity` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `wholesale_opportunities` ADD `owner1_name` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `wholesale_opportunities` ADD `owner1_id` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `wholesale_opportunities` ADD `owner1_position` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `wholesale_opportunities` ADD `owner1_mobile` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `wholesale_opportunities` ADD `owner2_name` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `wholesale_opportunities` ADD `owner2_id` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `wholesale_opportunities` ADD `owner2_position` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `wholesale_opportunities` ADD `owner2_mobile` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `wholesale_opportunities` ADD `purchasing_contact_name` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `wholesale_opportunities` ADD `purchasing_contact_mobile` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `wholesale_opportunities` ADD `purchasing_contact_email` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `wholesale_opportunities` ADD `accounts_contact_name` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `wholesale_opportunities` ADD `accounts_contact_mobile` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `wholesale_opportunities` ADD `accounts_contact_email` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `wholesale_opportunities` ADD `delivery_address` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `wholesale_opportunities` ADD `delivery_contact` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `wholesale_opportunities` ADD `delivery_contact_mobile` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `wholesale_opportunities` ADD `receiving_hours` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `wholesale_opportunities` ADD `delivery_requirements` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `wholesale_opportunities` ADD `product_categories` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `wholesale_opportunities` ADD `average_monthly_spend` real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `wholesale_opportunities` ADD `ordering_method` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `wholesale_opportunities` ADD `ordering_frequency` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `wholesale_opportunities` ADD `payment_terms` text DEFAULT 'COD / EFT Before Dispatch' NOT NULL;--> statement-breakpoint
ALTER TABLE `wholesale_opportunities` ADD `credit_requested` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `wholesale_opportunities` ADD `price_group` text DEFAULT 'Standard Wholesale' NOT NULL;--> statement-breakpoint
ALTER TABLE `wholesale_opportunities` ADD `declaration_accepted` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `wholesale_opportunities` ADD `application_submitted_at` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `wholesale_opportunities` ADD `approved_by` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `wholesale_opportunities` ADD `approved_at` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `wholesale_opportunities` ADD `approval_comments` text DEFAULT '' NOT NULL;
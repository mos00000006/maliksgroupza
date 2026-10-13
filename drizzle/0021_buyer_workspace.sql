CREATE TABLE IF NOT EXISTS `buyer_suppliers` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `supplier_code` text NOT NULL DEFAULT '',
  `name` text NOT NULL,
  `supplier_type` text NOT NULL DEFAULT 'Preferred',
  `contact_person` text NOT NULL DEFAULT '',
  `phone` text NOT NULL DEFAULT '',
  `email` text NOT NULL DEFAULT '',
  `payment_terms` text NOT NULL DEFAULT '',
  `lead_time_days` integer NOT NULL DEFAULT 0,
  `minimum_order` real NOT NULL DEFAULT 0,
  `categories_json` text NOT NULL DEFAULT '[]',
  `notes` text NOT NULL DEFAULT '',
  `active` integer NOT NULL DEFAULT 1,
  `created_by` text NOT NULL,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL
);
CREATE INDEX IF NOT EXISTS `buyer_suppliers_name_idx` ON `buyer_suppliers` (`active`,`name`);
CREATE UNIQUE INDEX IF NOT EXISTS `buyer_suppliers_code_unique` ON `buyer_suppliers` (`supplier_code`) WHERE `supplier_code`<>'';

CREATE TABLE IF NOT EXISTS `buyer_orders` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `po_number` text NOT NULL UNIQUE,
  `buyer_email` text NOT NULL,
  `buyer_name` text NOT NULL DEFAULT '',
  `store_workspace` text NOT NULL DEFAULT '',
  `supplier_id` integer NOT NULL DEFAULT 0,
  `supplier_name` text NOT NULL DEFAULT '',
  `order_type` text NOT NULL DEFAULT 'Stock Replenishment',
  `order_date` text NOT NULL DEFAULT '',
  `required_date` text NOT NULL DEFAULT '',
  `quote_reference` text NOT NULL DEFAULT '',
  `delivery_method` text NOT NULL DEFAULT 'Supplier Delivery',
  `delivery_address` text NOT NULL DEFAULT '',
  `delivery_contact` text NOT NULL DEFAULT '',
  `status` text NOT NULL DEFAULT 'Draft',
  `approval_status` text NOT NULL DEFAULT 'Draft',
  `approved_by` text NOT NULL DEFAULT '',
  `approved_at` text NOT NULL DEFAULT '',
  `delivery_status` text NOT NULL DEFAULT 'Not ordered',
  `expected_delivery_date` text NOT NULL DEFAULT '',
  `grv_number` text NOT NULL DEFAULT '',
  `invoice_number` text NOT NULL DEFAULT '',
  `receiving_notes` text NOT NULL DEFAULT '',
  `subtotal` real NOT NULL DEFAULT 0,
  `vat_rate` real NOT NULL DEFAULT 15,
  `vat_amount` real NOT NULL DEFAULT 0,
  `total` real NOT NULL DEFAULT 0,
  `notes` text NOT NULL DEFAULT '',
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL
);
CREATE INDEX IF NOT EXISTS `buyer_orders_buyer_idx` ON `buyer_orders` (`buyer_email`,`updated_at`);
CREATE INDEX IF NOT EXISTS `buyer_orders_status_idx` ON `buyer_orders` (`status`,`approval_status`,`required_date`);

CREATE TABLE IF NOT EXISTS `buyer_order_lines` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `order_id` integer NOT NULL,
  `line_no` integer NOT NULL DEFAULT 1,
  `product_code` text NOT NULL DEFAULT '',
  `description` text NOT NULL,
  `category` text NOT NULL DEFAULT '',
  `quantity` real NOT NULL DEFAULT 0,
  `unit` text NOT NULL DEFAULT 'EA',
  `pack_size` text NOT NULL DEFAULT '',
  `last_cost_ex_vat` real NOT NULL DEFAULT 0,
  `unit_cost_ex_vat` real NOT NULL DEFAULT 0,
  `price_variance_pct` real NOT NULL DEFAULT 0,
  `line_total_ex_vat` real NOT NULL DEFAULT 0,
  `notes` text NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS `buyer_order_lines_order_idx` ON `buyer_order_lines` (`order_id`,`line_no`);

CREATE TABLE IF NOT EXISTS `buyer_quote_entries` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `buyer_email` text NOT NULL,
  `product_code` text NOT NULL DEFAULT '',
  `description` text NOT NULL,
  `category` text NOT NULL DEFAULT '',
  `quantity` real NOT NULL DEFAULT 1,
  `unit` text NOT NULL DEFAULT 'EA',
  `supplier_id` integer NOT NULL DEFAULT 0,
  `supplier_name` text NOT NULL DEFAULT '',
  `quote_reference` text NOT NULL DEFAULT '',
  `quoted_unit_cost` real NOT NULL DEFAULT 0,
  `valid_until` text NOT NULL DEFAULT '',
  `lead_time_days` integer NOT NULL DEFAULT 0,
  `payment_terms` text NOT NULL DEFAULT '',
  `selected` integer NOT NULL DEFAULT 0,
  `notes` text NOT NULL DEFAULT '',
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL
);
CREATE INDEX IF NOT EXISTS `buyer_quote_entries_buyer_idx` ON `buyer_quote_entries` (`buyer_email`,`description`,`quoted_unit_cost`);

INSERT INTO `workspaces` (`name`,`type`,`region`,`manager`,`active`,`created_at`)
SELECT 'Buyer Workspace','Department','Head Office','',1,datetime('now')
WHERE NOT EXISTS (SELECT 1 FROM `workspaces` WHERE lower(`name`)='buyer workspace');

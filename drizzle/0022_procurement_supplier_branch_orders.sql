ALTER TABLE `buyer_suppliers` ADD COLUMN `whatsapp_number` text NOT NULL DEFAULT '';
ALTER TABLE `buyer_orders` ADD COLUMN `last_sent_at` text NOT NULL DEFAULT '';
ALTER TABLE `buyer_orders` ADD COLUMN `last_sent_channel` text NOT NULL DEFAULT '';
ALTER TABLE `buyer_orders` ADD COLUMN `last_sent_to` text NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS `buyer_order_send_log` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `order_id` integer NOT NULL,
  `po_number` text NOT NULL,
  `supplier_id` integer NOT NULL DEFAULT 0,
  `supplier_name` text NOT NULL DEFAULT '',
  `channel` text NOT NULL,
  `recipient` text NOT NULL,
  `sent_by_email` text NOT NULL,
  `sent_by_name` text NOT NULL DEFAULT '',
  `sent_at` text NOT NULL,
  `notes` text NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS `buyer_order_send_log_order_idx` ON `buyer_order_send_log` (`order_id`,`sent_at`);
CREATE INDEX IF NOT EXISTS `buyer_order_send_log_sent_idx` ON `buyer_order_send_log` (`sent_at`);

CREATE TABLE IF NOT EXISTS `branch_stock_orders` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `stock_order_number` text NOT NULL UNIQUE,
  `branch_workspace` text NOT NULL,
  `requested_by_email` text NOT NULL,
  `requested_by_name` text NOT NULL DEFAULT '',
  `order_date` text NOT NULL DEFAULT '',
  `required_date` text NOT NULL DEFAULT '',
  `priority` text NOT NULL DEFAULT 'Normal',
  `status` text NOT NULL DEFAULT 'Draft',
  `branch_notes` text NOT NULL DEFAULT '',
  `warehouse_notes` text NOT NULL DEFAULT '',
  `buyer_email` text NOT NULL DEFAULT '',
  `buyer_name` text NOT NULL DEFAULT '',
  `sent_at` text NOT NULL DEFAULT '',
  `confirmed_at` text NOT NULL DEFAULT '',
  `expected_delivery_date` text NOT NULL DEFAULT '',
  `dispatch_reference` text NOT NULL DEFAULT '',
  `completed_at` text NOT NULL DEFAULT '',
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL
);
CREATE INDEX IF NOT EXISTS `branch_stock_orders_branch_idx` ON `branch_stock_orders` (`branch_workspace`,`updated_at`);
CREATE INDEX IF NOT EXISTS `branch_stock_orders_status_idx` ON `branch_stock_orders` (`status`,`required_date`);

CREATE TABLE IF NOT EXISTS `branch_stock_order_lines` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `order_id` integer NOT NULL,
  `line_no` integer NOT NULL DEFAULT 1,
  `catalogue_product_id` integer NOT NULL DEFAULT 0,
  `product_code` text NOT NULL DEFAULT '',
  `description` text NOT NULL,
  `category` text NOT NULL DEFAULT '',
  `quantity_requested` real NOT NULL DEFAULT 0,
  `quantity_confirmed` real NOT NULL DEFAULT 0,
  `quantity_dispatched` real NOT NULL DEFAULT 0,
  `unit` text NOT NULL DEFAULT 'EA',
  `branch_notes` text NOT NULL DEFAULT '',
  `warehouse_notes` text NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS `branch_stock_order_lines_order_idx` ON `branch_stock_order_lines` (`order_id`,`line_no`);

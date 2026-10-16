CREATE TABLE IF NOT EXISTS `ecommerce_product_settings` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `catalogue_product_id` integer NOT NULL UNIQUE,
  `b2c_enabled` integer NOT NULL DEFAULT 0,
  `b2b_enabled` integer NOT NULL DEFAULT 0,
  `retail_price_inc_vat` real NOT NULL DEFAULT 0,
  `wholesale_price_ex_vat` real NOT NULL DEFAULT 0,
  `b2b_min_qty` real NOT NULL DEFAULT 1,
  `unit` text NOT NULL DEFAULT 'EA',
  `stock_status` text NOT NULL DEFAULT 'Available',
  `featured` integer NOT NULL DEFAULT 0,
  `sort_order` integer NOT NULL DEFAULT 0,
  `updated_by` text NOT NULL DEFAULT '',
  `updated_at` text NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS `ecommerce_product_settings_b2c_idx` ON `ecommerce_product_settings` (`b2c_enabled`,`featured`,`sort_order`);
CREATE INDEX IF NOT EXISTS `ecommerce_product_settings_b2b_idx` ON `ecommerce_product_settings` (`b2b_enabled`,`featured`,`sort_order`);

INSERT OR IGNORE INTO `ecommerce_product_settings`
  (`catalogue_product_id`,`b2c_enabled`,`b2b_enabled`,`retail_price_inc_vat`,`wholesale_price_ex_vat`,`b2b_min_qty`,`unit`,`stock_status`,`featured`,`sort_order`,`updated_by`,`updated_at`)
SELECT `id`,1,1,0,0,1,'EA','Available',0,0,'system:ecommerce-bootstrap',datetime('now')
FROM `catalogue_products`
WHERE `active`=1;

CREATE TABLE IF NOT EXISTS `ecommerce_settings` (
  `setting_key` text PRIMARY KEY NOT NULL,
  `setting_value` text NOT NULL DEFAULT '',
  `updated_by` text NOT NULL DEFAULT '',
  `updated_at` text NOT NULL DEFAULT ''
);
INSERT OR IGNORE INTO `ecommerce_settings` (`setting_key`,`setting_value`,`updated_by`,`updated_at`) VALUES
  ('b2c_store_name','PowerBuild Online','system:ecommerce-bootstrap',datetime('now')),
  ('b2b_store_name','PowerBuild Wholesale Online','system:ecommerce-bootstrap',datetime('now')),
  ('support_email','','system:ecommerce-bootstrap',datetime('now')),
  ('support_whatsapp','','system:ecommerce-bootstrap',datetime('now')),
  ('vat_rate','15','system:ecommerce-bootstrap',datetime('now')),
  ('b2c_orders_enabled','true','system:ecommerce-bootstrap',datetime('now')),
  ('b2b_orders_enabled','true','system:ecommerce-bootstrap',datetime('now'));

CREATE TABLE IF NOT EXISTS `ecommerce_b2b_customers` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `company_name` text NOT NULL,
  `trading_name` text NOT NULL DEFAULT '',
  `contact_name` text NOT NULL,
  `email` text NOT NULL,
  `whatsapp` text NOT NULL DEFAULT '',
  `vat_number` text NOT NULL DEFAULT '',
  `registration_number` text NOT NULL DEFAULT '',
  `delivery_address` text NOT NULL DEFAULT '',
  `customer_code` text NOT NULL DEFAULT '',
  `portal_code` text NOT NULL DEFAULT '',
  `credit_terms` text NOT NULL DEFAULT 'COD',
  `pricing_tier` text NOT NULL DEFAULT 'Standard Wholesale',
  `status` text NOT NULL DEFAULT 'Pending',
  `notes` text NOT NULL DEFAULT '',
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL,
  `approved_by` text NOT NULL DEFAULT '',
  `approved_at` text NOT NULL DEFAULT ''
);
CREATE UNIQUE INDEX IF NOT EXISTS `ecommerce_b2b_customers_email_unique` ON `ecommerce_b2b_customers` (`email`);
CREATE INDEX IF NOT EXISTS `ecommerce_b2b_customers_status_idx` ON `ecommerce_b2b_customers` (`status`,`updated_at`);

CREATE TABLE IF NOT EXISTS `ecommerce_orders` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `order_number` text NOT NULL UNIQUE,
  `channel` text NOT NULL,
  `customer_name` text NOT NULL,
  `company_name` text NOT NULL DEFAULT '',
  `customer_email` text NOT NULL,
  `customer_whatsapp` text NOT NULL DEFAULT '',
  `vat_number` text NOT NULL DEFAULT '',
  `b2b_customer_id` integer NOT NULL DEFAULT 0,
  `branch_workspace` text NOT NULL DEFAULT '',
  `fulfilment_type` text NOT NULL DEFAULT 'Collection',
  `delivery_address` text NOT NULL DEFAULT '',
  `customer_po` text NOT NULL DEFAULT '',
  `payment_method` text NOT NULL DEFAULT '',
  `status` text NOT NULL DEFAULT 'New',
  `pricing_status` text NOT NULL DEFAULT 'Priced',
  `subtotal_ex_vat` real NOT NULL DEFAULT 0,
  `vat_amount` real NOT NULL DEFAULT 0,
  `total_inc_vat` real NOT NULL DEFAULT 0,
  `notes` text NOT NULL DEFAULT '',
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL
);
CREATE INDEX IF NOT EXISTS `ecommerce_orders_channel_idx` ON `ecommerce_orders` (`channel`,`status`,`created_at`);
CREATE INDEX IF NOT EXISTS `ecommerce_orders_email_idx` ON `ecommerce_orders` (`customer_email`,`created_at`);

CREATE TABLE IF NOT EXISTS `ecommerce_order_lines` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `order_id` integer NOT NULL,
  `line_no` integer NOT NULL DEFAULT 1,
  `catalogue_product_id` integer NOT NULL DEFAULT 0,
  `product_code` text NOT NULL DEFAULT '',
  `product_name` text NOT NULL,
  `category` text NOT NULL DEFAULT '',
  `quantity` real NOT NULL DEFAULT 0,
  `unit` text NOT NULL DEFAULT 'EA',
  `unit_price_ex_vat` real NOT NULL DEFAULT 0,
  `unit_price_inc_vat` real NOT NULL DEFAULT 0,
  `line_total_inc_vat` real NOT NULL DEFAULT 0,
  `price_pending` integer NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS `ecommerce_order_lines_order_idx` ON `ecommerce_order_lines` (`order_id`,`line_no`);

CREATE TABLE IF NOT EXISTS `ecommerce_order_events` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `order_id` integer NOT NULL,
  `status` text NOT NULL,
  `message` text NOT NULL DEFAULT '',
  `actor_email` text NOT NULL DEFAULT '',
  `created_at` text NOT NULL
);
CREATE INDEX IF NOT EXISTS `ecommerce_order_events_order_idx` ON `ecommerce_order_events` (`order_id`,`created_at`);

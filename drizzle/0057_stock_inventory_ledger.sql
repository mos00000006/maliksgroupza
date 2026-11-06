-- Maliks Stock Operations V9: branch-level inventory with explicit baseline activation.
-- REQUIRES 0056_stock_operations_control_register.sql.
-- No existing approved documents are replayed. No live sales/GL integration.
-- Quantities are integer thousandths of a unit (qty_milli).
CREATE TABLE IF NOT EXISTS stock_inventory_branches (
  branch_name TEXT PRIMARY KEY,
  active INTEGER NOT NULL DEFAULT 0 CHECK(active IN (0,1)),
  created_at TEXT NOT NULL,
  created_by TEXT NOT NULL,
  activated_at TEXT NOT NULL DEFAULT '',
  activated_by TEXT NOT NULL DEFAULT '',
  activation_reference TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS stock_inventory_balances (
  branch_name TEXT NOT NULL,
  catalogue_product_id INTEGER NOT NULL,
  qty_milli INTEGER NOT NULL CHECK(qty_milli>=0),
  initialized_at TEXT NOT NULL,
  initialized_by TEXT NOT NULL,
  opening_reference TEXT NOT NULL,
  PRIMARY KEY (branch_name,catalogue_product_id)
);
CREATE INDEX IF NOT EXISTS stock_inventory_balances_product_idx ON stock_inventory_balances(catalogue_product_id);
CREATE TABLE IF NOT EXISTS stock_inventory_movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  document_id TEXT NOT NULL,
  document_line_id INTEGER NOT NULL,
  phase TEXT NOT NULL CHECK(phase IN ('OPENING','APPROVAL','RECEIPT')),
  branch_name TEXT NOT NULL,
  catalogue_product_id INTEGER NOT NULL,
  delta_milli INTEGER NOT NULL,
  balance_after_milli INTEGER NOT NULL CHECK(balance_after_milli>=0),
  actor_email TEXT NOT NULL,
  posted_at TEXT NOT NULL,
  reference TEXT NOT NULL DEFAULT '',
  UNIQUE (document_id, document_line_id, phase, branch_name)
);
CREATE INDEX IF NOT EXISTS stock_inventory_movements_branch_idx ON stock_inventory_movements(branch_name, id DESC);
CREATE INDEX IF NOT EXISTS stock_inventory_movements_product_idx ON stock_inventory_movements(branch_name,catalogue_product_id,id DESC);
CREATE TRIGGER IF NOT EXISTS stock_inventory_no_delete_branches BEFORE DELETE ON stock_inventory_branches
BEGIN SELECT RAISE(ABORT,'Inventory branch configuration is immutable'); END;
CREATE TRIGGER IF NOT EXISTS stock_inventory_no_reassign_branches BEFORE UPDATE ON stock_inventory_branches
WHEN NEW.branch_name<>OLD.branch_name OR NEW.created_at<>OLD.created_at OR NEW.created_by<>OLD.created_by
BEGIN SELECT RAISE(ABORT,'Inventory branch identity is immutable'); END;
CREATE TRIGGER IF NOT EXISTS stock_inventory_no_delete_balances BEFORE DELETE ON stock_inventory_balances BEGIN
 SELECT RAISE(ABORT,'Opening balances and stock ledgers cannot be deleted');
END;
CREATE TRIGGER IF NOT EXISTS stock_inventory_no_mutate_openings BEFORE UPDATE ON stock_inventory_balances
WHEN NEW.branch_name<>OLD.branch_name OR NEW.catalogue_product_id<>OLD.catalogue_product_id OR
 NEW.initialized_at<>OLD.initialized_at OR NEW.initialized_by<>OLD.initialized_by OR NEW.opening_reference<>OLD.opening_reference
BEGIN SELECT RAISE(ABORT,'Opening stock entries are immutable'); END;
CREATE TRIGGER IF NOT EXISTS stock_inventory_movements_no_update BEFORE UPDATE ON stock_inventory_movements
BEGIN SELECT RAISE(ABORT,'Inventory movement history is immutable'); END;
CREATE TRIGGER IF NOT EXISTS stock_inventory_movements_no_delete BEFORE DELETE ON stock_inventory_movements
BEGIN SELECT RAISE(ABORT,'Inventory movement history is immutable'); END;
CREATE TRIGGER IF NOT EXISTS stock_inventory_opening_audit AFTER INSERT ON stock_inventory_balances
BEGIN
 INSERT INTO stock_inventory_movements(document_id,document_line_id,phase,branch_name,catalogue_product_id,delta_milli,balance_after_milli,actor_email,posted_at,reference)
 VALUES('OPEN:'||NEW.branch_name||':'||NEW.catalogue_product_id,0,'OPENING',NEW.branch_name,NEW.catalogue_product_id,NEW.qty_milli,NEW.qty_milli,NEW.initialized_by,NEW.initialized_at,NEW.opening_reference);
END;
CREATE TRIGGER IF NOT EXISTS stock_inventory_immutable_activation BEFORE UPDATE ON stock_inventory_branches
WHEN OLD.active=1 AND (NEW.active<>1 OR NEW.activated_at<>OLD.activated_at OR NEW.activated_by<>OLD.activated_by OR NEW.activation_reference<>OLD.activation_reference)
BEGIN SELECT RAISE(ABORT,'Active stock branch cannot be reset. Use approved adjustments.'); END;
CREATE TRIGGER IF NOT EXISTS stock_inventory_activation_requires_opening BEFORE UPDATE OF active ON stock_inventory_branches
WHEN NEW.active=1 AND OLD.active=0
BEGIN
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM stock_inventory_balances b WHERE b.branch_name=NEW.branch_name)
 THEN RAISE(ABORT,'Load verified opening stock before activating this branch') END;
 SELECT CASE WHEN NEW.activated_at='' OR NEW.activated_by='' OR length(NEW.activation_reference)<4
 THEN RAISE(ABORT,'Activation requires reference and operator') END;
END;

-- All posting conditions execute inside the same UPDATE statement that approves the document.
-- Any failure rolls the approval back; an unposted approved document cannot be produced once active.
CREATE TRIGGER IF NOT EXISTS stock_inventory_validate_approval BEFORE UPDATE OF status ON stock_ops_documents
WHEN NEW.status='Approved' AND OLD.status='Submitted'
BEGIN
 SELECT CASE WHEN NEW.kind='TRANSFER' AND
  coalesce((SELECT active FROM stock_inventory_branches WHERE branch_name=NEW.branch_name),0)<>
  coalesce((SELECT active FROM stock_inventory_branches WHERE branch_name=NEW.destination_branch),0)
 THEN RAISE(ABORT,'Both transfer branches must be activated before live posting') END;
 SELECT CASE WHEN coalesce((SELECT active FROM stock_inventory_branches WHERE branch_name=NEW.branch_name),0)=1 AND
  NOT EXISTS(SELECT 1 FROM stock_ops_document_lines WHERE document_id=NEW.id)
 THEN RAISE(ABORT,'Cannot post a stock document without products') END;
 SELECT CASE WHEN coalesce((SELECT active FROM stock_inventory_branches WHERE branch_name=NEW.branch_name),0)=1 AND
  EXISTS(SELECT 1 FROM stock_ops_document_lines l LEFT JOIN stock_inventory_balances b
   ON b.branch_name=NEW.branch_name AND b.catalogue_product_id=l.catalogue_product_id
   WHERE l.document_id=NEW.id AND b.catalogue_product_id IS NULL)
 THEN RAISE(ABORT,'Missing verified opening balance for a product. Initialise SKU first.') END;
 SELECT CASE WHEN NEW.kind='TRANSFER' AND coalesce((SELECT active FROM stock_inventory_branches WHERE branch_name=NEW.branch_name),0)=1 AND
  EXISTS(SELECT 1 FROM stock_ops_document_lines l LEFT JOIN stock_inventory_balances b
   ON b.branch_name=NEW.destination_branch AND b.catalogue_product_id=l.catalogue_product_id
   WHERE l.document_id=NEW.id AND b.catalogue_product_id IS NULL)
 THEN RAISE(ABORT,'Destination SKU has no opening balance. Initialise before transfer.') END;
 SELECT CASE WHEN NEW.kind IN ('COUNT','ADJUSTMENT') AND coalesce((SELECT active FROM stock_inventory_branches WHERE branch_name=NEW.branch_name),0)=1 AND
  EXISTS(SELECT 1 FROM stock_ops_document_lines l JOIN stock_inventory_balances b
   ON b.branch_name=NEW.branch_name AND b.catalogue_product_id=l.catalogue_product_id
   WHERE l.document_id=NEW.id AND b.qty_milli<>CAST(ROUND(l.expected_quantity*1000) AS INTEGER))
 THEN RAISE(ABORT,'Stock changed since counted. Recount and create a fresh document.') END;
 SELECT CASE WHEN coalesce((SELECT active FROM stock_inventory_branches WHERE branch_name=NEW.branch_name),0)=1 AND
  EXISTS(SELECT 1 FROM stock_ops_document_lines l JOIN stock_inventory_balances b
   ON b.branch_name=NEW.branch_name AND b.catalogue_product_id=l.catalogue_product_id
   WHERE l.document_id=NEW.id AND b.qty_milli +
    CASE WHEN NEW.kind='GRV' THEN CAST(ROUND((l.document_quantity-l.rejected_quantity)*1000) AS INTEGER)
         WHEN NEW.kind IN('COUNT','ADJUSTMENT') THEN CAST(ROUND((l.document_quantity-l.expected_quantity)*1000) AS INTEGER)
         ELSE -CAST(ROUND(l.document_quantity*1000) AS INTEGER) END < 0)
 THEN RAISE(ABORT,'Insufficient available stock for this transaction') END;
END;
CREATE TRIGGER IF NOT EXISTS stock_inventory_post_approved AFTER UPDATE OF status ON stock_ops_documents
WHEN NEW.status='Approved' AND OLD.status='Submitted' AND
 coalesce((SELECT active FROM stock_inventory_branches WHERE branch_name=NEW.branch_name),0)=1
BEGIN
 UPDATE stock_inventory_balances SET qty_milli=qty_milli+(
  SELECT CASE WHEN NEW.kind='GRV' THEN CAST(ROUND((l.document_quantity-l.rejected_quantity)*1000) AS INTEGER)
              WHEN NEW.kind IN('COUNT','ADJUSTMENT') THEN CAST(ROUND((l.document_quantity-l.expected_quantity)*1000) AS INTEGER)
              ELSE -CAST(ROUND(l.document_quantity*1000) AS INTEGER) END
  FROM stock_ops_document_lines l
  WHERE l.document_id=NEW.id AND l.catalogue_product_id=stock_inventory_balances.catalogue_product_id)
 WHERE branch_name=NEW.branch_name AND catalogue_product_id IN
    (SELECT catalogue_product_id FROM stock_ops_document_lines WHERE document_id=NEW.id);
 INSERT INTO stock_inventory_movements(document_id,document_line_id,phase,branch_name,catalogue_product_id,delta_milli,balance_after_milli,actor_email,posted_at,reference)
 SELECT NEW.id,l.id,'APPROVAL',NEW.branch_name,l.catalogue_product_id,
  CASE WHEN NEW.kind='GRV' THEN CAST(ROUND((l.document_quantity-l.rejected_quantity)*1000) AS INTEGER)
       WHEN NEW.kind IN('COUNT','ADJUSTMENT') THEN CAST(ROUND((l.document_quantity-l.expected_quantity)*1000) AS INTEGER)
       ELSE -CAST(ROUND(l.document_quantity*1000) AS INTEGER) END,
  b.qty_milli, NEW.last_action_by,coalesce(NULLIF(NEW.reviewed_at,''),datetime('now')),NEW.document_number
 FROM stock_ops_document_lines l JOIN stock_inventory_balances b
  ON b.branch_name=NEW.branch_name AND b.catalogue_product_id=l.catalogue_product_id
 WHERE l.document_id=NEW.id;
END;
CREATE TRIGGER IF NOT EXISTS stock_inventory_validate_receipt BEFORE UPDATE OF status ON stock_ops_documents
WHEN NEW.status='Received' AND OLD.status='Approved' AND NEW.kind='TRANSFER' AND
 coalesce((SELECT active FROM stock_inventory_branches WHERE branch_name=NEW.destination_branch),0)=1
BEGIN
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM stock_inventory_movements
  WHERE document_id=NEW.id AND phase='APPROVAL' AND branch_name=NEW.branch_name)
 THEN RAISE(ABORT,'Cannot receive old transfer that was not posted from source') END;
 SELECT CASE WHEN EXISTS(SELECT 1 FROM stock_ops_document_lines l LEFT JOIN stock_inventory_balances b
  ON b.branch_name=NEW.destination_branch AND b.catalogue_product_id=l.catalogue_product_id
  WHERE l.document_id=NEW.id AND b.catalogue_product_id IS NULL)
 THEN RAISE(ABORT,'Missing destination opening balances') END;
END;
CREATE TRIGGER IF NOT EXISTS stock_inventory_post_transfer_receipt AFTER UPDATE OF status ON stock_ops_documents
WHEN NEW.status='Received' AND OLD.status='Approved' AND NEW.kind='TRANSFER' AND
 coalesce((SELECT active FROM stock_inventory_branches WHERE branch_name=NEW.destination_branch),0)=1
BEGIN
 UPDATE stock_inventory_balances SET qty_milli=qty_milli+(
  SELECT CAST(ROUND(l.document_quantity*1000) AS INTEGER) FROM stock_ops_document_lines l
  WHERE l.document_id=NEW.id AND l.catalogue_product_id=stock_inventory_balances.catalogue_product_id)
 WHERE branch_name=NEW.destination_branch AND catalogue_product_id IN
  (SELECT catalogue_product_id FROM stock_ops_document_lines WHERE document_id=NEW.id);
 INSERT INTO stock_inventory_movements(document_id,document_line_id,phase,branch_name,catalogue_product_id,delta_milli,balance_after_milli,actor_email,posted_at,reference)
 SELECT NEW.id,l.id,'RECEIPT',NEW.destination_branch,l.catalogue_product_id,CAST(ROUND(l.document_quantity*1000) AS INTEGER),b.qty_milli,
        NEW.last_action_by,coalesce(NULLIF(NEW.received_at,''),datetime('now')),NEW.document_number
 FROM stock_ops_document_lines l JOIN stock_inventory_balances b
 ON b.branch_name=NEW.destination_branch AND b.catalogue_product_id=l.catalogue_product_id
 WHERE l.document_id=NEW.id;
END;

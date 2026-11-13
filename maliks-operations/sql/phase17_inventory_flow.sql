-- Phase 17: independently verified goods receipts, GRV stock posting and inter-branch transfers.
-- Operational quantities only. No supplier invoice, AP, VAT, general ledger or sales stock posting.
CREATE TABLE IF NOT EXISTS maliks_pos_stock_balances (
 branch TEXT NOT NULL COLLATE NOCASE,
 stock_master_id INTEGER NOT NULL,
 qty_milli INTEGER NOT NULL DEFAULT 0 CHECK(qty_milli>=0),
 version INTEGER NOT NULL DEFAULT 1,
 updated_at TEXT NOT NULL,
 PRIMARY KEY(branch,stock_master_id)
);
CREATE TABLE IF NOT EXISTS maliks_pos_stock_movements (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 branch TEXT NOT NULL COLLATE NOCASE,
 stock_master_id INTEGER NOT NULL,
 quantity_delta_milli INTEGER NOT NULL CHECK(quantity_delta_milli!=0),
 movement_type TEXT NOT NULL CHECK(movement_type IN ('GRV','TRANSFER_OUT','TRANSFER_IN')),
 document_id INTEGER NOT NULL,
 actor_email TEXT NOT NULL,
 created_at TEXT NOT NULL,
 UNIQUE(movement_type,document_id,branch,stock_master_id)
);
CREATE INDEX IF NOT EXISTS idx_maliks_pos_stock_movements ON maliks_pos_stock_movements(branch,stock_master_id,id DESC);
CREATE TABLE IF NOT EXISTS maliks_pos_receipts (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 po_id INTEGER NOT NULL,
 branch TEXT NOT NULL COLLATE NOCASE,
 delivery_note TEXT NOT NULL,
 supplier_invoice_reference TEXT NOT NULL DEFAULT '',
 driver_name TEXT NOT NULL DEFAULT '',
 notes TEXT NOT NULL DEFAULT '',
 status TEXT NOT NULL DEFAULT 'COUNTED' CHECK(status IN ('COUNTED','VERIFIED','POSTED','CANCELLED')),
 version INTEGER NOT NULL DEFAULT 1 CHECK(version>0),
 counted_by_email TEXT NOT NULL,
 verified_by_email TEXT,
 posted_by_email TEXT,
 cancelled_by_email TEXT,
 labels_printed_by TEXT,labels_printed_at TEXT,
 labelled_by TEXT,labelled_at TEXT,
 pack_checked_by TEXT,pack_checked_at TEXT,
 created_at TEXT NOT NULL,
 updated_at TEXT NOT NULL,
 create_request_id TEXT NOT NULL UNIQUE,
 create_hash TEXT NOT NULL,
 last_request_id TEXT NOT NULL,
 UNIQUE(po_id,delivery_note COLLATE NOCASE)
);
CREATE INDEX IF NOT EXISTS idx_maliks_pos_receipts_po ON maliks_pos_receipts(branch,po_id,id DESC);
CREATE TABLE IF NOT EXISTS maliks_pos_receipt_lines (
 receipt_id INTEGER NOT NULL,
 stock_master_id INTEGER NOT NULL,
 accepted_milli INTEGER NOT NULL CHECK(accepted_milli>=0),
 rejected_milli INTEGER NOT NULL CHECK(rejected_milli>=0),
 PRIMARY KEY(receipt_id,stock_master_id),
 CHECK(accepted_milli+rejected_milli>0)
);
-- Prevent accepting more stock than was ordered, even if two receipts are counted concurrently.
CREATE TRIGGER IF NOT EXISTS maliks_pos_receipt_no_overaccept
BEFORE INSERT ON maliks_pos_receipt_lines
BEGIN
 SELECT CASE
  WHEN (SELECT status FROM maliks_pos_purchase_orders WHERE id=(SELECT po_id FROM maliks_pos_receipts WHERE id=NEW.receipt_id))!='APPROVED'
   THEN RAISE(ABORT,'PO_NOT_APPROVED')
  WHEN (SELECT CAST(json_extract(j.value,'$.quantity_milli') AS INTEGER)
       FROM maliks_pos_purchase_orders p, json_each(p.lines_json) j
       WHERE p.id=(SELECT po_id FROM maliks_pos_receipts WHERE id=NEW.receipt_id)
       AND CAST(json_extract(j.value,'$.stock_id') AS INTEGER)=NEW.stock_master_id) IS NULL
   THEN RAISE(ABORT,'STOCK_NOT_ON_PO')
  WHEN NEW.accepted_milli + COALESCE((SELECT SUM(rl.accepted_milli) FROM maliks_pos_receipt_lines rl
       JOIN maliks_pos_receipts r ON r.id=rl.receipt_id
       WHERE r.po_id=(SELECT po_id FROM maliks_pos_receipts WHERE id=NEW.receipt_id)
       AND r.status!='CANCELLED' AND rl.stock_master_id=NEW.stock_master_id),0)
       > (SELECT CAST(json_extract(j.value,'$.quantity_milli') AS INTEGER)
          FROM maliks_pos_purchase_orders p, json_each(p.lines_json) j
          WHERE p.id=(SELECT po_id FROM maliks_pos_receipts WHERE id=NEW.receipt_id)
          AND CAST(json_extract(j.value,'$.stock_id') AS INTEGER)=NEW.stock_master_id)
   THEN RAISE(ABORT,'RECEIPT_EXCEEDS_ORDER')
 END;
END;
CREATE TABLE IF NOT EXISTS maliks_pos_receipt_audit (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 request_id TEXT NOT NULL UNIQUE,
 receipt_id INTEGER NOT NULL,
 branch TEXT NOT NULL COLLATE NOCASE,
 action TEXT NOT NULL CHECK(action IN ('COUNT','VERIFY','POST','CANCEL','PRINT_LABELS','LABELLED','PACK_CHECK')),
 actor_email TEXT NOT NULL,
 payload_hash TEXT NOT NULL,
 created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS maliks_pos_transfers (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 source_branch TEXT NOT NULL COLLATE NOCASE,
 destination_branch TEXT NOT NULL COLLATE NOCASE,
 lines_json TEXT NOT NULL,
 notes TEXT NOT NULL DEFAULT '',
 status TEXT NOT NULL DEFAULT 'DRAFT' CHECK(status IN ('DRAFT','IN_TRANSIT','RECEIVED','CANCELLED')),
 version INTEGER NOT NULL DEFAULT 1,
 created_by_email TEXT NOT NULL,
 sent_by_email TEXT,
 received_by_email TEXT,
 cancelled_by_email TEXT,
 created_at TEXT NOT NULL,
 updated_at TEXT NOT NULL,
 create_request_id TEXT NOT NULL UNIQUE,
 create_hash TEXT NOT NULL,
 last_request_id TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_maliks_pos_transfer_source ON maliks_pos_transfers(source_branch,id DESC);
CREATE INDEX IF NOT EXISTS idx_maliks_pos_transfer_dest ON maliks_pos_transfers(destination_branch,id DESC);
CREATE TABLE IF NOT EXISTS maliks_pos_transfer_audit (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 request_id TEXT NOT NULL UNIQUE,
 transfer_id INTEGER NOT NULL,
 action TEXT NOT NULL CHECK(action IN ('CREATE','SEND','RECEIVE','CANCEL')),
 actor_email TEXT NOT NULL,
 payload_hash TEXT NOT NULL,
 created_at TEXT NOT NULL
);

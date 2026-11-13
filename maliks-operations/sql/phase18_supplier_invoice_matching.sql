-- Phase 18: supplier invoice capture and three-way verification register.
-- NO AP balance, input VAT claim, GL journal, supplier payment or tax invoice posting.
CREATE TABLE IF NOT EXISTS maliks_pos_supplier_invoices (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 branch TEXT NOT NULL COLLATE NOCASE,
 po_id INTEGER NOT NULL REFERENCES maliks_pos_purchase_orders(id),
 supplier_master_id INTEGER NOT NULL,
 supplier_code TEXT NOT NULL,
 supplier_name TEXT NOT NULL,
 invoice_number TEXT NOT NULL COLLATE NOCASE,
 invoice_date TEXT NOT NULL,
 lines_json TEXT NOT NULL,
 net_cents INTEGER NOT NULL CHECK(net_cents>0),
 declared_vat_cents INTEGER NOT NULL CHECK(declared_vat_cents>=0),
 gross_cents INTEGER NOT NULL CHECK(gross_cents>0),
 status TEXT NOT NULL CHECK(status IN ('MATCHED','EXCEPTION','VERIFIED','CANCELLED')),
 exceptions_json TEXT NOT NULL DEFAULT '[]',
 version INTEGER NOT NULL DEFAULT 1,
 captured_by_email TEXT NOT NULL,
 verified_by_email TEXT,
 cancelled_by_email TEXT,
 created_at TEXT NOT NULL,
 updated_at TEXT NOT NULL,
 create_request_id TEXT NOT NULL UNIQUE,
 create_payload_hash TEXT NOT NULL,
 last_request_id TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_maliks_pos_supplier_invoice_unique
 ON maliks_pos_supplier_invoices(branch,supplier_master_id,invoice_number) WHERE status!='CANCELLED';
CREATE INDEX IF NOT EXISTS idx_maliks_pos_supplier_invoice_branch ON maliks_pos_supplier_invoices(branch,id DESC);
CREATE TABLE IF NOT EXISTS maliks_pos_supplier_invoice_allocations (
 invoice_id INTEGER NOT NULL REFERENCES maliks_pos_supplier_invoices(id),
 stock_master_id INTEGER NOT NULL,
 qty_milli INTEGER NOT NULL CHECK(qty_milli>0),
 PRIMARY KEY(invoice_id,stock_master_id)
);
-- Atomic protection against two concurrent verifications allocating the same GRV quantity.
CREATE TRIGGER IF NOT EXISTS maliks_pos_supplier_invoice_no_overallocation
BEFORE INSERT ON maliks_pos_supplier_invoice_allocations
BEGIN
 SELECT CASE
 WHEN (SELECT status FROM maliks_pos_supplier_invoices WHERE id=NEW.invoice_id)!='VERIFIED'
 THEN RAISE(ABORT,'INVOICE_NOT_VERIFIED')
 WHEN (SELECT COUNT(*) FROM maliks_pos_supplier_invoices i, json_each(i.lines_json) l
       WHERE i.id=NEW.invoice_id AND CAST(json_extract(l.value,'$.stock_id') AS INTEGER)=NEW.stock_master_id
       AND CAST(json_extract(l.value,'$.qty_milli') AS INTEGER)=NEW.qty_milli)!=1
 THEN RAISE(ABORT,'INVALID_INVOICE_LINE')
 WHEN NEW.qty_milli + COALESCE((SELECT SUM(a.qty_milli) FROM maliks_pos_supplier_invoice_allocations a
       JOIN maliks_pos_supplier_invoices i ON i.id=a.invoice_id
       WHERE i.po_id=(SELECT po_id FROM maliks_pos_supplier_invoices WHERE id=NEW.invoice_id)
       AND a.stock_master_id=NEW.stock_master_id),0)
       > COALESCE((SELECT SUM(rl.accepted_milli) FROM maliks_pos_receipt_lines rl
         JOIN maliks_pos_receipts r ON r.id=rl.receipt_id
         WHERE r.po_id=(SELECT po_id FROM maliks_pos_supplier_invoices WHERE id=NEW.invoice_id)
         AND r.status='POSTED' AND rl.stock_master_id=NEW.stock_master_id),0)
 THEN RAISE(ABORT,'INVOICE_EXCEEDS_POSTED_GRV')
 END;
END;
CREATE TABLE IF NOT EXISTS maliks_pos_supplier_invoice_audit (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 request_id TEXT NOT NULL UNIQUE,
 invoice_id INTEGER NOT NULL REFERENCES maliks_pos_supplier_invoices(id),
 branch TEXT NOT NULL COLLATE NOCASE,
 action TEXT NOT NULL CHECK(action IN ('CAPTURE','RECHECK','VERIFY','CANCEL')),
 actor_email TEXT NOT NULL,
 payload_hash TEXT NOT NULL,
 before_json TEXT,
 after_json TEXT NOT NULL,
 created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_maliks_pos_supplier_invoice_audit ON maliks_pos_supplier_invoice_audit(branch,invoice_id,id DESC);

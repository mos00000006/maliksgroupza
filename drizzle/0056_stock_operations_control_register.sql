-- Stock Operations V1. This register DOES NOT alter live POS inventory, GL or catalogue quantities.
-- Apply only once, after checking migration history. Never treat these records as posted stock.
CREATE TABLE IF NOT EXISTS stock_ops_assignments (
  email TEXT NOT NULL COLLATE NOCASE,
  branch_name TEXT NOT NULL,
  duty TEXT NOT NULL CHECK(duty IN ('Receiving / GRV','Stock Controller','DC / Transfers','Stock Manager')),
  assigned_by TEXT NOT NULL,
  assigned_at TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
  PRIMARY KEY(email,branch_name)
);
CREATE INDEX IF NOT EXISTS stock_ops_assignments_branch_idx ON stock_ops_assignments(branch_name,active);

CREATE TABLE IF NOT EXISTS stock_ops_documents (
  id TEXT PRIMARY KEY,
  document_number TEXT NOT NULL UNIQUE,
  client_request_id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK(kind IN ('GRV','ADJUSTMENT','COUNT','SUPPLIER_RETURN','TRANSFER')),
  branch_name TEXT NOT NULL,
  destination_branch TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Draft' CHECK(status IN ('Draft','Submitted','Approved','Rejected','Received')),
  external_reference TEXT NOT NULL DEFAULT '',
  supplier TEXT NOT NULL DEFAULT '',
  supplier_invoice TEXT NOT NULL DEFAULT '',
  driver_name TEXT NOT NULL DEFAULT '',
  time_in TEXT NOT NULL DEFAULT '',
  time_out TEXT NOT NULL DEFAULT '',
  labelled TEXT NOT NULL DEFAULT 'No' CHECK(labelled IN ('Yes','No')),
  labelled_by TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  decision_note TEXT NOT NULL DEFAULT '',
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  submitted_at TEXT NOT NULL DEFAULT '',
  reviewed_by TEXT NOT NULL DEFAULT '',
  reviewed_at TEXT NOT NULL DEFAULT '',
  received_by TEXT NOT NULL DEFAULT '',
  received_at TEXT NOT NULL DEFAULT '',
  last_action_by TEXT NOT NULL,
  UNIQUE(created_by,client_request_id),
  CHECK(kind='TRANSFER' OR destination_branch=''),
  CHECK(kind<>'TRANSFER' OR (destination_branch<>'' AND destination_branch<>branch_name))
);
CREATE INDEX IF NOT EXISTS stock_ops_documents_branch_idx ON stock_ops_documents(branch_name,created_at DESC);
CREATE INDEX IF NOT EXISTS stock_ops_documents_destination_idx ON stock_ops_documents(destination_branch,created_at DESC);
CREATE INDEX IF NOT EXISTS stock_ops_documents_status_idx ON stock_ops_documents(status,created_at DESC);

CREATE TABLE IF NOT EXISTS stock_ops_document_lines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  document_id TEXT NOT NULL REFERENCES stock_ops_documents(id) ON DELETE RESTRICT,
  line_no INTEGER NOT NULL CHECK(line_no>0),
  catalogue_product_id INTEGER NOT NULL,
  product_code TEXT NOT NULL,
  product_name TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'EA',
  document_quantity REAL NOT NULL DEFAULT 0 CHECK(document_quantity>=0 AND document_quantity<=1000000),
  expected_quantity REAL NOT NULL DEFAULT 0 CHECK(expected_quantity>=0 AND expected_quantity<=1000000),
  rejected_quantity REAL NOT NULL DEFAULT 0 CHECK(rejected_quantity>=0 AND rejected_quantity<=1000000),
  reason TEXT NOT NULL DEFAULT '',
  UNIQUE(document_id,line_no),
  CHECK(rejected_quantity<=document_quantity)
);
CREATE INDEX IF NOT EXISTS stock_ops_document_lines_doc_idx ON stock_ops_document_lines(document_id);

CREATE TABLE IF NOT EXISTS stock_ops_audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  document_id TEXT NOT NULL,
  action TEXT NOT NULL,
  actor_email TEXT NOT NULL,
  status_before TEXT NOT NULL,
  status_after TEXT NOT NULL,
  created_at TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS stock_ops_audit_document_idx ON stock_ops_audit(document_id,id);
CREATE TRIGGER IF NOT EXISTS stock_ops_audit_immutable_update BEFORE UPDATE ON stock_ops_audit
BEGIN SELECT RAISE(ABORT,'Stock operations audit is immutable'); END;
CREATE TRIGGER IF NOT EXISTS stock_ops_audit_immutable_delete BEFORE DELETE ON stock_ops_audit
BEGIN SELECT RAISE(ABORT,'Stock operations audit is immutable'); END;
CREATE TRIGGER IF NOT EXISTS stock_ops_lines_no_update BEFORE UPDATE ON stock_ops_document_lines
BEGIN SELECT RAISE(ABORT,'Stock operations lines are immutable. Create a replacement document.'); END;
CREATE TRIGGER IF NOT EXISTS stock_ops_lines_no_delete BEFORE DELETE ON stock_ops_document_lines
BEGIN SELECT RAISE(ABORT,'Stock operations lines are immutable. Create a replacement document.'); END;
CREATE TRIGGER IF NOT EXISTS stock_ops_docs_no_delete BEFORE DELETE ON stock_ops_documents
BEGIN SELECT RAISE(ABORT,'Stock operations documents are immutable'); END;
CREATE TRIGGER IF NOT EXISTS stock_ops_docs_guard_update BEFORE UPDATE ON stock_ops_documents
BEGIN
  SELECT CASE WHEN
    NEW.id<>OLD.id OR NEW.document_number<>OLD.document_number OR NEW.client_request_id<>OLD.client_request_id OR
    NEW.kind<>OLD.kind OR NEW.branch_name<>OLD.branch_name OR NEW.destination_branch<>OLD.destination_branch OR
    NEW.created_by<>OLD.created_by OR NEW.created_at<>OLD.created_at OR NEW.external_reference<>OLD.external_reference OR
    NEW.supplier<>OLD.supplier OR NEW.supplier_invoice<>OLD.supplier_invoice OR NEW.driver_name<>OLD.driver_name OR
    NEW.time_in<>OLD.time_in OR NEW.time_out<>OLD.time_out OR NEW.labelled<>OLD.labelled OR
    NEW.labelled_by<>OLD.labelled_by OR NEW.notes<>OLD.notes
  THEN RAISE(ABORT,'Submitted document fields cannot be changed') END;
  SELECT CASE WHEN NOT (
    (OLD.status='Draft' AND NEW.status='Submitted' AND NEW.created_by=NEW.last_action_by) OR
    (OLD.status='Submitted' AND NEW.status IN ('Approved','Rejected') AND NEW.created_by<>NEW.last_action_by) OR
    (OLD.status='Approved' AND OLD.kind='TRANSFER' AND NEW.status='Received' AND NEW.created_by<>NEW.last_action_by AND NEW.reviewed_by<>NEW.last_action_by)
  ) THEN RAISE(ABORT,'Invalid stock document transition') END;
END;
CREATE TRIGGER IF NOT EXISTS stock_ops_docs_audit_insert AFTER INSERT ON stock_ops_documents
BEGIN
  INSERT INTO stock_ops_audit(document_id,action,actor_email,status_before,status_after,created_at,notes)
  VALUES(NEW.id,'Created',NEW.created_by,'',NEW.status,NEW.created_at,'');
END;
CREATE TRIGGER IF NOT EXISTS stock_ops_docs_audit_change AFTER UPDATE OF status ON stock_ops_documents
BEGIN
  INSERT INTO stock_ops_audit(document_id,action,actor_email,status_before,status_after,created_at,notes)
  VALUES(NEW.id,NEW.status,NEW.last_action_by,OLD.status,NEW.status,datetime('now'),NEW.decision_note);
END;

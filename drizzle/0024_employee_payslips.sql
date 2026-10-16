CREATE TABLE IF NOT EXISTS employee_payslips (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL,
  workspace TEXT NOT NULL,
  pay_period_start TEXT NOT NULL,
  pay_period_end TEXT NOT NULL,
  payment_date TEXT NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'EFT',
  payment_reference TEXT NOT NULL DEFAULT '',
  basic_salary REAL NOT NULL DEFAULT 0,
  overtime_hours REAL NOT NULL DEFAULT 0,
  overtime_rate REAL NOT NULL DEFAULT 0,
  overtime_amount REAL NOT NULL DEFAULT 0,
  allowance_amount REAL NOT NULL DEFAULT 0,
  commission_amount REAL NOT NULL DEFAULT 0,
  bonus_amount REAL NOT NULL DEFAULT 0,
  other_earnings REAL NOT NULL DEFAULT 0,
  gross_pay REAL NOT NULL DEFAULT 0,
  paye REAL NOT NULL DEFAULT 0,
  uif REAL NOT NULL DEFAULT 0,
  pension REAL NOT NULL DEFAULT 0,
  medical_aid REAL NOT NULL DEFAULT 0,
  loan_deduction REAL NOT NULL DEFAULT 0,
  other_deductions REAL NOT NULL DEFAULT 0,
  total_deductions REAL NOT NULL DEFAULT 0,
  net_pay REAL NOT NULL DEFAULT 0,
  notes TEXT NOT NULL DEFAULT '',
  employee_email TEXT NOT NULL DEFAULT '',
  employee_whatsapp TEXT NOT NULL DEFAULT '',
  generated_by TEXT NOT NULL,
  pdf_object_key TEXT NOT NULL DEFAULT '',
  pdf_file_name TEXT NOT NULL DEFAULT '',
  share_token TEXT NOT NULL DEFAULT '',
  share_expires_at TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Issued',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_employee_payslips_employee_period
  ON employee_payslips(employee_id, pay_period_end DESC);

CREATE INDEX IF NOT EXISTS idx_employee_payslips_workspace_period
  ON employee_payslips(workspace, pay_period_end DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_employee_payslips_share_token
  ON employee_payslips(share_token)
  WHERE share_token <> '';

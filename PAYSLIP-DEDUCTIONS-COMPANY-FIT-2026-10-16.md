# Payslip deductions aligned to company payroll — 16 October 2026

Removed from the payslip generator and new generated PDFs:
- PAYE
- Pension / Provident Fund
- Medical Aid

The deductions section now contains only:
- UIF
- Loan / Advance
- Other deductions

Gross pay, total deductions and net pay have been updated accordingly. Existing database columns are intentionally retained for compatibility with previously generated records, but new payslips save those removed fields as their default zero values. No database migration is required.

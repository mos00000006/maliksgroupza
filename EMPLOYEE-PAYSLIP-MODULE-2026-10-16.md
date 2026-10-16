# Employee Payslip Module — 16 October 2026

Adds a confidential payroll/payslip workflow to **Employee Records**.

## Access
Payslip generation and payroll history are restricted server-side to authorised payroll/HR users:
- Owner / Admin
- Developer / Technical Admin
- Human Resource (HR)
- Executive / EXCO with Full company access
- users whose department is HR / Human Resources / Payroll and who have write access

Store managers and ordinary employee-record users do not automatically receive payroll access.

## Employee Records changes
- New **Payslips** tab.
- **Generate payslip** action on an employee profile.
- Payslip history is shown inside the employee file.
- Searchable workspace payroll history.
- Download PDF / WhatsApp / Email actions.

## Payslip capture
Captures:
- pay period start / end
- payment date
- payment method and payment reference
- employee email / WhatsApp
- basic salary
- overtime hours and rate (amount calculated)
- allowances
- commission
- bonus
- other earnings
- PAYE
- UIF
- pension / provident
- medical aid
- loan / advance
- other deductions
- payroll notes

The Hub totals **Gross Pay**, **Total Deductions** and **Net Pay**. PAYE/UIF/statutory amounts are captured payroll values; the Hub does not calculate tax liability.

## Premium PowerBuild PDF
Each saved payslip generates a branded A4 PDF with:
- PowerBuild logo
- employee / branch details
- pay period and payment details
- earnings and deductions tables
- gross pay / deductions / net pay
- payroll notes
- confidential payroll footer

The PDF is stored in the Hub R2 file bucket and remains downloadable from payslip history.

## WhatsApp / Email sharing
- WhatsApp opens the employee chat with a secure PDF download link.
- Email opens the default mail app with a secure PDF download link.
- Share links use a high-entropy token and expire after 7 days.
- **Share PDF file** uses the device Web Share API when supported so the actual PDF file can be shared/attached directly.
- If direct file sharing is not supported, the Hub downloads the PDF for manual attachment.

If Cloudflare Access protects the entire domain, create a public/bypass rule only for `/api/payslip-share/*` so external employees can use the expiring link.

## Database
New migration:
`drizzle/0024_employee_payslips.sql`

## Files added / updated
- `drizzle/0024_employee_payslips.sql`
- `app/employee-payslip-pdf.ts`
- `app/employee-records.tsx`
- `app/api/employees/shared.ts`
- `app/api/employees/route.ts`
- `app/api/employees/payslips/[id]/pdf/route.ts`
- `app/api/employees/payslips/[id]/share/route.ts`
- `app/api/payslip-share/[token]/route.ts`
- `app/api/system-control-centre/route.ts`

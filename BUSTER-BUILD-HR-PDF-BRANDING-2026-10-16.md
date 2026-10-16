# Buster Build HR PDF Branding — 2026-10-16

This update changes **only PDF branding for Buster Build employees** in Employee Records / HR.

## Buster Build payslips
- Keeps the existing Hub payslip layout and data structure.
- Uses the supplied Buster Build logo.
- Uses Buster Build black, yellow and red branding.
- Uses Buster Build document prefix `BB-PAY`.
- Uses Buster Build wording in the confidential payroll footer and payroll record statement.
- Downloads as `BusterBuild_Payslip_...pdf`.

## Buster Build warnings
- Keeps the existing premium Hub warning layout and data structure.
- Uses the supplied Buster Build logo.
- Converts the existing PowerBuild blue treatment to Buster Build black/red while retaining yellow accents.
- Uses warning document prefix `BB-WARN`.
- Uses Buster Build wording in the header/footer.
- Downloads as `BusterBuild_Warning_...pdf`.

## Other employees / workspaces
- Existing PowerBuild styling remains unchanged.
- Branding is selected automatically when the employee/workspace name contains `Buster Build`.

## Files changed
- `app/employee-payslip-pdf.ts`
- `app/employee-warning-pdf.ts`
- `public/buster-build-hr-logo.png`

No database migration is required.

# Employee Warning PDF — Visible Download Button Fix (2026-10-16)

This update makes the warning PDF controls visible directly inside Employee Records.

## Visible PDF controls
- Warnings tab: every warning row now has a yellow **PDF** button.
- Employee profile > Disciplinary History: every warning now has a **Download PDF** button.
- Warning detail popup: a prominent yellow **Download warning PDF** button is shown in the footer.
- New warnings: **Record warning & download PDF** saves the warning and automatically downloads the PowerBuild warning document.

## PDF content
The PowerBuild PDF continues to include the attached PowerBuild logo, employee details, warning details, acknowledgement and signature/date lines for Employee, Manager/Issuer and Witness/HR.

## Files
- `app/employee-records.tsx`
- `app/employee-warning-pdf.ts`
- `public/powerbuild-warning-logo.png`

No database migration is required.

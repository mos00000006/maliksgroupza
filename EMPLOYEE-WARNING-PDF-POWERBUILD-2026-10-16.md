# Employee Warning PDF — PowerBuild branding (2026-10-16)

This update adds a **printable downloadable PDF warning document** to the **Employee Records** module.

## What was added
- When a warning is issued and saved, the Hub now **automatically generates and downloads a PDF**.
- The PDF is styled as a **PowerBuild warning document**.
- The warning document includes the **PowerBuild logo**, all captured warning information, employee details and **signature lines**.
- Existing warning records now also have a **Download PDF** button.

## Document content included
- Employee name
- Employee number
- Workspace / location
- Job title / department
- Supervisor / employment status
- Warning date
- Warning level
- Valid until date
- Issued by
- Status
- Reason for warning
- Full incident / corrective details
- Employee acknowledgement
- Signature lines for:
  - Employee
  - Manager / Issuer
  - Witness / HR
  - Date lines

## Files added / changed
- `app/employee-records.tsx`
- `app/employee-warning-pdf.ts`
- `public/powerbuild-warning-logo.png`

## Notes
- The PDF is generated **client-side** to avoid overloading the worker.
- No database migration is required.

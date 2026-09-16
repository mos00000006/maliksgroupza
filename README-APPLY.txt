POWERBUILD / MALIKS GROUP HUB
EMPLOYEE RECORDS V2 — WARNING REGISTER + HR FILE HISTORY

THIS UPGRADE ADDS
-----------------
1. Dedicated Warning Register
   - View every warning for the selected location
   - Filter Active / Expired / Withdrawn
   - Filter Verbal / Written / Final written
   - Open a warning and see full reason, details, issued by, validity and acknowledgement
   - Warning counts remain visible on each employee

2. Attendance Exception Register
   - Shows Late and Not at work records for the last 180 days
   - Late minutes are retained
   - Absence type, reason and recorded-by are retained

3. HR Records Register
   - Leave
   - Training / Certification
   - Company Asset
   - Employment Change
   - HR Note
   Each record can keep start/record date, end/expiry/return date, status,
   certificate/asset/reference number and detailed notes.

4. Expanded employee master file
   - Residential address
   - Probation end date
   - Contract end date
   - Existing contact, ID, role, department, supervisor, employment type,
     emergency contact and employee notes remain.

5. Expanded employee profile
   - Attendance totals
   - Warning history
   - HR file history
   - Leave / training / asset / employment-change records

6. No automated HR scoring or dismissal recommendations
   - The Hub stores factual records and history only.

FILES TO REPLACE
----------------
app/employee-records.tsx
app/api/employees/route.ts
app/api/employees/shared.ts

IMPORTANT
---------
Do NOT replace app/page.tsx with an older file for this update.
Keep your current page.tsx and current deploy.yml, including the Cloudflare deploy-order fix.

DATABASE
--------
No manual D1 migration is required.
The API creates employee_hr_records automatically and safely adds these missing
employee columns when first opened:
- residential_address
- probation_end_date
- contract_end_date

DEPLOY
------
1. Replace the 3 files above in GitHub.
2. Commit and push.
3. Let GitHub Actions deploy.
4. Open Employee Records and check the tabs:
   Employees | Warnings | Attendance Exceptions | HR Records

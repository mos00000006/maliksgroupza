POWERBUILD / MALIKS GROUP HUB
EMPLOYEE RECORDS + ATTENDANCE + WARNINGS PATCH

WHAT THIS ADDS
--------------
1. New sidebar section: Employee Records.
2. Employee master file:
   - Employee number
   - First name / surname
   - ID or passport number
   - Phone / email
   - Job title / department
   - Start date
   - Employment type
   - Supervisor / manager
   - Employment status
   - Emergency contact + phone
   - Employee-file notes
3. Daily attendance buttons on every employee:
   - At work
   - Not at work
   - Late
4. Late opens a form requiring the number of minutes late and an optional reason.
5. Not at work records absence type and reason.
6. Attendance history is retained per employee.
7. Disciplinary warnings:
   - Verbal
   - Written
   - Final written
   - Warning date, reason, details, issued by, valid-until date, acknowledgement
   - Total warning count and active warning count shown on the employee
   - Active warning may be withdrawn
8. Employee profile shows attendance totals and warning history.
9. New Quick Action: Staff Attendance.
10. D1 tables create automatically on first use. No manual migration required.

PERMISSIONS
-----------
- Owner / Admin, Developer / Technical Admin, Executive / EXCO:
  company-level employee records subject to existing workspace access.
- Regional Manager and Store Manager:
  employee files, attendance and warnings for their accessible workspaces.
- Department Manager:
  employee-record visibility and attendance marking, but cannot add/edit employee files
  or issue warnings.
- HR / Human Resources / People department users:
  employee file management based on their existing workspace access.
- Other Hub members do not receive the Employee Records navigation item.

PRIVACY / HR CONTROL
--------------------
Employee ID numbers and disciplinary history are sensitive personal information.
The API enforces role/workspace access. Users who may view attendance but may not manage
employee files receive masked ID numbers.

FILES TO ADD / REPLACE
----------------------
REPLACE:
  app/page.tsx
  app/globals.css

ADD:
  app/employee-records.tsx
  app/api/employees/shared.ts
  app/api/employees/route.ts

DEPLOYMENT
----------
1. Extract this ZIP.
2. Copy the files into the same paths in the GitHub repository.
3. Commit and push.
4. Allow the normal GitHub Actions / Cloudflare deployment to finish.
5. Open Employee Records in the Hub.
6. Select a location and add the first employee.
7. Test At work, Not at work and Late.
8. Open the employee profile and test Issue warning.

No new GitHub secret is required.
No Touch365 connection is used.

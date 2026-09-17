POWERBUILD / MALIKS GROUP HUB
EMPLOYEE LIFECYCLE & ATTENDANCE HISTORY V4

WHAT THIS ADDS
- Full 12-month attendance register (At work, Late, Not at work)
- Employee profile attendance analytics: attended this week, this month, absent this month, late this month, year attendance
- Month-by-month attendance history for the last 12 months
- Dedicated Leave Requests register with Requested / Approved / Declined / Cancelled / Taken statuses
- Leave request history inside each employee file
- Dedicated Company Property register
- Uniform / PPE issue records (quantity/size can be captured)
- Company Vehicle allocations (registration/fleet reference)
- Company Phone / SIM allocations (IMEI/mobile/SIM reference)
- Other company assets
- Mark company property Returned or Lost / Damaged while keeping the permanent history
- Employee profile quick buttons for Leave Request, Uniform/PPE, Vehicle and Phone/SIM
- Existing warnings, HR notes, training, employee master files and HR role restrictions are preserved
- Existing full-company attendance notifications are preserved

FILES TO REPLACE
app/employee-records.tsx
app/api/employees/route.ts

NO NEW GITHUB SECRET IS REQUIRED.
NO MANUAL D1 MIGRATION IS REQUIRED.
The existing employee_hr_records table stores leave/property lifecycle records.

DEPLOY
1. Replace the two files in GitHub.
2. Commit and push.
3. Let GitHub Actions deploy.
4. Open Employee Records and test one employee: attendance, leave request, uniform issue, vehicle allocation and phone/SIM issue.

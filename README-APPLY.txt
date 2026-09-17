POWERBUILD / MALIKS GROUP HUB
EMPLOYEE RECORD ADD BUTTONS + MOBILE UI FIX V5

WHAT THIS FIXES
---------------
1. Company Property tab now has visible buttons:
   + Uniform / PPE
   + Vehicle
   + Phone / SIM
   + Other Asset
   Clicking one first opens a clean employee selector, then the issue/allocation form.

2. HR Records tab now has a visible + Add HR record button.
   Choose the employee first, then select Training / Certification, Employment Change, HR Note, etc.

3. Leave Requests tab now has + New leave request.

4. Mobile Quick button no longer remains over the Add Task modal.
   As soon as Add Task is opened, the floating Quick button disappears.

5. Mobile sidebar is now a full-height drawer that scrolls as ONE surface from top to bottom.
   You can swipe up/down to reach every Hub section, AI Sidekick, Access and the user profile.
   A visible mobile close button and scrollbar have also been added.

FILES TO REPLACE
----------------
app/employee-records.tsx
app/page.tsx
app/mobile-improvements.css

No new database migration.
No new GitHub secret.
No API file change is required.

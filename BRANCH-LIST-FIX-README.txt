COMPANY HUB — VEHICLE SIGN-IN BRANCH LIST FIX

Copy the app and tests folders into the Company Hub repository root,
replace the included files, commit and redeploy. No new migration.

Cause: the driver sign-in dropdown listed only branches already configured
for attendance QR. If Sungate was the only configured branch, it was the
only option even when other active company workspaces existed.

The sign-in dropdown now lists all active Company Workspaces. Staff still
need an approved attendance registration and their PIN for the chosen branch.
This does not create staff registrations or change manager branch permissions.
If a branch is missing entirely, first add/activate it in Company Workspaces.
If sign-in is declined, HR must approve/link the employee's staff registration
at the selected branch. Do not use another employee's number or PIN.

The private manager Assigned branch dropdown remains limited to the branches
assigned to that Hub account. Change authorised assignments in Access / Team
Members if needed; this public dropdown fix does not widen private access.

Validated with the SQL/API integration tests: an active branch without an
attendance QR setup now appears alongside Sungate. Vehicle tests and focused
lint passed. No live deployment was performed.

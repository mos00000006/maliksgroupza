COMPANY HUB — VEHICLE DRIVER APPROVAL

Apply over the current Vehicle QR Logbook patch. Retains the all-active-branches
sign-in fix. Copy folders into the Company Hub repository root, commit and
redeploy. Run your normal remote D1 migrations step for new migration:
  drizzle/0044_vehicle_driver_approvals.sql
No live deployment or migration was performed while preparing this patch.

WHERE THE BUTTON IS
Employee Records -> Vehicle QR logbook -> select the employee's assigned
staff branch -> Authorised Drivers. This section is directly beneath the
page heading, above the vehicle cards. It is not hidden in a menu.
Click Approve driver beside the employee's name, then confirm.
Approved staff show Revoke vehicle access instead.

Only a manager/HR with existing employee-file management permission for that
staff branch can approve or revoke. Other permitted viewers can see status.
The list contains active employees with approved, linked attendance accounts
in that branch. If it is empty, approve/link the attendance registration first
in Employee Records -> Branch QR clock in / out -> Manage registrations &
staff access. Staff use that same employee number and PIN on the vehicle QR.

IMPORTANT CHANGE
No employee is automatically authorised by this migration. Existing staff
must receive this separate approval before NEW vehicle check-outs. A driver
who already has a car can still return it after their vehicle approval is
revoked. Normal employment/attendance/session checks still apply.

Approval allows company vehicle check-outs while the employee remains in the
staff branch that granted it; it does not grant access to the Hub or expand
manager branch permissions. On a staff branch transfer, the new branch must
approve again. Check company driving requirements before authorising someone.
Approval status, reviewing Hub email and time are retained, with a separate
append-only audit record for each grant or revocation. Previous trips remain.

The driver's signed-in page shows a clear approval-required message until
approved. Refresh status after manager approval. New check-outs enforce this
on the server and inside the database write, not only by hiding a button.

Validation: production build, focused lint and real-SQL API checks, including
approval required, authorised branch controls, revocation and safe returns,
reviewer audit, existing vehicle lifecycle/odometer/concurrency/history rules.
Browser QA checked the visible Authorised Drivers section and Approve driver
button, the approval-required phone screen, approval then successful checkout,
return, and desktop/mobile layout. No live employee data was used.

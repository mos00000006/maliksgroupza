COMPANY HUB — BRANCH QR CLOCK IN / OUT

Apply this patch to COMPANY HUB (maliksgroupza), not the BusterBuild sales app.
Copy the ZIP contents into the repository root, retaining the folder paths.
Commit and deploy through your usual workflow.

Includes the corrected assessment build installer so the previous exact-line
prebuild failure does not return. No full Worker or Hub page is overwritten.
The assessment prebuild step also runs the attendance installer automatically.
If you removed the assessment prebuild script, run this once before building:
  node scripts/install-branch-attendance.mjs

Run your usual remote D1 migrations step. New migration:
  drizzle/0042_branch_qr_attendance.sql
Previous migrations, including 0041 if still pending, remain necessary.
No remote migration or deployment was run while preparing this patch.

WHERE TO START
Employee Records -> select the branch -> expand Branch QR clock in / out.
Or open /attendance on your Company Hub domain with your manager / HR account.
1. Expand Branch QR setup & printable poster.
2. Set the actual branch coordinates. “Use my location” is for when you are
   physically at the branch. Default radius 300 m; adjust 50–2,000 m.
3. Save setup, then Print QR poster. Put it at the staff entrance.
4. Staff scan, choose First time? Sign up, enter employee number, name, phone,
   position and a private 6–12 digit PIN, and acknowledge the attendance notice.
5. A permitted manager / HR reviews the registration in this branch's panel.
   Check employee number and the matching employee file name. Approve links
   the existing record; if none exists, the confirmation explicitly authorises
   creating a record from the registration. Do not approve an unverified person.
6. Staff tap Refresh status or reopen their QR page, then Clock In. They can
   Start Break, End Break and Clock Out. Their own phone remembers them for
   30 days. On another phone they sign in with employee number and PIN.

WHAT MANAGERS SEE
The branch panel refreshes every 15 seconds while expanded. It shows pending
registrations, latest recorded state, and date-filtered clock events in SAST.
Approval and new clock entries refresh the surrounding Employee Records view.
QR entries update the existing daily attendance table so employee files and
attendance history show them. A worked day remains “At work” after clock-out;
the dedicated QR panel distinguishes Clocked out / At work / On break.
Existing manually recorded attendance decisions are preserved. Use the normal
attendance tools for payroll corrections; raw clock events remain an audit trail.
The Employee Records server's “today” date is also aligned to South Africa.
A missed clock-out stays visible as the last recorded state and time. Staff
must clock out before starting their next shift; this is not automatic absence
classification, scheduled lateness calculation or a payroll engine.

ACCESS AND LOCATION
Employees do not get a Hub account or access to other employees' records.
Existing Employee Records roles and branch assignments govern private access.
Manager/HR file-management permission is required for setup, approvals, PIN
reset and disabling an attendance registration. Resetting a PIN signs out all
of that employee's attendance devices. Replacing a QR invalidates the old
poster and signs out all attendance devices for that branch.
Inactive, transferred, suspended, resigned and terminated employee records
cannot clock through their old registration. Update employment records and
explicitly disable attendance registrations when appropriate.

At clocking only, the phone requests location. Outside radius, inaccurate
(accuracy worse than 100 m), denied or unavailable location entries are saved
and clearly flagged for manager review, so a phone issue does not silently
lose an employee's time. Review these before payroll. A QR, PIN or phone GPS
cannot prove attendance: a printed QR can be copied and phone location can be
spoofed. No background tracking. Exact phone latitude/longitude are not stored;
event time, location category, distance and accuracy are stored for review.
Private PINs use salted PBKDF2, sessions are hashed in the DB and use secure
HttpOnly cookies; login/registration attempts are limited. Do not share PINs.
Publish attendance privacy/retention rules through HR and provide a supervised
alternative for staff without suitable phones. This patch does not impose a
new company-wide retention period or remove existing personnel records.

CLOUDFLARE ACCESS
The printed QR and attendance API must use your existing public customer QR
exceptions. Public paths are restricted in the Worker to:
  /p/attendance/<64 hexadecimal characters>           GET/HEAD
  /api/public-price-tags/attendance/<same token>       GET/POST/HEAD
Keep /attendance and /api/attendance PRIVATE. Never bypass the whole Hub.
If your Access configuration already bypasses /p/* and
/api/public-price-tags/*, it also covers these new paths. Otherwise add only
these public attendance path prefixes to the existing public QR application.
Staff attendance uses its own PIN/session, not Cloudflare staff login.
Use HTTPS in production; phone geolocation and secure cookies require it.

VERIFICATION
Production build; focused lint; server tests for scope, approval, session/PIN,
CSRF, clock transitions, duplicate submissions, inactive/transferred employee
blocks, manual attendance preservation, SAST dates, QR rotation and rate limits.
Browser QA used the actual UI and API with local test DB/auth bindings: mobile
registration, manager approval, remembered session, geolocation, all four clock
actions, private-access denial, responsive layout and printable poster.
Printed test QR was decoded successfully. No live employee data was used.

The bundled QR generator is qrcode-generator 2.0.4 by Kazuhiko Arase (MIT).
It runs locally in the browser; no third-party QR service receives staff data.

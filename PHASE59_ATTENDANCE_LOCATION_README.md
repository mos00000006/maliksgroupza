# Phase 59 — Verified Staff Location Review (PowerBuild / Maliks Group Hub)

## Goal
Prevent staff from clocking attendance merely by photographing/sharing a branch QR code and using it remotely. Show where the mobile device reported being when the clock action was submitted, while keeping location data within the authorised branch management/HR workflow.

## Changed files
- `app/api/attendance/shared.ts` — geofence calculation, 150m maximum distance and 60m GPS-accuracy threshold.
- `app/api/public-price-tags/attendance/[token]/route.ts` — server-side location **enforcement**, separate rejected-attempt audit and GPS point on accepted clock event.
- `app/api/attendance/route.ts` — branch-scoped manager location-review results; remove precise location from Viewer response.
- `app/attendance/attendance-board.tsx` — last action + "Clocked in at [branch]", GPS coordinates, map link and rejected-attempt flag.
- `app/attendance/attendance-panel.tsx` — actual scan location in attendance history and rejected attempts table with map links; branch geofence setup.
- `app/attendance/attendance.module.css` — last-action/exception styling.
- `app/p/attendance/[token]/staff-clock.tsx` — require phone GPS before submitting; clear rejection message and explicit location notice.
- `drizzle/0070_attendance_location_verification.sql` — additive schema migration (existing attendance retained).
- `tests/branch-attendance.test.mjs` — expectations for enforcement, GPS records and permissions.

## Set up from GitHub Codespaces
1. Upload this ZIP into the ROOT of the `maliksgroupza` repository (NOT inside `maliks-operations`).
2. In the Codespaces terminal at `/workspaces/maliksgroupza`, run:
   ```bash
   unzip -o PowerBuild_Hub_Phase59_Verified_Attendance_Location_Review.zip
   npm test
   ```
3. Only if `npm test` passes:
   ```bash
   git add app/api/attendance/shared.ts 'app/api/public-price-tags/attendance/[token]/route.ts' app/api/attendance/route.ts app/attendance/attendance-board.tsx app/attendance/attendance-panel.tsx app/attendance/attendance.module.css 'app/p/attendance/[token]/staff-clock.tsx' drizzle/0070_attendance_location_verification.sql tests/branch-attendance.test.mjs
   git commit -m "Verify QR attendance geofence and show reported scan points"
   git push origin main
   ```
4. Use GitHub Actions **Deploy Maliks Group Hub**. This existing deployment workflow applies Drizzle/D1 migrations before deployment. The migration MUST complete successfully before the new API starts receiving clock requests.
5. At each store, visit **Employee Records → Attendance → Branch QR setup**, verify the latitude/longitude while physically on site, set the radius to 75–100m (50–150m allowed), save, and run one legitimate test and one test outside the geofence.

## Expected behaviour
- A recent precise GPS reading is requested only when a staff member taps a clock action; the app does not continuously track employees.
- A valid inside-branch scan updates attendance, with manager-only GPS coordinates and "View scan on Google Maps".
- An outside, inaccurate, or unavailable GPS scan is **rejected** with HTTP 403. The staff member's status and `employee_attendance` record are NOT changed.
- Rejected attempts appear in authorised **Location Review**, including the reported GPS point where available. They are not successful payroll records.
- A screenshot of the QR opened at home cannot clock an employee in unless the phone reports a valid branch location. Browser/device location can be spoofed, so this is a practical control, not a guarantee against intentional GPS manipulation.
- The saved GPS point is a coordinate, not a verified postal street address. Clicking the Google Maps link shows the reported position; automatic street addresses require a separately approved reverse-geocoding provider.
- The server caps clocking range at 150m even if a legacy branch setup is still set to 300m or more. This can affect very large buildings/sites; verify the branch pin and employee travel footprint before rollout.
- Employees with GPS disabled, inaccurate indoor GPS, or legitimate off-site duties need an authorised manual attendance correction procedure. Do not treat a rejected scan as proof of misconduct.

## Security / privacy
- Only managers/HR with attendance review access see GPS coordinates and rejected attempts. Viewer responses redact precise coordinates and omit rejection logs.
- Inform employees about location-at-clock collection (the staff registration notice is updated). Respect applicable South African privacy/employment rules; approve a defined retention period for GPS evidence and a method to purge it. This patch does not configure automatic data retention/purging.
- A printed QR can still be photographed or shared; it is the **server-side GPS check**, not the QR picture itself, that blocks normal remote clocking. Deliberate GPS spoofing or credentials sharing still requires additional controls.

## Local checks
- All six edited TS/TSX files passed TypeScript syntax parsing.
- Additive SQLite schema migration applied cleanly in a simulated database.
- Six backend integration checks passed in the isolated test harness: outside, missing, inaccurate, valid, manager review, Viewer redaction.
- The **full** project `npm test` / live branch-phone test has not been executed in this environment; GitHub Actions and one real test device are required.

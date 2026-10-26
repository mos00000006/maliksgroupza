COMPANY HUB — VEHICLE QR LOGBOOK

Apply to COMPANY HUB (maliksgroupza), on top of the existing branch QR
attendance patch. This does not go into the BusterBuild sales app.

Copy the ZIP contents into the repository root, preserving folders, then
commit and redeploy using your usual workflow. The attendance installer now
also calls the vehicle installer automatically. If that prebuild hook is not
present in your package.json, run this once before building:
  node scripts/install-vehicle-logbook.mjs

Apply the normal remote D1 migrations step. New migration:
  drizzle/0043_vehicle_qr_logbook.sql
Migration 0042 and the approved staff attendance registrations are required.
No production migration or deployment was performed while making this patch.
No new npm dependencies. Existing QR generator from the attendance patch reused.

WHERE TO FIND IT
Employee Records now has a blue “Vehicle QR logbook” link at the top.
The dedicated manager space is /vehicles on your Company Hub domain.
Private APIs use the same Employee Records role and branch permissions.
Vehicle creation, availability, QR replacement and manager returns require
employee-file management permission for the vehicle's home branch.

SETUP AND DRIVER FLOW
1. Manager opens Vehicle QR logbook, chooses the assigned home branch, expands
   Add a company vehicle, and enters registration, model/name and odometer.
2. Select QR sticker on that car, then Print QR sticker. Put it in the vehicle.
3. Driver scans with their phone camera and opens the link. They select the
   branch where their staff attendance registration was approved and sign in
   with employee number and their existing private PIN. No new registration.
4. Driver chooses the branch they are working at, enters destination, purpose,
   actual starting kilometres and any existing damage, then taps Take Vehicle.
5. Hub shows the current driver, working branch, departure time and trip details.
6. On return, scan the same sticker, enter ending kilometres and notes/faults,
   then tap Return Vehicle. Trip distance and history are saved.

The driver session lasts 8 hours and works across vehicle QRs. On expiry they
can sign in again and return their active car. A PIN reset invalidates existing
vehicle sessions. Pending/disabled staff, inactive or transferred employee
records cannot use the old registration. Return rights belong to the driver
who checked out the car. If unavailable, the home-branch manager can record a
Manager return with ending kilometres and a required reason; their Hub email
is retained in the trip audit. This does not silently assign a different driver.

DASHBOARD AND HISTORY
Current cards distinguish In use, Available and Unavailable, with filters and
search. Current status refreshes every 15 seconds while the page is open.
Today, Yesterday and date selection show trips overlapping that South African
calendar day, including overnight trips. History is visible to permitted
managers of the recorded home branch and the selected working branch.
History is capped at 500 trips per selected day; driver self-history shows
15 recent trips in the scanned car. These are display limits, not deletions.

One car and one approved attendance account may each have only one open trip.
Database uniqueness guards simultaneous check-outs. Whole kilometre readings
must be valid and cannot go backwards. Starting readings can exceed the last
saved reading, to accommodate mileage outside a recorded trip.
A manager can mark a vehicle unavailable while it is out; the driver can still
return it. Making a car unavailable prevents new check-outs. QR replacement is
blocked during an active trip and requires a new printed sticker afterwards.
Fault/damage notes are retained for manager review. They do not automatically
change availability or constitute a maintenance inspection.

QR AND ACCESS
The public driver page is:
  /p/vehicle/<64 hexadecimal characters>
The corresponding public API is:
  /api/public-price-tags/vehicles/<same token>
These are strictly scoped by the Worker; driver actions require a staff session.
Before sign-in only the vehicle label/registration and branch names appear.
Other drivers' identity or trip details are not exposed on the scanned page.
Keep /vehicles and /api/vehicles PRIVATE behind the normal Hub login.

If your existing Cloudflare Access customer QR exceptions already cover /p/*
and /api/public-price-tags/*, these new routes are covered. If a scan still
shows Cloudflare Access, extend only those public QR prefixes for this feature;
never bypass the entire Hub or the private vehicle dashboard/API.
HTTPS is required for the secure staff session cookie.

This is a staff-declared vehicle-use logbook. It is not continuous GPS tracking,
licence validation, physical key control, vehicle insurance or driving approval.
Managers must confirm authorised drivers, faults and missing returns through
company procedures. This patch does not set a new HR/fleet retention policy or
delete existing personnel records. No driver's licence number is collected.

INTEGRATION
The installer adds a public-path guard and response wrapper while retaining
the existing Worker fetch flow, security headers, all QR exemptions and cron.
It adds a small link component to Employee Records and excludes public vehicle
pages from the opening splash. It does not ship a replacement whole Worker,
root Hub page, Employee Records source file or attendance dashboard design.
First-run source backups use .before-vehicles. The installer is repeat-safe
and supports --check without writes.

VERIFICATION
Production build passed. Focused feature lint passed without errors. All 11
available local tests passed, including real SQL tests of vehicle lifecycle,
concurrent check-outs, private data, branch scope, odometers, overnight history,
PIN reset revocation, manager returns, CSRF and repeat-safe integration.
Browser checks used the actual UI/API with local test DB/auth bindings: manager
creation and QR printing, staff login, checkout, branch selection, return and
fault notes, remembered session, history and desktop/mobile layouts. Printed QR
was decoded successfully from the single-page sticker PDF. No live employee
data was used. Full-repository TypeScript checking still reports pre-existing
errors elsewhere; the new vehicle files had no diagnostics with generated
Cloudflare types. No production deployment or real-car scan has been tested.

HR + CANDIDATE ASSESSMENTS WITH CAMERA RECORDING
COMPANY HUB ONLY — no BusterBuild Sales App patch

INSTALL
Apply after the existing staff training, style and layout-fix patches. Extract this ZIP into the Company Hub repository, keeping the directory structure.

1. Apply database migration 0041_candidate_assessments.sql through the existing migration workflow:
   npm run db:migrate:production
2. Build and deploy normally. The included package.json adds a prebuild hook that runs scripts/install-assessment-centre.mjs automatically before npm run build. Dependencies are unchanged. If your package.json has custom changes, retain them and merge the prebuild script instead.
3. Refresh or reopen the Hub after deployment.

The installer carefully updates the existing Worker, Hub sidebar and launch splash, retaining existing product/combo/staff QR rules. It adds exact candidate-route exceptions, permits the camera only on candidate test pages, keeps microphone permission blocked, adds media playback support, and attaches retention cleanup to the existing hourly schedule. It keeps first-run .before-assessments backups. Running it again is safe. If an integration anchor differs, it stops before writing changes so the current file can be reviewed instead of overwriting unrelated work.

Manual integration check (optional):
   node scripts/install-assessment-centre.mjs --check
Manual integration if not using npm build lifecycle hooks:
   node scripts/install-assessment-centre.mjs

WHERE TO OPEN
Private HR/reviewer area:
   https://maliks-group-hub.moyanamoses006.workers.dev/assessments
Reusable candidate station for a dedicated assessment PC:
   https://maliks-group-hub.moyanamoses006.workers.dev/p/assessment

ACCESS
Only active Hub users with access_scope exactly Full company, or role exactly Human Resource (HR), may open training administration, assessment records or recordings. Full company and HR accounts can review all retained assessment recordings. Existing Viewer/Read only restrictions on writing remain; those accounts may view where their scope permits.

Ordinary assigned-workspace accounts cannot read the review API or recordings. Applicants do not receive a Hub account. HR creates a high-entropy private candidate link that permits one attempt, expires after 24 hours and cannot read recordings or private results. Ticket and recording-session secrets are stored hashed on the server.

Existing Cloudflare Access public bypasses for /p/* and /api/public-price-tags/*, used by the product QR pages, must remain in place. Do NOT make /assessments or /api/assessments public. If a candidate sees Cloudflare sign-in, check the existing public-path bypasses; do not give applicants HR credentials.

USING THE ASSESSMENT PC
1. HR signs in to /assessments on a separate trusted browser/profile.
2. Create a test with full name, position applied for/current role, optional email/phone/reference, candidate/staff type, brand, topic and retention period.
3. Copy the generated private link.
4. On the dedicated test PC, open a Chrome or Edge Guest browser window at /p/assessment. Set that page as its reusable start page or desktop shortcut if useful. Paste the candidate link there.
5. The candidate checks their name/position, reads the recording notice, confirms their name and explicitly agrees before allowing the camera and starting.
6. The camera preview and recording indicator remain visible. Video only is captured; no audio or screen capture. Fullscreen is optional and does not lock the operating system.
7. The candidate completes the test and waits until the saved confirmation appears. The camera stops when the attempt ends. They can then return to the assessment station for the next candidate.

Never leave an HR-signed-in browser/profile for an applicant to use. Use a Guest profile or separate supervised PC. A refreshed/closed candidate test cannot be resumed using only its link; HR must review the interruption and create a new attempt if appropriate.

TESTS AND RESULTS
The existing reviewed 36-question bank is reused. Department tests contain six questions; mixed tests contain 18 questions, three per department. Order and choices are shuffled. The limit is 15 minutes and the score threshold is 80%. Grading uses the server's saved question/answer snapshot.

All NEW scored tests use the camera-recorded assessment centre. The old training API no longer creates or submits unfinished camera-free tests. Existing completed staff results remain readable. Practice quizzes remain available to authorised Full company and HR accounts without camera recording.

Applicant results, applied-for position, contact details, recording consent time, test times, topic scores, answers and available session events are shown to authorised reviewers. A score does not automatically make a hiring decision.

WATCHING RECORDINGS
Open Review on an assessment and click Load camera recording. Parts upload about every ten seconds, so footage can be viewed during the test after the first part arrives. Refresh recording to include newer parts. This is uploaded footage with a delay, not an instantaneous live-call stream. The complete saved recording can be played afterward.

Recordings are stored in the existing private R2 BUCKET and served only through the authorised review API. No public recording links are generated. Keep that bucket private. The review page creates a temporary local playback URL and revokes it when the review closes.

Camera loss, recorder errors, prolonged missing video, recording pauses and upload failures stop the normal test flow and may mark the attempt interrupted. Tab changes and fullscreen exits are recorded when reported by the browser. Stale running attempts are marked interrupted by the hourly task after the time limit. These signals and camera footage support human review; they do not establish that someone cheated or that a test was cheat-free. There is no face recognition, automated phone detection, identity verification or operating-system lockdown.

If saving fails, keep the candidate page open and use Retry upload & end attempt with the supervisor. Already uploaded footage remains private for review. Pending local parts cannot be recovered after the page closes. No attempt is marked complete when no camera part was saved.

RETENTION AND DELETION
Choose 7, 14 or 30 days when creating the record; default is 14. The date is shown in the candidate notice and reviewer details. At that deadline the APIs deny access immediately. The existing hourly Worker schedule deletes expired candidate details, answers, results and recording parts in bounded batches of ten records, retrying on a later run if storage cleanup fails. Physical deletion can therefore occur after the displayed deadline; the record is already inaccessible through the APIs.

An authorised writer can end an active assessment, then permanently delete the record and its footage earlier. Original historical training results use their existing storage policy and are not removed by this new-record cleanup. No catalogue, price tag, staff ID or employee-record data is deleted by this feature.

Use the company's approved recruitment and privacy process. The product notice offers candidates the option to stop and ask the supervising HR person about an alternative assessment.

TECHNICAL / VALIDATION
Requires HTTPS, a working webcam, browser permission, and current Chrome or Edge with WebM MediaRecorder support. Video targets 640x480 at 15fps and 300 kbps. A session is bounded to 100 parts, each up to 2 MiB, and 64 MiB total. No new service bindings or runtime dependencies are required.

Local validation: production build, original authentication/render checks and focused assessment/training tests passed (12 tests total). Browser testing used a simulated camera feed: consent before capture, video-only recording, real WebM uploads, playback while running and after submission, Full company and HR access, candidate denial for private footage, interruption handling, station entry, recorded-test routing, both brands and mobile widths. No live employee records or production database were changed. New feature files have no TypeScript diagnostics with generated Cloudflare types; the repository-wide type check still reports existing errors elsewhere. Focused lint has no errors and one cleanup-counter warning.

References for maintainers:
https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder
https://www.justice.gov.za/legislation/acts/2013-004.pdf

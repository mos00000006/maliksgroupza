BRANCH ATTENDANCE DASHBOARD — COMPANY HUB STYLE UPDATE

Apply to Company Hub, on top of the Branch QR Clock In / Out patch.
Copy the app folder into your repository root, replacing the included files.
Commit and redeploy through your normal workflow. No new migration is needed.

Open Employee Records -> choose a branch. The attendance dashboard now opens
by default. The same design also appears at /attendance.

New design:
- PowerBuild blue/yellow and BusterBuild charcoal/gold headers.
- At work, Clocked out, On break, Not clocked yet and To approve counters.
- Staff cards with initials, name, position, employee number and status.
- First clock-in and latest clock-out times for the selected date (SAST).
- Staff search and clickable status filters.
- Location review and previous-day status notices.
- Separate collapsible management controls for approvals, PINs and disabling.
- Responsive layouts for desktop and phones.

The cards' status is the last recorded action. Their clock times refer to the
date selected below the cards. Not clocked yet means no clock history; it is
not an absence decision. Existing attendance and approval rules are preserved.

Verified: production build, focused lint, browser checks using the actual UI
and full Hub styles: status cards/counts, filtering, search, management controls
and mobile layout. No live employee data was used.

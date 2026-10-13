MALIKS GROUP HUB - BACKGROUND APP BADGE V3

Replace these files in the GitHub project using the same paths:

app/api/team/shared.ts
app/api/push/shared.ts
public/sw.js

What this adds:
- Each task-assignment push now contains the recipient's TOTAL unread task count.
- The service worker updates the installed PWA app badge from the push event, even while the Hub window is closed, where the OS/browser supports PWA numeric badges.
- The system notification includes the current unread task count.
- Existing in-app Inbox count and foreground badge synchronization remain unchanged.
- Service-worker cache bumped to v9 so devices pick up the new worker.

Platform note:
- Installed PWA + notification permission are required for background push/badging.
- iOS/iPadOS Home Screen PWAs and supported Windows/macOS Chrome/Edge PWAs can use numeric Badging API where supported.
- Android Chromium PWAs use the Android launcher notification-badge system; the launcher controls whether it shows a number or dot.

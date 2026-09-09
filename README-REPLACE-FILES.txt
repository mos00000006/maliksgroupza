MALIKS GROUP HUB — AUTOMATIC TASK NOTIFICATIONS V2

Replace the matching files/folders in your GitHub project with the files in this patch, then commit and push.

What this version does:
- New assigned tasks create the normal Hub Inbox notification.
- New task notifications pop up automatically inside the Hub.
- Inbox shows an unread number badge.
- Installed PWA/app icon shows the unread count where the device/browser supports app badges.
- Phone/desktop push notifications are supported.
- There is NO separate "Enable phone alerts" button.
- If notification permission has not yet been decided, the first normal tap/click/key press after the user signs into the Hub triggers the browser/phone's one-time system notification permission prompt.
- Once the user approves, push alerts register automatically on that device.
- If the device/browser has already granted permission, registration happens automatically on load.

Important:
The operating system/browser itself controls its Allow/Block notification permission dialog. A website/PWA cannot bypass that system permission.

No additional npm package is required by this patch.

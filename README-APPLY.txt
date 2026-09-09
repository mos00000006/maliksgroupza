POWERBUILD HUB — SAFARI HOME SCREEN NOTIFICATIONS V4

Replace these files in the GitHub project:
- app/page.tsx
- app/layout.tsx
- public/manifest.webmanifest
- public/sw.js

Then commit and push.

This version is specifically hardened for Safari/iPhone Home Screen web-app use:
- standalone Home Screen manifest identity
- Apple web-app metadata and touch icons
- service worker registered even before notification permission
- one-time notification prompt from the user's first normal interaction
- background Web Push subscription and automatic resubscription
- unread task count sent to the Home Screen/app badge
- badge maintained when the Hub is open and when a push arrives while closed
- unread count retained in the browser title as a desktop fallback

Important platform rule: iOS only displays background notifications and a Home Screen badge after its system notification permission is granted to the Home Screen web app. A plain Safari bookmark/Shortcut cannot bypass that OS rule.

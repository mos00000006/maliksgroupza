POWERBUILD / MALIKS GROUP HUB - MOBILE QUICK ACTIONS PATCH

REPLACE THESE FILES IN GITHUB:
1. app/page.tsx
2. app/globals.css
3. app/mobile-improvements.css

THEN COMMIT AND PUSH.

WHAT THIS ADDS
- Floating "+ Quick" button on phones / Home Screen app.
- Compact "Quick" button on desktop.
- PowerBuild-styled bottom sheet with quick actions:
  * New Task
  * Audit Store
  * Report Incident
  * Upload Photo
  * CAPEX Request
  * Stock Count
  * Customer Visit
  * Approve Item
- Audit / incident / CAPEX / stock-count actions open the existing task form pre-filled with the correct task type, priority and instructions.
- Upload Photo lets the user choose an open task and attaches the selected image directly to that task.
- Customer Visit opens Wholesale Division.
- Approve Item opens Approvals.
- Quick actions respect the user's existing access level and read-only permissions.

NOTES
- No database migration is required.
- No Cloudflare secret is required.
- Touch365 is not included in this patch.

MALIKS GROUP HUB - ALL NEW TASK NOTIFICATIONS

Replace these matching files in GitHub:
- app/api/team/shared.ts
- app/api/tasks/route.ts
- app/api/sops/[id]/activate/route.ts

Behaviour:
- Every newly created task creates an Inbox notification for every ACTIVE Hub member authorised to see that task's workspace.
- Owner/Admin and Developer/Technical Admin receive all workspace task notifications.
- Executive/EXCO with Full company access receives all workspace task notifications.
- Store/workspace-restricted users only receive tasks for workspaces they are allowed to see.
- A direct email assignee gets “assigned you a task” wording.
- Other authorised users get “new task added” wording.
- The direct assignee does not get a duplicate second notification.
- Existing push notifications and unread app badge counts are used automatically.
- SOP workflow activation is also covered: every task generated from an SOP creates notifications.

No new migration, npm package, GitHub secret, or Cloudflare secret is required.

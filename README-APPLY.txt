MALIKS GROUP HUB - COMPLETE -> APPROVAL -> RETURNED WORKFLOW

Replace the matching files in your GitHub repository with the files in this patch.
Then commit and push.

NEW WORKFLOW
1. Not started / In progress / Blocked never appear in Approvals.
2. When a task is changed to Complete, approval_status becomes "Awaiting approval" and the task appears in Approvals.
3. Authorised approvers can Approve or Return to work.
4. Approve keeps task status Complete, marks approval as Approved, and removes it from Approvals.
5. Return to work changes task status to Returned, removes it from Approvals, and sends Inbox/push notifications to authorised users for that workspace.
6. A Returned-to-work alert appears inside the affected Company Workspace until that task is completed again.
7. Returned cannot be selected manually from normal task status dropdowns; it only comes from the approval action.

DATABASE
No new Drizzle migration file is required for your existing production database.
The API safely adds tasks.approval_status on first use if it does not already exist.

NOTIFICATIONS
- Complete -> Awaiting approval notification to authorised approvers.
- Approve -> Approved notification to authorised users for that workspace.
- Return to work -> Returned notification to authorised users for that workspace.
- Existing new-task notifications continue to work.

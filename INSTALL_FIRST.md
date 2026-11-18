# PowerBuild Hub — Task Accountability Upgrade (Phase 28)

## What the patch activates

The existing **Task Details** window now supports:

1. **Task Checklist:** add up to 40 steps, tick off completed steps, remove incorrect steps, and view a live progress bar.
2. **Completion Evidence:** use the existing photos, PDF, Word and Excel attachment uploader. A checklist-managed task cannot be submitted as complete until all steps are ticked and at least one file has been uploaded.
3. **Manager Approval & Sign-off:** retains the existing Approvals workflow and adds actions directly in Task Details for authorised managers: Approve & Sign Off, Return for Correction, or Reject (reason required for rejection). Approval actions are recorded by actor and timestamp.
4. **Activity Timeline:** lists checklist updates, task submission, manager decisions, newly added comments, new uploaded evidence, task creation and assignment changes.

Existing task descriptions, comments, attachments, branch access controls, notifications and task statuses are preserved. Legacy tasks *without* checklists retain their existing approval submission rules.

This phase does **not** change printouts, brand logos, other POS apps, recurring schedules or overdue escalation settings.

## Install into GitHub

1. Extract the ZIP at the **root** of your existing `mos00000006/maliksgroupza` checkout, so files land in `app/`, `db/`, `drizzle/` and `tests/`.
2. Replace matching files and keep the new files, including `app/api/tasks/[id]/checklist/route.ts` and `drizzle/0069_task_checklist_activity.sql`.
3. Commit and push to the `main` branch.
4. The workflow `.github/workflows/deploy.yml` (**Deploy Maliks Group Hub**) should run automatically. If it does not, use **Actions → Deploy Maliks Group Hub → Run workflow**.
5. Check that **Validate and build**, **Apply database migrations** and **Deploy full Hub** all complete successfully before testing.
6. Refresh PowerBuild Hub. Open a task and confirm the Task Checklist, Manager Sign-off and Activity Timeline sections are visible.

No GitHub secrets need to be added. The new D1 migration is additive and does not delete old tasks or comments.

## How to use it

- Open the task → **Task Checklist** → add steps and tick each completed item.
- Upload a photograph, signed checklist or other document in **Documents & pictures**.
- Click **Submit for Approval**. If a checklist exists, unfinished steps or missing attachments are rejected with a clear explanation.
- A manager with approval permission for that workspace can choose **Approve & Sign Off**, **Return for Correction**, or **Reject**. Return/reject prompts ask for a reason.
- **Activity Timeline** records new actions with the employee's name and time. Previous historical events are not retrospectively backfilled.

## Authorisation

Existing branch/workspace access continues to apply. Owners, Technical Administrators, approved EXCO users, Store Managers, Regional Managers and Operations Managers may sign off within their assigned workspace scope. Read-only employees cannot change checklists. Non-management users cannot approve or reject.

## Tests

The ZIP includes `tests/hub-task-controls-phase28.test.mjs`, which exercises the new endpoints against an in-memory SQLite D1-like adapter. 12 local targeted tests passed during patch preparation. GitHub Actions must still run the complete project validation/build before deployment.

## Rollback

Restore the previous versions of the modified files, commit and redeploy the Hub. Leave the additive D1 tables intact, since removing them would delete checklist/audit history; the prior Hub can safely ignore them.

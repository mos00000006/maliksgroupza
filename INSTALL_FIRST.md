# Maliks Group Hub — Daily Checklist Save Fix
16 November 2026

## What was wrong
The old Daily Checklist refused to save an unfinished opening-to-closing checklist. Validation errors were displayed at the very top of the Store Control Centre, out of sight when the user was at the Save button.

The Hub was also determining "today" using UTC, which can assign a South African trading-day checklist to the previous date between 00:00 and 01:59 SAST.

## What changes
- **Save Progress:** saves an incomplete checklist as a draft with all selected statuses, comments and manager notes intact. A manager name and valid date are still required.
- **Finalise Daily Checklist:** requires all checklist items marked Done/Issue/N/A, comments for Issue items, and manager sign-off.
- **Error/success feedback appears beside the two Save buttons**, including backend validation and database failure messages.
- Saving the same branch/date edits that record, rather than creating duplicate checklists.
- Once finalised, an unfinished draft cannot replace the signed-off record.
- Only finalised checklists contribute to Today's Checklists and executive score/ranking.
- Dates follow Africa/Johannesburg (UTC+2), not the UTC Worker clock.
- Existing Daily Checklist history and submitted records are preserved. **No database migration required.**
- The automated tests cover incomplete draft saving, readback, updating same date, finalisation validation, summary counting, and permission/date protection.

## Installation
1. Back up your repository and create a Git branch. The patch is for the **main Hub**, not the `maliks-operations/` POS folder.
2. From this ZIP, copy `app/store-controls.tsx` and `app/api/store-controls/route.ts` into the same paths at the root of `maliksgroupza`, replacing only those two files.
3. Copy `tests/daily-checklist-save.test.mjs` to the root `tests/` directory.
4. In VS Code at the **repository root** run:
   ```
   node --test tests/daily-checklist-save.test.mjs
   npm run check
   ```
5. Commit and push to GitHub. Once its checks pass, deploy using your existing Hub Cloudflare deployment workflow. Do not deploy the separate POS or run a D1 migration for this fix.
6. Open Hub → Daily Checklists, select a store, and test:
   - Mark two items Done and leave the rest blank; click **Save Progress**; reload and check the draft remains.
   - Finish all items, fill in comments for any Issue, type manager sign-off; click **Finalise Daily Checklist**.
   - Reload. The history shows Finalized and Today's Checklists increases by one.

## Troubleshooting
- **Save button missing:** The Hub account may not have edit permissions (`data.canWrite`). Have an authorised administrator verify the assigned role.
- **Database error:** The screen now shows a clear error by Save. Check Cloudflare Worker logs and D1 binding/migrations for `daily_manager_checklists`.
- **Saving a draft after sign-off:** The application rejects downgrading a finalised checklist. Use Finalise Checklist to submit a revision, or contact management.
- **Uploads:** Evidence uploads remain optional and are separate from the saved checklist. A failed upload shows a warning without claiming that the checklist failed.

## Verification scope
- 3 regression tests passed on the extracted Hub source with an in-memory SQLite D1-compatible harness.
- Both changed files were syntax-checked with TypeScript's parser (missing external dependencies in the isolated test folder prevent a full project build).
- The ZIP was not deployed to Cloudflare and does not update live data.

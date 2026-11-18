# Maliks Group Hub — Fast Open Task Button (18 November 2026)

## What this patch fixes

In the **My Hub Inbox** modal, the previous row was a tiny, text-only "Open task →" link. Its click handler waited for `/api/notifications` to finish marking the notification read **before** opening the task. On a slow connection this made the action feel unresponsive.

This patch:

- Gives each notification a **real Open Task button** in navy, with a gold arrow; other alert types have an appropriate action label.
- Makes the button easier to see and touch, including on mobile screens, and adds a clear keyboard-focus indicator.
- Closes the inbox and displays an already-loaded task **immediately**, without waiting for the mark-as-read network call.
- Saves the read receipt in the background and refreshes the inbox afterwards.
- Tries to load a task directly if it was not in the current list, instead of silently doing nothing.
- Keeps notification destinations, access controls, and existing task APIs unchanged.

## Install

**Extract the ZIP into the ROOT of your existing `maliksgroupza` GitHub repository.** Merge the `app/` and `tests/` folders. Replace only the following files:

1. `app/page.tsx`
2. `app/phase-eight.css`

The third file is a new test: `tests/hub-inbox-open-task-fast.test.mjs`.

These two replaced files were based on GitHub's `main` as inspected on 18 November 2026:

- `app/page.tsx` original Git blob: `b7d80728e8b6b746859f9ae73a82b0f157346e1b`
- `app/phase-eight.css` original Git blob: `103ccf300689746d66d49be7b8c3a6e4ed72bdb1`

If those files have changed since this patch was created, reconcile the changes rather than overwriting newer edits.

### Check locally (optional)

```bash
node --test tests/hub-inbox-open-task-fast.test.mjs
```

### Deploy

1. Commit and push the files to `main` in `mos00000006/maliksgroupza`.
2. The **Deploy Maliks Group Hub** workflow (`.github/workflows/deploy.yml`) runs on pushes to `main`. Check that workflow's result. **Do not use the separate Maliks Operations/POS workflow for this Hub-only change.**
3. After a successful Hub deployment, reload the PowerBuild Hub app (Ctrl+Shift+R in Chrome; close and reopen the installed desktop app if needed).
4. Open **My Hub Inbox** and click the navy **Open Task** button.

## Verification

- 4 targeted Node tests passed locally.
- `app/page.tsx` successfully transpiled with TypeScript JSX syntax validation.
- Not deployed or verified against the live Cloudflare Hub. No new secrets or database changes are required by the patch itself.

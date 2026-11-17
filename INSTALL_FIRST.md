# Maliks Quote — Cloudflare Access Session Resume Fix

## Why this patch

The `/api/session` endpoint already returned a valid user, `app: pos`, the Developer/Technical Admin role, branch assignments and `password_change_required: false`. The remaining blocker was the Quote window showing its employee-login screen without a clear way to recheck a valid Cloudflare Access session.

## Exactly what changes

- Updates only `maliks-operations/src/mobile-quote-frontend.mjs` (the Quote Worker frontend).
- Adds a **Continue with Cloudflare Access** button that rechecks `/api/session`.
- Rechecks the authorised session when the installed app window resumes (focus/pageshow/visibility).
- Displays the actual error if the session isn't available and retains the existing Member Team employee login fallback.
- Prevents simultaneous session checks and preserves existing quotation, staff role, branch, password and payment controls.
- Adds a focused automated test: `maliks-operations/tests/phase25-quote-access-resume.test.mjs`.

**No changes to:** `maliks-core-api`, Zero Trust policies/AUD secrets, Member Team passwords, D1 tables, Sales, Tills, Cash Office or Dispatch.

## Install

1. Extract the ZIP into the root of your `maliksgroupza` GitHub project, keeping the folder paths inside the ZIP.
2. Replace the existing `maliks-operations/src/mobile-quote-frontend.mjs` and add the new test file.
3. Commit and push the two files.
4. Go to **GitHub Actions → Deploy Maliks Department Applications → Run workflow** (select `main`, check the worker names confirmation).
5. Confirm `npm test`, `Deploy central API` and **`Deploy Maliks Quote`** are green.
6. Open `https://maliks-quote.moyanamoses006.workers.dev/` and click **Continue with Cloudflare Access** if it doesn't open automatically.

## What success looks like

The top of the page says **Build a customer quotation**, shows a **Branch / Store** selector, **New Quote / Saved Quote / Branch Quotes** tabs and **Scan the price card**.

If you see a message under **Cloudflare Access**, its full error text identifies the next real failure. Do not send passwords or verification codes.

## Verified source base

Quote source is based on live GitHub blob `a4010fe8022b3580db7685c4ebe949363154f35a` from `mos00000006/maliksgroupza`. If your repository has changed that file after this patch was prepared, compare first instead of overwriting newer changes.

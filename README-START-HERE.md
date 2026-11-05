# Maliks Group Hub — Fix the 3 GitHub Actions lint errors

Your log shows **3 errors under `new-files/app/tills/`**. They are the original installation copies, not the intended live files under `app/tills/`.

The 101 warnings do not by themselves prevent `npm run lint` from succeeding with the current configuration. The `[BABEL]` message is informational.

## Installation: VS Code linked to GitHub

1. **Save and commit any current work**, or use a new branch. Open your existing Maliks Hub folder in VS Code (the folder containing `package.json` and `.git`).
2. Extract this ZIP. Copy **only** `FIX-MALIKS-HUB-CI.mjs` to the root of that folder, beside `package.json`. Do **not** paste another `new-files/` folder.
3. Open **Terminal > New Terminal** and run:

   ```powershell
   node .\FIX-MALIKS-HUB-CI.mjs
   npm run check
   ```

4. If `npm run check` succeeds, run:

   ```powershell
   git status --short
   git add -A
   git commit -m "Remove obsolete Sales Tills staging files"
   git push
   ```

5. Check the **new** GitHub Actions run for that pushed commit; older runs won't change.

## What the script does

- Requires existing `app/tills/page.tsx` and `app/tills/till-checkout.tsx` before changing anything.
- Removes only these exact duplicate paths when present: `new-files/app/tills/*`, `new-files/app/api/tills/*`, `new-files/app/lib/tills-route-policy.ts`, and `new-files/tests/tills-*`.
- Uses `git rm -f` **only for those tracked staging duplicates**, staging their deletion for your next Git commit.
- Copies old staging files to your operating system's temporary directory before deletion.
- Preserves all actual `app/` files, current sales/till role code, catalogue, price tags, accounting and Cloudflare configuration.
- Does **not** apply the original permissions patch. Use the previously supplied corrected Hub integration package if you still need to install that functionality.

## If the command refuses to run

If it reports `app/tills/page.tsx does not exist` or another missing actual till file, **do not delete the staging folder**. The correct live checkout wasn't installed. Use the previously supplied corrected integration ZIP before running this cleanup.

If ESLint reports errors under `app/tills/` (rather than `new-files/app/tills/`) **after** this fix, send the new error output: that is a different issue in the live files.

**This changes repository source files only. It does not enable live payment or stock transactions.**

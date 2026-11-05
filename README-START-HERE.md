# MALIKS GROUP HUB — Correct Sales / Tills GitHub patch

This is **a targeted Hub update, not an entire Hub replacement**. Use it with the existing GitHub-connected Hub repo. It repairs the 3 errors from the `npm run check` log, removes the obsolete `new-files/` duplicates, and enables full-access users to switch to the checkout preview.

## Correct project paths (no `new-files/`)

- `app/tills/page.tsx` — Next.js Link navigation
- `app/tills/till-checkout.tsx` — safe branch switching, no setState effect, Back to Hub link
- `app/lib/tills-route-policy.ts` — cashier restrictions and approved manager/full-company roles
- `app/api/tills/shared.ts` — server-side permission and branch checks
- `app/api/tills/session/route.ts`, `app/api/tills/catalogue/route.ts` — read-only endpoints
- `app/tills/tills.module.css` — styling
- `tests/tills-access.test.mjs`, `tests/tills-full-access.test.mjs` — access checks
- `hub-tills-assignment.patch` — guarded changes to the four EXISTING Hub files (`worker/index.ts`, `app/api/access.ts`, `app/api/team/route.ts`, `app/page.tsx`)
- `APPLY-MALIKS-HUB-TILLS.mjs` — checks and applies the existing-file patch, then cleans **only** known obsolete `new-files/` copies.

## Installation — choose ONE of these approaches

### Recommended: extract outside the repository

1. In VS Code, open your **actual Maliks Hub** repository (the folder with `package.json` and `.git`). Save/commit current work and make a **new branch**, such as `fix/sales-tills-access`.
2. Extract this ZIP somewhere **outside the Git repository**, for example `C:\Users\YOURNAME\Downloads\Maliks_Hub_Tills_Correct_Patch`.
3. Open VS Code Terminal in the Hub repository root. Run:

   ```powershell
   node "C:\Users\YOURNAME\Downloads\Maliks_Hub_Tills_Correct_Patch\APPLY-MALIKS-HUB-TILLS.mjs"
   ```

   Replace the path with your actual extracted folder. The installer applies the original Hub patch if needed, copies the final checkout files to the proper paths, and removes the known staging copies. Existing files copied over are backed up to your computer's temporary directory.

### If you're PASTING into your Maliks Hub folder

1. First save/commit your current work and create a **new Git branch**.
2. Extract the ZIP and copy its **contents** (the `app/`, `tests/`, `.patch`, `.mjs`, `.md` entries) to the **project root**, alongside `package.json`. Merge folders. Do **not** create a nested `new-files/` directory or a `Maliks_Hub_Tills_Correct_Patch/` folder inside the repo.
3. From the Hub root, run:

   ```powershell
   node .\APPLY-MALIKS-HUB-TILLS.mjs
   ```

   This checks and applies the original Hub role/menu/Worker patch if needed; it will remove the older `new-files/` checkout copies that GitHub was linting. Since you've already pasted the corrected files, they will not be copied again.

### Run checks and push from VS Code

```powershell
npm run check
npm run build
git status
```

After both commands succeed, review the changes and stage only the intended source, tests, `.gitignore`, patch/installer files and the removal of staging copies. Commit and push your feature branch. Let GitHub Actions run before merging into your live branch.

**If `git apply` refuses to apply or recognise the earlier patch, STOP and send the output.** The existing Hub code has diverged; forcing or replacing `app/page.tsx` or `worker/index.ts` could remove new catalogue, price-tag or permission changes.

## Expected permissions

- **Owner / Admin, Developer / Technical Admin:** Full Hub, open Sales / Tills and switch back.
- **Executive / EXCO:** Sales / Tills when assigned **Full company** scope; switch back.
- **Store / Regional Manager:** Sales / Tills for authorised branches; switch back.
- **Sales / Tills cashier:** only assigned branch checkout; restricted Hub pages and APIs return an access denial.

**Safety:** This is a **checkout preview only**. It does not enable real sale posting, invoicing, payment acceptance, stock deductions or accounting entries. Existing tills and live Hub data must remain unchanged until proper testing.

## Testing note

`node --test tests/tills-access.test.mjs tests/tills-full-access.test.mjs` requires the project's TypeScript dependency (normally present after `npm install`). The global Hub checks are `npm run check` and `npm run build`.

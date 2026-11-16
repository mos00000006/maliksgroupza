# MALIKS GROUP HUB — Operations Bridge ESLint Fix (16 November 2026)

## What the GitHub log reports

`npm run check` aborted at the lint stage with **2 errors and 133 warnings**.

1. `new-files/app/api/operations-bridge/route.ts` — `@next/next/no-assign-module-variable`.
   Fixed: rename the local loop variable from `module` to `moduleDef`.
2. `new-files/app/operations-bridge.tsx` — `react-hooks/set-state-in-effect`.
   Fixed: use asynchronous `fetch` callbacks plus request cancellation. Initial load, branch changes and manual refresh remain functional.

No changes to database writes, stock levels, invoices, sales or permissions.

## Quick fix for the EXACT GitHub error shown

1. Download and extract **Maliks_Operations_Bridge_ESLint_HOTFIX.zip**.
2. Copy `new-files/app/api/operations-bridge/route.ts` from this ZIP to that exact path in your repository, replacing the old file.
3. Copy `new-files/app/operations-bridge.tsx` to the matching path, replacing the old file.
4. In your GitHub project, commit and push the two replacements.
5. Verify the GitHub Actions `npm run check` job. The errors in the supplied log are resolved in these files; other problems may appear once lint completes.

## Important: `new-files` is a temporary installation directory

The supplied GitHub log shows the Operations Bridge files under `new-files/`. They need to be **copied into the live app paths** before the dashboard works:

- `new-files/app/operations-bridge.tsx` → `app/operations-bridge.tsx`
- `new-files/app/operations-bridge.module.css` → `app/operations-bridge.module.css`
- `new-files/app/api/operations-bridge/route.ts` → `app/api/operations-bridge/route.ts`
- `new-files/app/lib/operations-bridge-policy.mjs` → `app/lib/operations-bridge-policy.mjs`
- `new-files/tests/operations-overview-readonly.test.mjs` → `tests/operations-overview-readonly.test.mjs`

After copying and verifying all those files and applying the navigation-only patch in the original Phase 1 package, delete the obsolete `new-files/` folder from the repository so it isn't linted twice.

**Do not overwrite `app/page.tsx`** with a file from another project version. If you have not applied the navigation patch, follow `README_APPLY_MALIKS_OPERATIONS_BRIDGE.md` in the original Phase 1 package, and stop if `git apply --check` fails.

### Local test, in repository root

```powershell
npm run check
```

For a quick check of the bridge's standalone tests (after the live files are in place):

```powershell
node --test tests/operations-overview-readonly.test.mjs
```

The hotfix only addresses the two lint failures; it is **not** a full integration or a live POS/stock reconciliation.

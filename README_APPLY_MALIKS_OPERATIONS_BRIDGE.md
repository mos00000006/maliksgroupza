# INSTALL — Maliks Group Hub Operations Control (Phase 1)

**Safe read-only connection to POS/operations activity; NOT a replacement Hub or live payment/stock integration.**

Source expected: `maliksgroupza(10).zip` from 16 November 2026. This patch touches only the Hub navigation in `app/page.tsx` and adds new Hub-only files.

1. **Back up the Hub project and production D1.** Work in a new Git feature branch from the current deployed Hub commit.
2. Extract this ZIP to an **outside** temporary directory. Do not replace your project with the ZIP.
3. Copy the **contents of** `new-files/` into your repository root, preserving the directories:
   - `app/lib/operations-bridge-policy.mjs`
   - `app/api/operations-bridge/route.ts`
   - `app/operations-bridge.tsx`
   - `app/operations-bridge.module.css`
   - `tests/operations-overview-readonly.test.mjs`
4. Open a PowerShell terminal at the **GitHub repository root**, where `app/page.tsx` already exists. Check and apply the **navigation-only** patch:

   ```powershell
   git apply --check "C:\path\to\unpacked\hub-operations-control.patch"
   git apply "C:\path\to\unpacked\hub-operations-control.patch"
   node --test tests/operations-overview-readonly.test.mjs
   npm run check
   git diff --stat
   ```

5. **If `git apply --check` fails, stop**: your repo's `app/page.tsx` differs from the uploaded snapshot and requires a targeted merge. Do not force/overwrite.
6. Commit to GitHub, deploy a staging build, and open **Hub → Operations Control**. Select your branch or group view. The dashboard is read-only and shows non-configured tables explicitly.
7. Verify permissions with a Store Manager assigned to one branch and a Sales/Tills account without management access. Check the counts against the live D1 database. If good, deploy Hub using your existing pipeline.

### What this patch does not do

- Does NOT deploy or modify separate `maliks-operations` Workers.
- Does NOT create schema tables or migrate any production D1 data.
- Does NOT process payments, print legal invoices, deduct stock, approve GRVs or mark orders delivered.
- Does NOT merge independent Hub and POS inventory balances. That requires an approved per-branch migration and reconciliation.
- Does NOT assume the Operations suite is deployed and working; missing tables show **Not configured**.

Read `INTEGRATION_ARCHITECTURE_MALIKS_2026.md` for the go-live plan, high-risk cutover and division of responsibility.

# Maliks Tills quotation-number lookup correction

## What it fixes

The screenshot shows the cashier typing `q000000001`, which was rejected by the original browser validator. This patch lets Tills, POS and Cash Office find the same quote using `q000000001`, `Q000000001`, `Q-00000001`, or `1`. The field automatically converts the value to `Q-00000001` before searching. It does not modify the underlying quotation number or any existing quotations.

## Important release boundary

This change fixes **quotation lookup only**. It does NOT record verified payment, issue a tax invoice, or create a dispatch-release record. Only verified paid invoices should become dispatchable. The current Phase 8 code still explicitly labels tender allocations as preparations, not settled payments.

## Install

**Use this package only with the Phase 8 baseline that was previously supplied.** If you have later or independent changes, apply `maliks-quote-lookup-fix.patch` or merge just the two small code edits; do not overwrite newer files.

1. In GitHub `maliksgroupza`, edit `maliks-operations/src/frontend.mjs` and `maliks-operations/src/quote-domain.mjs`. Replace them with the included versions ONLY if they match your deployed Phase 8 baseline, or use the `.patch`/manual merge instead.
2. Also update `maliks-operations/tests/phase3.test.mjs` and `maliks-operations/tests/phase8.test.mjs` to match the new accepted formats; add `maliks-operations/tests/quote-lookup-fix.test.mjs`.
3. Commit to `main` and run `Deploy Maliks Department Applications` with name confirmation checked.
4. In Maliks Tills, hard-refresh then try `q000000001`. The input should display `Q-00000001` after clicking Find quotation. If it isn't found, check that a quotation with ID 1 exists and matches the selected branch.
5. Use only test quotations. **Do not hand the customer an item from Dispatch based on a quotation or unverified tender preparation.**

No D1 migration or Cloudflare secret change is required. The main management Hub is not targeted.

## Next necessary build for real sale -> Dispatch

Implement a posted payment/receipt journal, independently confirmed card/EFT or cash tender evidence, locked invoice sequencing, reversals, sale+inventory atomic posting, and a dispatch queue gated on verified PAID invoice state. Until those controls exist, do not label tender preparations as paid or auto-release stock.

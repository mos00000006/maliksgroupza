# MALIKS POS — Professional Dashboard & POS Screen (UI Phase 1)

## Scope

This patch updates the **Maliks POS Professional management Worker** (`maliks-operations/src/frontend.mjs`) from the uploaded `maliksgroupza(10).zip`. It does **not** replace the Maliks Group Hub or the Sales, Tills, Cash Office, Dispatch, Member Team or private Core Worker services.

### What you get

- Real **PowerBuild** logo: uses your current embedded `/powerbuild-logo.png` file served by `powerbuild-logo.mjs` (unchanged). No generated/redrawn logo.
- Header text stays `MALIKS POS` with `ACCOUNTING & POS SOLUTIONS PROFESSIONAL`.
- Exact existing top menu order: Home, Debtors, Suppliers, Stock, Back Office, Dispatching, Head Office, System Settings, Widget, Help, Lock, Exit.
- Official Lucide SVG paths bundled locally with consistent 24×24 line icons, **gold `#D4A017`** in the top menu and placed above labels. No emoji or external icon CDN.
- UI palette only: **dark navy `#0A2A3F`, gold `#D4A017`, white, neutral light grey**.
- Responsive four-KPI management dashboard (Sales Today, Tills, Cash Office, Dispatch), plus role-scoped live linked stock count and a recent GRV register summary where the backend authorises it.
- Modern POS layout: responsive item search by name/code/barcode via the **existing authenticated branch-scoped stock master endpoint**, 12-item result list, quantity +/- controls, remove/clear basket, VAT-inclusive totals and F2 product-search shortcut.

## Critical transaction boundary

The POS screen is a **non-posting draft preview**. It cannot take Cash/Card/EFT payments, issue an invoice, deduct inventory, produce a receipt, park a sale or release Dispatch. The payment buttons are deliberately disabled until the existing secure Sales / Tills / Cash Office / Dispatch APIs are fully integrated and tested. The four financial dashboard metrics display `—` instead of fabricated turnover or shift numbers. The stock/GRV panel uses available existing authenticated operational endpoints only, and degrades to **Unavailable** on an access failure.

Do NOT enable the buttons by simply removing `disabled`. A validated, transactional backend is required for posting, receipts, audits and stock movements.

## Files to install

Copy these files from this ZIP into your existing GitHub project, preserving their paths:

1. `maliks-operations/src/frontend.mjs` — updated existing UI Worker file (**replaces existing**).
2. `maliks-operations/src/pos-lucide-icons.mjs` — **new** locally bundled official Lucide SVG artwork.
3. `maliks-operations/src/pos-premium-theme.mjs` — **new** themed CSS.
4. `maliks-operations/src/pos-premium-screens.mjs` — **new** Dashboard and POS screen code.
5. `maliks-operations/tests/pos-premium-ui.test.mjs` — **new** automated checks.

**Do not copy** this update into `app/maliks-operations/` or upload its files into `new-files/`: those locations in the old ZIP are duplicate historical copies. Use the actual `maliks-operations/` package that is deployed by `.github/workflows/deploy-maliks-operations.yml`.

If you have made newer GitHub changes after producing `maliksgroupza(10).zip`, inspect `frontend.mjs` before overwriting it, or apply the included `frontend.mjs.patch` and resolve any conflicts. The patch was based on that uploaded version, not the live repository HEAD.

## How to apply (VS Code + GitHub)

1. Make a backup branch in GitHub before changing your code.
2. Extract the ZIP on your Windows PC and copy the five files into the matching folders in the GitHub project checked out in VS Code.
3. Review the changes, then in VS Code terminal:

```bash
node --check maliks-operations/src/frontend.mjs
node --test maliks-operations/tests/phase13-suite.test.mjs maliks-operations/tests/pos-premium-ui.test.mjs
npm run check
```

4. After the checks pass, commit and push. Use the existing **Deploy Maliks Department Applications** GitHub Actions workflow for the POS Worker after confirming the Cloudflare Access/Worker configuration. Do not change the D1 schema, API routes, Cloudflare secrets or other Workers for this design update.
5. Visit the protected Maliks POS Professional Worker and choose **Home → Open POS Screen**. Confirm a cashier cannot view other branches and cannot submit a payment from the preview.

`npm run check` is run at the repository root, while the new standalone UI tests are in the `maliks-operations/tests/` folder. If your checkout has the previous `new-files/` ESLint errors, fix those separately before deployment; this UI patch does not address them.

## Preview files

The two browser-ready `.html` files are **design previews with labelled sample products and a mock local session**; they never authenticate or make network requests. They are NOT production applications. The PNG screenshots are taken directly from those HTML previews with the real logo and official SVG icons. The actual installed app authenticates against your existing Core Worker and fetches real branch products.

## Colours, icons and logos

CSS variables: navy `#0A2A3F`; gold `#D4A017`; white `#FFFFFF`; greys `#F5F6F7`, `#F0F2F3`, `#E3E5E7`. Navy/gold alpha transparency is used for shadows. The PowerBuild logo may inherently contain additional original image colours; the logo itself was **not recoloured or changed**.

Official Lucide icons: https://lucide.dev/ and https://github.com/lucide-icons/lucide ; subject to the Lucide ISC licence. Vector shapes are self-hosted and not generated.

## Verification performed

- `node --check` for all new modules and updated `frontend.mjs` passed.
- Original suite's five smoke tests passed with the modified frontend.
- Four new UI static tests passed, including menu structure, colour palette, no payment posting and PowerBuild logo.
- Two interactive Chromium browser previews rendered with **zero JavaScript page errors**. Product lookup, adding to basket and VAT-inclusive calculations were checked.
- **Not claimed:** no production Cloudflare deployment, no real payment processing, no live tills/sales/dispatch financial KPI aggregation, and no entire monorepo `npm run check` because the full dependency tree was not installed in this environment.

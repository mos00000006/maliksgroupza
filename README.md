# Maliks Group Hub — Display Size accessibility patch

## What it does
Adds a small floating **Aa Display size** control to internal Hub pages. Users can select 100%, 110%, 125%, 135% or 150%, or reset to normal. The browser saves the setting locally, independently for each device/browser. This scales interface text, buttons and form controls together, including fixed-pixel text. It does **not** edit any database records, product prices, catalogue images or access permissions. Public shop, public product QR and API paths are excluded.

## Install
1. Back up your current `app/layout.tsx` before applying changes.
2. Add `app/hub-display-size.tsx` and `app/hub-display-size.css` to your repository.
3. For the existing layout, add these lines with its other imports:
   `import HubDisplaySize from "./hub-display-size";`
   `import "./hub-display-size.css";`
   Then insert `<HubDisplaySize />` just before `</body>`.
4. A ready-to-use `app/layout.tsx` is provided **from the original uploaded Hub ZIP**. Only replace your current layout with it if it still matches; otherwise use step 3 to preserve newer layout changes.
5. Add `tests/hub-display-size.test.mjs` and run `npm run check`, then deploy on GitHub/Cloudflare.
6. Test the controls at 100%, 125% and 150% on desktop/mobile, including tables, modal dialogs, sidebar and price tag studio.

## Verification performed
4 focused source-level tests passed locally. A full production build and browser usability check against the **latest deployed Hub** were not performed. At 150%, some dense screens may need scrolling, and this should be tested on mobile. Browser-specific zoom behavior should also be checked on Safari/Firefox.

## Error audit based on latest supplied GitHub CI output
- ESLint: 0 errors, 52 warnings. Majority are unoptimised `<img>` elements, React effect dependency warnings, and unused variables.
- Production Vite build: passed.
- Node tests: 80 passed, 1 failed (outdated `powerbuild-live-storefront.test.mjs` asserting `View Website` exists). The separate earlier removal test correction must be committed. It is not part of this accessibility patch.
- Source log also includes expected errors emitted by negative-path tests and non-blocking bundling warnings, which are not automatically live defects.
- These results are from the user-supplied log, not a fresh complete run or live security/functionality audit.

## Known follow-up review areas
- Sidebar subtitle font sizes as small as 6.5px in `professional-hub.module.css` even at default zoom; audit mobile clipping at 125%/150%.
- Remaining image optimisation warnings.
- React effect dependency and unused variable warnings.
- Missing product pictures and catalogue completeness require functional checks against live database; logs do not prove they are correct.
- Test/access permissions, public QR routes, D1 limits, catalogue PDFs, price tags, store forms and backup/migrations in staging before claiming a full Hub audit.

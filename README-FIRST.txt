SAFETY & WARNING SIGNS - GITHUB CI REPAIR

The GitHub log shows 139 / 140 tests passing. The failing test checks
for the exact text "Safety &amp; Warning Signs" in the Studio menu.

This patch:
  1. Checks/repairs the Studio tab, import, mode and dispatch if incomplete.
  2. Updates the test to accept both valid JSX spellings (& and &amp;),
     but still REQUIRES the tab and functional dispatch.

Copy:
  scripts/repair-safety-signs.mjs -> scripts/
  tests/safety-warning-signs.test.mjs -> tests/ (replace old test)

From the repository root run:
  node scripts/repair-safety-signs.mjs
  npm run check

Commit the modified files and redeploy after the check is green.

IMPORTANT: The actual sign editor files must already exist at:
  app/price-tags/safety-warning-signs.tsx
  app/price-tags/safety-warning-signs.module.css

If they are missing, take them from the previous Safety & Warning Signs
patch first. This repair does not alter any other Studio tools or data.

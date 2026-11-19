Maliks POS — Phase 52 GitHub test-only correction (19 November 2026)

Source: user-supplied GitHub Actions log showing 359 passed / 2 failed of 361.

Fixes:
- phase44-stock-label-layout.test.mjs: removes outdated Phase 44 CSS measurements, validates Phase 51/52 compact layout and two-up portrait label.
- phase47-zebra-direct-print.test.mjs: updates obsolete barcode SVG variable name, checks both single and portrait barcode/QR paths and confirms PowerBuild/Buster branding remains on by default.

Installation:
1. Copy ONLY the two files inside maliks-operations/tests/ into the matching GitHub paths.
2. Commit and push. Run npm test in GitHub Actions.

No production source changes. No database migration. Do not overwrite stock-labelling-ui.mjs with any previous phase.
The src/ file in this build folder was used for local validation ONLY and is intentionally NOT included in the ZIP.
This fixes CI assertions; it does not prove correct physical GK420d printing or barcode/QR scan quality.

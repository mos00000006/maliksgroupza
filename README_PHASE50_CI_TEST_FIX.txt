MALIKS POS PROFESSIONAL — PHASE 50 CI TEST FIX
19 November 2026

Purpose:
The supplied GitHub Actions log showed 353 passing tests and 5 failures.
Phase 50 added optional two-up portrait stickers to the GK420d label PDF generator.
Older tests still asserted that ALL sticker printing must use 40x24 or 50x30 single-page labels.
The Phase 49 isolated VM test also omitted the newly required format selector.

This patch updates five regression tests ONLY:
- phase43-stock-labelling.test.mjs
- phase44-stock-label-layout.test.mjs
- phase45-gk420d-roll-print.test.mjs
- phase48-chrome-label-pdf.test.mjs
- phase49-gk420d-orientation.test.mjs

The changes preserve coverage of the original single-label formats while also checking
Phase 50 two-up mode, browser-free headers, and branch-specific price/QR protections.
A format value is provided in the Phase 49 VM harness, matching production runtime.

INSTALL:
1. Extract the archive.
2. Copy the files into the corresponding repository paths under maliks-operations/tests.
3. Commit and push; GitHub Actions will rerun npm test.
4. Do not change production code or perform database migrations for this test correction.

VALIDATION:
- Five formerly failing checks passed locally using Phase 50 production script.
- An additional suite of 13 related sticker tests passed locally.
- Full 358-test GitHub Actions suite not rerun in this offline environment.
- Physical GK420d printer alignment is unrelated and must be verified separately.

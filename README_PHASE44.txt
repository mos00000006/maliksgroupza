MALIKS POS — PHASE 44: GK420d STICKER OVERLAP FIX
18 November 2026

FIX
- Eliminated global .top / .desc / .price / .meta / .foot class-name collisions.
- The small 40x24mm sticker is now an explicit four-row grid: 5.5mm header, 5.2mm price, 2mm meta, remainder barcode/QR.
- The 50x30mm variant has its own fixed row sizes and larger typography.
- The onscreen preview is magnified independently (1.65x), while printer output stays at real sticker dimensions.
- Logo, price, description, barcode and QR have separate constrained regions; description clips to two lines.
- No changes to product lookup, pricing, QR token URLs, printing quantity, inventory balance, or accounting.

INSTALL
1. Extract ZIP and replace maliks-operations/src/stock-labelling-ui.mjs in your current GitHub repository.
2. Add the optional new test file to maliks-operations/tests/.
3. Commit and push; after deployment, hard-refresh Stock > Utilities > Labelling.
4. Test with one printed label before bulk printing. The 40x24mm format can be too small to reliably scan a dense QR; use 50x30mm if QR readability is marginal.
5. Confirm Zebra GK420d driver is set to actual stock dimensions and browser print scaling is 100%, no margins/headers/footers.

No migration needed. Does not deploy itself.

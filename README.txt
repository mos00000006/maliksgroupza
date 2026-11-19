Maliks POS Professional — Phase 52: Keep PowerBuild/Buster Build logo and MaliksQuote QR

Fixes Phase 51 defaults that incorrectly switched OFF the branch logo and QR.

Changes:
- Branch logo option is ON by default (PowerBuild for other branches, Buster Build for Buster).
- QR -> MaliksQuote is ON by default (requires an existing published Hub price-card token).
- QR is allocated 8.8 mm on 40 x 24 mm landscape, and 9.2 mm on 50 x 30 mm landscape.
- Compact horizontal print arrangement is retained: description, barcode, stock code and price.
- Existing two-across portrait mode, print dimensions, and Chrome PDF logic are unchanged.

INSTALL
1. Extract this ZIP into the existing GitHub project keeping the folder paths.
2. Replace maliks-operations/src/stock-labelling-ui.mjs.
3. Add maliks-operations/tests/phase52-brand-qr-labels.test.mjs.
4. Commit and push; run the usual Maliks POS deployment workflow.

NOTE: Small QR codes may be difficult to scan at 203 dpi, especially with long URLs. Test one sticker with your phone and adjust physical media calibration if needed. Do not print a made-up QR when the product has no published token.

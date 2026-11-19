Maliks POS Phase 51 – Compact Horizontal Retail Sticker Patch

Purpose:
- Change single-sticker printing to a compact horizontal retail label layout matching the user sample.
- Keep two-up portrait roll mode intact.

Main changes:
1. Single 40x24 / 50x30 sticker modes now print in compact horizontal layout:
   - description at top
   - barcode in middle
   - stock code / meta below barcode
   - price at bottom
2. Default compact settings for single-sticker mode:
   - Branch logo OFF
   - Unit / Size OFF
   - QR OFF
   - Barcode ON
   - Stock code ON
3. Preview note updated.

Install:
- Replace maliks-operations/src/stock-labelling-ui.mjs with the file in this patch.
- Deploy normally.

Notes:
- Two-up portrait mode is not changed.
- If physical feed direction is still wrong on the GK420d, use the existing single-label orientation option.

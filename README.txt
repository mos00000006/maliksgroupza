Maliks POS – Phase 53: REAL two-across horizontal label correction

Root cause:
The preceding compact-horizontal patch only changed SINGLE label mode. Your
selected TWO-ACROSS mode still rendered portrait/upright artwork. This patch
fixes the two-across output directly.

Changes:
- Two-across roll: draw the stock label HORIZONTALLY first and rotate the
  complete design 90 degrees into each individual portrait sticker.
- Landscape like your padlock label is selected by default; opposite direction
  and upright portrait are alternatives in the new Two-up sticker text direction.
- Includes existing PowerBuild/Buster Build logo and published MaliksQuote QR,
  description, current branch price, barcode and stock code.
- On-screen preview now displays the same JPEG that is sent to the PDF.
- Does not change PDF media size or printer calibration; each physical row still
  has two separate print positions, never one design stretched across both.
- No database migration, stock update, pricing or financial posting changes.

Install:
Copy maliks-operations/src/stock-labelling-ui.mjs into the matching GitHub
repository location. Copy the supplied test into maliks-operations/tests.
Commit, push, deploy Maliks Department Applications.

Printer:
Choose Two portrait stickers side by side; keep Horizontal like your padlock
label. Set exact dimensions measured from the roll (defaults 24 x 40 mm per
sticker with 2 mm between) and use the full row width in the Windows GK420d
printing preferences (e.g., 50 x 40 mm if those are the real dimensions).
In Chrome PDF Print: GK420d, Actual size 100%, no auto rotation/fit.
First test with quantity 1 and scan the QR and barcode before bulk printing.

The actual roll measurements are unverified; a wrong driver page size can
still cause clipping or misalignment regardless of software design.

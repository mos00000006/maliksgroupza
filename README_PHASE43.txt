MALIKS POS PROFESSIONAL — PHASE 43: GK420d STOCK LABELLING
18 November 2026

WHAT CHANGED
Stock > Utilities > Labelling opens a dedicated navy/gold POS sticker workstation.
It uses the existing PowerBuild and Buster Build logos served by the POS Worker, selected by branch.
It searches the authenticated branch stock database by stock code, description, or barcode.
It reads the current branch price from existing Hub published price tags / price overrides.
It displays a print queue, per-product quantities, previews, barcode and REAL locally-generated QR SVGs.
It can add labels from recent posted GRV and stock-adjustment documents and read scanner/CSV text lists.

QR BEHAVIOUR
A QR is only available if the Hub has already published a price-card token for that product.
The label URL follows https://<hub-origin>/p/<token>?branch=<selected-branch>, matching the existing MaliksQuote scanner.
No sale price is embedded in the QR. MaliksQuote looks up the current price from the server.
The initial Hub origin shown is https://maliks.co.za. Confirm this is the SAME host that serves your current /p/<token> price cards. Change the origin field in the screen before printing if needed.
This patch does NOT publish missing Hub tags.

PRINTER / PAPER
The Zebra GK420d uses monochrome direct-thermal output; colour logos print as monochrome.
40 x 24 mm: paired across an 80 x 24 mm print page (two columns). Requires matching two-across stock and driver calibration.
50 x 30 mm: one sticker per print page.
Select Zebra GK420d in the operating-system print dialog; it must be installed on the workstation.
Turn off scaling, headers and footers; verify actual output/alignment and QR scan reliability using ONE test page before bulk printing.
The browser cannot silently select the Windows printer or bypass the print dialog.
Very small QR code/barcode combinations can be difficult to scan: use 50 x 30 mm when needed.

INSTALL
1. Extract this ZIP.
2. Copy the maliks-operations/src/ files to the same paths in your GitHub repository.
3. Copy the included test file if desired. Commit and push.
4. Allow your existing deployment pipeline to publish the POS and Core Workers (Core uses inventory-domain.mjs).
5. No migration required.
6. Test: select branch -> Stock -> Utilities -> Labelling; add an existing published Hub item; preview; print one test pair.

IMPORTANT
These are read/print actions. No inventory balances, supplier or debtor accounts, or financial postings are modified.
The generic Stock Utilities and other POS modules remain unchanged.
The printed QR requires a valid published tag and a reachable Hub origin.
No native USB/ZPL printer integration is claimed; printing uses the browser's print dialog.
Source of embedded QR code encoder: Kazuhiko Arase, QR Code Generator for JavaScript, MIT license (existing vendor copy from Maliks Hub repository).

VALIDATION
4 focused tests passed; 8 tests passed including the existing debtor-report browser integration checks.
Local syntax checks passed for frontend.mjs and inventory-domain.mjs.
Not physically tested on a GK420d; verify printer driver and actual sticker rolls at a store.

MALIKS POS PROFESSIONAL - PHASE 47: GK420d DIRECT USB PRINTING

WHAT IS FIXED
- Print GK420d Labels sends native ZPL directly to the Zebra via the Zebra Browser Print PC agent.
- It no longer calls window.print() or opens Chrome's print dialog.
- Chrome's date/time, POS title and workers.dev URL are not sent to the printer.
- Media is always one label across: 40 x 24 mm (320 x 192 dots), or 50 x 30 mm (400 x 240 dots), both at 203 DPI.
- Direct ZPL contains logo (monochrome bitmap), description, current branch price, optional stock code/unit, barcode and QR.
- Exact item quantities print from ZPL ^PQ; no stock or accounting writes.
- Connection checks for GK420d; it will not silently send the label to the OKI printer currently selected by Chrome.

INSTALLATION INTO THE EXISTING GITHUB PROJECT
Replace files with the same paths from this ZIP:
  maliks-operations/src/stock-labelling-ui.mjs
  maliks-operations/tests/phase43-stock-labelling.test.mjs
  maliks-operations/tests/phase45-gk420d-roll-print.test.mjs
  maliks-operations/tests/phase47-zebra-direct-print.test.mjs
Run npm test inside maliks-operations, then deploy the existing Department Applications GitHub workflow.
No database migration.

ONE-TIME PC SETUP (REQUIRED FOR CHROME TO PRINT WITHOUT A DIALOG)
1. On the Windows PC physically attached to the Zebra GK420d install and run official Zebra Browser Print:
   https://www.zebra.com/us/en/support-downloads/software/printer-software/browser-print.html
2. Start the Zebra Browser Print application (system tray Zebra icon); printer connected by USB and switched on.
3. Right click its tray icon -> Settings -> Default Devices -> Change -> select Zebra GK420d -> Set.
4. Grant the Maliks POS website permission in the Browser Print prompt (Accepted Hosts).
   If the local HTTPS certificate is not trusted, follow Zebra's official setup for https://localhost:9101/ssl_support.
5. In POS Stock -> Utilities -> Labelling click Connect GK420d once; the textbox must show GK420d.
6. Load genuine 40x24 mm GAP roll labels, calibrate the printer, and send ONE test label.
7. Click Print GK420d Labels. After setup there is no Chrome print dialog.

LIMITATIONS
- Sending successfully confirms the Browser Print service accepted the job, not a physical print verification. Check alignment and scan the QR on real stock.
- The GK420d needs ZPL firmware. For printers running EPL-only, a separate EPL renderer will be required.
- If Zebra Browser Print is not installed/running or the website isn't authorised, this feature reports a setup error rather than opening the Chrome dialog or printing to the wrong device.
- 40x24 mm is dense when both barcode and a full URL QR are present; for unusually long barcodes or QR links select 50x30 mm or hide barcode.
- The QR payload contains a valid URL (required for scanning) but the website address is NOT printed as visible text.

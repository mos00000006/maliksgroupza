Maliks / PowerBuild Hub — Phase 55 QR Poster Print Style Patch

Purpose
- Make the printed attendance QR poster cleaner.
- Make the QR code larger.
- Remove the visible attendance URL from the poster.
- Use a dedicated print window instead of printing the whole management page.

What changed
1. app/attendance/attendance-panel.tsx
   - Print QR poster now opens a clean print-only window.
   - Poster only prints the branch title, subtitle, large QR and short instructions.
   - Visible URL/link text has been removed from the poster.
   - QR SVG size increased.
2. app/attendance/attendance.module.css
   - Bigger on-screen poster preview.
   - Bigger print poster layout.
   - Small helper note replaces the raw URL.

Important note about Chrome headers/footers
- Standard Chrome/Chromium print headers and footers are a browser setting and cannot always be forcibly disabled by a web page.
- This patch removes the URL from the poster content and prints through a dedicated clean window so the output is much cleaner.
- If the browser still shows date/time or domain in the print margin, turn off "Headers and footers" in the print dialog.

Files to replace
- app/attendance/attendance-panel.tsx
- app/attendance/attendance.module.css

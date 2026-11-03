POWERBUILD / BUSTERBUILD — BULK A4 EXCEL PRICE TAGS PATCH
================================================================

WHAT THIS ADDS
- A new “Bulk A4 price tags” option inside Price Tag Studio.
- Managers can upload XLS, XLSX or CSV price lists.
- Only Product Name and Price are required.
- Product Code, Unit, Colour and Branch are optional.
- Review and edit imported products before printing.
- Choose 6 larger tags or 8 compact tags on each A4 page.
- Exact A4 print pages with cut lines.
- PowerBuild and BusterBuild designs use the selected Studio brand.
- A downloadable Excel template is included in the screen.
- The first populated worksheet is read, up to 500 valid products.

PRIVACY AND DATA
- The manager’s spreadsheet stays inside the browser.
- This patch does not upload the workbook or save it in the Hub database.
- These are printable price tags only. It does not change catalogue prices,
  QR customer prices, D1 data or the public website.
- No database migration is required.

INSTALL
1. Copy every folder from this patch into the ROOT of the Company Hub project.
   Keep the app, public, scripts and tests folder structure exactly as supplied.
2. Run:

   node scripts/install-bulk-price-tags.mjs

3. Then run:

   npm run check

4. Commit, push and deploy using the same process you normally use.

HOW MANAGERS USE IT
1. Open Price Tag Studio and choose PowerBuild or BusterBuild.
2. Choose “Bulk A4 price tags”.
3. Download the Excel template, or upload the manager’s own XLS/XLSX/CSV file.
4. Review the imported products and correct any names, prices or units.
5. Choose 6 larger tags or 8 compact tags per A4 page.
6. Click “Print / Save A4 PDF”, then print at 100% / Actual Size.

SUPPORTED EXCEL HEADINGS
Required:
- Product Name (also accepts Product, Name, Description or Item)
- Price (also accepts Selling Price, Retail Price or Unit Price)

Optional:
- Product Code / Code / Item Code / SKU
- Unit / UOM (Each, Box or m2)
- Colour / Color
- Branch / Store / Shop

VALIDATION COMPLETED
- Modern XLSX workbook import passed.
- Legacy XLS workbook import passed.
- South African price formats passed.
- 6-tag and 8-tag A4 layouts passed.
- Existing Single Tag, Shelf Pricing, Safety Signs and other Studio tools preserved.
- 26 targeted compatibility tests passed.
- Production build passed.

No migration. No Wrangler command is needed for this patch.

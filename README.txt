CATALOGUE PDF READABILITY PATCH

Target: Maliks Group Hub from maliksgroupza(7).zip

Install:
1. Back up app/catalogue-pdf.ts in your Hub project.
2. Copy app/catalogue-pdf.ts from this patch into the same path in the project.
3. Run npm run check from the project root, then review the PDF and interactive leaflet.

Changes:
- Enlarges product names, descriptions, product codes, category headings, contents labels, and footer text.
- Uses a 3-column by 4-row product grid (12 products per page) for more readable cards.
- Keeps PDF and interactive leaflet page numbering in sync.

This is a focused source patch, not a full Hub backup.

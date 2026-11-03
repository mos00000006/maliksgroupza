MALIKS GROUP HUB - PDF + FLIPBOOK COVER-PAGE LAYOUT PATCH

Install: replace app/catalogue-pdf.ts in the Hub repository with this file.
Do not replace catalogue data, product images, category grouping, or other modules.

CHANGES
- Keep the existing full artwork cover ONLY on page 1.
- Retain the contents/index on page 2.
- Remove every full-page category cover/divider in the generated PDF AND interactive flipbook.
- Start each category directly on its first product-grid page with a navy/yellow category header.
- Update contents page start/end page references and every footer/page counter.
- Reduce page count by one page for every nonempty category.
- Do not alter categories, product codes, descriptions, or image URLs.

CHECKS
Static source checks verified: one primary cover for PDF, one for flipbook,
no separate category cover renderer, sequential pages for both outputs.
A full production build/browser rendering and live deployment have not been run.

Apply to the latest Hub version ONLY if app/catalogue-pdf.ts matches the recently supplied catalogue patch; merge if the file has changed since then.

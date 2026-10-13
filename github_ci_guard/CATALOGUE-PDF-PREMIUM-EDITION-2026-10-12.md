# Wholesale catalogue PDF — Premium edition

Updated 12 October 2026.

## Added
- Professional contents / index page with live category page ranges.
- Dedicated cover page for every catalogue category.
- Larger product presentation using a 4 × 4 product grid per page.
- Centred product images and centred product naming.
- Stock-code badge placed beneath every product.
- Consistent PowerBuild blue / yellow / navy visual system.
- PowerBuild logo in catalogue headers and category dividers.
- Professional footer on catalogue pages: PowerBuild Wholesale Division, www.powerbuild.co.za, page number, and the instruction to contact a PowerBuild representative for wholesale enquiries.
- Nexa-first typography. The export tries locally installed Nexa first, then optional bundled Nexa files under `public/fonts/`, then browser fallback typography.

## Behaviour preserved
- Download original PDF remains unchanged.
- Download wholesale division PDF continues to use all active Hub catalogue products.
- Uploaded product images are used automatically.
- Products without images remain included with a clean placeholder.
- PDF generation remains browser-side to avoid Cloudflare Worker resource pressure.

COMPANY HUB — SHELF PRICING A4 GENERATOR

Copy all folders into the Company Hub repository, preserving their paths, then commit and deploy normally.

The existing TorkCraft installer remains in the normal prebuild chain and now applies the shelf-pricing integration automatically. It still keeps the Hamiltons installer. To apply the integration immediately before committing, you may also run:
node scripts/install-shelf-pricing.mjs

What is added
- A new Shelf pricing A4 button inside the existing PowerBuild/BusterBuild Price Tag Studio.
- Search by product name or exact product code.
- Editable VAT-inclusive price, unit, optional paint colour and number of copies.
- Tile pack details are supported so the QR customer page keeps Smart Measure.
- Saving a shelf label updates the normal brand price tag and stable customer QR link. BusterBuild prices continue through the same connected sales-app price feed.
- 12 shelf labels per A4 page.
- Exact label size: 90 × 40 mm.
- Automatic extra A4 pages when more than 12 labels are loaded.
- High-resolution A4 PDF download with dotted scissor/paper-cutter lines.
- Maximum 24 copies per product and 240 labels per download to keep browser export reliable.

Brand designs
- PowerBuild: blue, yellow and white.
- BusterBuild: black, orange and white.

Print setting
Open the downloaded PDF and print at Actual size / 100%. Turn scaling off. Cut around the dotted label borders.

Files
- app/price-tags/shelf-pricing-studio.tsx
- app/price-tags/shelf-pricing-studio.module.css
- app/lib/a4-shelf-price-pdf.ts
- scripts/install-shelf-pricing.mjs
- scripts/install-torkcraft-images.mjs
- tests/shelf-pricing.test.mjs

There is no D1 migration. Existing products, pictures, prices, QR codes, studio tools and access controls are preserved.

No remote deployment was performed.

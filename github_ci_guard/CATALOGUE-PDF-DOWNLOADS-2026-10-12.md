# Catalogue PDF downloads - 12 October 2026

The Company Hub **Our Catalogue** module now includes two PDF download actions:

1. **Download original PDF**
   - Downloads the supplied PowerBuild Wholesale Division catalogue layout.
   - The file is stored as `public/wholesale-division-original.pdf`.
   - It is an optimised copy of the supplied 11-page A4 catalogue so it remains practical to deploy and download through the Hub.

2. **Download wholesale division PDF**
   - Reads every active product currently held in the live Company Hub catalogue, regardless of the user's current search/page.
   - Groups the products by catalogue category.
   - Builds an A4 PowerBuild Wholesale Division catalogue in the user's browser using the supplied wholesale layout as the design reference.
   - Uses the supplied cover design, PowerBuild blue/yellow styling, black category heading bars, five-column product-card grids, product codes, catalogue pictures where available, and `www.powerbuild.co.za` footers.
   - Products without an uploaded catalogue picture remain included with a styled product-image placeholder.
   - New products added to the live catalogue are automatically included the next time the wholesale PDF is downloaded.

## Cloudflare protection

The wholesale PDF is assembled **client-side in the user's browser**. The Hub only supplies the normal paginated catalogue data and individual product images. This avoids making one Cloudflare Worker request generate a large multi-page PDF and is intended to prevent a recurrence of Worker CPU limit Error 1102.

## Files added/changed

- `app/catalogue.tsx`
- `app/catalogue-pdf.ts`
- `app/globals.css`
- `app/mobile-improvements.css`
- `public/wholesale-division-original.pdf`
- `public/wholesale-division-cover.jpg`

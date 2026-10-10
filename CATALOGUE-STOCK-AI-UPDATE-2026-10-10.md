# Company Hub Catalogue Stock + AI Picture Update

Date: 2026-10-10

## What this update does

- Preserves the existing Company Hub catalogue, editing and DELETE / Remove workflow.
- Adds the 251 stock-code + stock-description records supplied in the 2026-10-10 in-store screenshots.
- The prepared batch is seeded into `catalogue_products` once, using `INSERT OR IGNORE`, so existing product codes are not overwritten.
- Adds automatic catalogue picture generation using the Hub's existing `OPENAI_API_KEY` secret.
- Catalogue administrators can generate one missing picture from a product card or run **Generate missing pictures** to work through all missing catalogue images.
- Generated images are stored in the existing Cloudflare R2 `BUCKET` and linked to the real catalogue database records.
- Product images are requested as clean, square catalogue product renders with transparent backgrounds and no pricing/watermarks.

## Files added / changed

- `app/api/catalogue/prepared-stock.ts` - prepared stock batch (251 products).
- `app/api/catalogue/shared.ts` - one-time stock seed into the catalogue database.
- `app/api/catalogue/ai-image/route.ts` - authorised AI image generation + R2 storage.
- `app/catalogue.tsx` - catalogue administrator controls for picture generation.
- `app/globals.css` - catalogue AI controls styling.

## Deployment note

The code must be deployed to the same Maliks Group Hub Cloudflare Worker / D1 / R2 environment. The live deployment must already have `OPENAI_API_KEY` configured for AI picture generation. If the key is not configured, all 251 catalogue stock records still load, but the AI picture button remains disabled until the secret is configured.

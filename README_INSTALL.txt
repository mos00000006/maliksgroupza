MALIKS GROUP HUB — TOMMY FIX PACKAGING PHOTOS V4

Purpose
- Replace existing catalogue thumbnails (not a PDF or brochure).
- Nail-In Anchors: 5/10/15 pieces show one Tommy Fix pouch; 50/100 pieces show one Tommy Fix tub.
- All Tommy Fix pack-shot labels are brand-only, white beneath the Tommy Fix banner. Product codes remain in the Hub's code/description fields, not printed on photo stickers.
- 164 existing supplier-verified codes; also updates legacy Nail-In Anchor image references without reactivating old records.
- No changes to names, descriptions, selling prices, stock, or active status.

Installation
1. Extract ZIP into the ROOT of your Maliks Group Hub GitHub repository, keeping 'public/' and 'drizzle/' folders.
2. Make sure earlier catalogue migrations (including 0058) have been applied before this file.
3. Commit and deploy the site so Cloudflare serves the new public images.
4. Apply remote D1 migration from the repository ROOT:
   npx wrangler d1 migrations apply maliks-group-hub-db --remote --config .deploy/wrangler.jsonc
5. Test TF-NA535-5 (pouch) and TF-NA535-50 (tub) in the Hub catalogue. Check other Tommy Fix codes too.
6. Do NOT rename the files: database paths are versioned and point to these exact names.

NOTE: Product photographs are catalogue-style edited representations. Confirm packaging with the actual supplier.
The patch was locally SQL-tested; no live production deployment has occurred.

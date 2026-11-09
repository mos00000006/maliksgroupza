MALIKS GROUP HUB — TOMMY FIX ALL CLEAN LABELS + PADLOCKS CATEGORY (V6)

WHAT THIS PATCH DOES
- Updates product image references for 290 existing Tommy Fix catalogue SKUs, including
  164 newer verified variants plus 126 older/historical codes that the previous patch missed.
- Includes 21 clean branded product photo assets (one packaged product per image), with
  no TF product codes or pack-size text printed on their Tommy Fix stickers.
- Adds clean GREEN WALL PLUG and SQUARE WASHER photos, the missed products in the screenshot.
- Nail-In Anchors: 5, 10, 15-piece packs use pouches; 50, 100-piece packs use tubs.
- Products remain searchable by their unchanged codes and names on the catalogue cards.
- Moves the 26 previously entered padlock records T001–T030 (known existing SKU list)
  out of Locksets and into a Locks department. Genuine mortice/door locksets remain separate.
- No new product records, no duplicate SKUs, no price changes, no stock changes, no status changes.

INSTALL (from the MALIKS GROUP HUB GitHub repository root)
1. BACK UP THE DATABASE first, and extract this ZIP into your repository root, preserving
   public/, drizzle/ and scripts/ folders.
2. If you are also installing prior Tommy Fix migrations, apply them BEFORE this migration.
3. Run the non-destructive category UI patcher (it edits YOUR current files in place):
      node scripts/apply-locks-category-v6.mjs
   It safely fails if expected categories have changed, rather than overwriting your UI.
4. Commit the newly added files and the three small edited app/ files to GitHub.
5. Apply the Cloudflare D1 remote migrations from repository ROOT:
      npx wrangler d1 migrations apply maliks-group-hub-db --remote --config .deploy/wrangler.jsonc
6. Redeploy your Worker/Pages site so the 21 new public files are served.
7. In the Hub, search these SKUs: TF-WP10-10, TF-GWP11-25, TF-GWP11-100,
   TF-SQW10-25, TF-NA5035-10 (pouch), TF-NA5035-100 (tub), TF-BRLF4821-25.
   Confirm all stickers are TOMMY FIX + white only, with codes displayed on the card.
8. Verify T029 is in Locks, not Locksets; confirm genuine door locksets are unchanged.

NOTES
- Assets are illustrative or edited studio product photos, not certified manufacturer images.
- No data is changed until you apply SQL on the real remote D1 and deploy.
- This patch updates image pointers only for existing SKU rows; it does not create missing
  items. The mapping CSV shows exactly which SKU points to which replacement image.
- The category patcher can be safely rerun and does not overwrite your whole catalogue app.
- These patches were validated in a local SQLite database and the category script against
  the most recent provided source archive. Live deployment has not occurred.

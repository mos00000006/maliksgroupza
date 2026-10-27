COMPANY HUB — TORK CRAFT PRODUCT PICTURES

Apply to Company Hub only. Copy drizzle, data, scripts and tests into the repository, replacing matching files. Commit and deploy normally, including D1 migrations.
The existing editable-colour installer now installs the Tork Craft image-host support automatically. For a repository without that installer in its build chain, run once before building:
node scripts/install-torkcraft-images.mjs

Includes the SAME 0046 names/codes migration from the previous Tork Craft patch, plus NEW 0047_torkcraft_catalogue_images.sql. If 0046 was already applied, D1 skips it. If not, both migrations run in order. Your usual migration command is:
npx wrangler d1 migrations apply maliks-group-hub-db --remote --config .deploy/wrangler.jsonc

5,510 product picture links were taken from the official catalogue's 500px product images and matched by product code. The other 307 listings show only a placeholder on the supplier website; their codes are listed in data/torkcraft-missing-images.json. No placeholder is imported as a real product picture.

These are supplier-hosted images, displayed through the Hub's authenticated catalogue image route, not thousands of image files inside this ZIP. Image availability depends on the supplier image service. The patch enables only its exact host b2c.et-dev.co.za alongside the existing supplier hosts. Existing access checks remain in place. Refresh the catalogue after deployment.

Only empty picture fields are filled. Existing photos and all pricing remain unchanged. Names/codes from the previous patch are preserved. No staff, vehicle, attendance, root Worker or studio page is replaced.

Checks: local SQLite tests verify 5,510 picture mappings, 307 missing-source images, preserving existing pictures/pricing, repeat-safe migrations and repeat-safe image-host integration. Live image requests were sampled; all 5,510 remote files were not downloaded or independently checked. No production deployment or remote migration was performed here.

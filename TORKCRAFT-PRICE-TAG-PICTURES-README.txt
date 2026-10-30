COMPANY HUB — TORKCRAFT PRICE-TAG PICTURE FIX

Copy the app and tests folders into the Company Hub repository, preserving their paths, then commit and deploy normally.

Cause fixed
TorkCraft catalogue pictures use the exact supplier image host b2c.et-dev.co.za. The catalogue import saved those links correctly, but the price-tag picture proxy did not include that host in its approved list. The generator therefore returned “not found” even when the catalogue product had a picture.

What this patch changes
- Adds only b2c.et-dev.co.za to the existing price-tag picture allowlist.
- TorkCraft pictures can now appear in the single price-tag generator.
- The same picture path is used by PowerBuild/BusterBuild tags and scanned customer product pages, so those views are fixed too.
- Existing Pulse Tiles and Conan Tools picture hosts remain enabled.
- Other external hosts remain blocked.

What stays unchanged
- Product codes, names, prices, QR codes and catalogue records are untouched.
- Existing uploaded or generated transparent PNG pictures remain preferred when present.
- No products or pricing are imported.

Files
- app/api/price-tags/image-source.ts
- tests/torkcraft-price-tag-images.test.mjs

There is no D1 migration. The earlier TorkCraft product/image migrations must remain in the repository and database.

Validation completed locally
- The updated source compiles through esbuild.
- A real TorkCraft-style b2c.et-dev.co.za image URL reaches the price-tag proxy and returns image/jpeg.
- An unapproved external host remains blocked before any fetch.

No remote deployment was performed.

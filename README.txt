PowerBuild Hub — Phase 58: 600 x 1200 mm tile pictures horizontal

Files:
  app/price-tags/price-tag-card.tsx
  app/price-tags/product-picture.tsx
  app/price-tags/price-tags.module.css

Changes:
- Automatically detect 600x1200 / 1200x600 tile tags via tile dimensions or product name/description.
- Rotate portrait-oriented SOURCE pictures by 90 degrees so they display horizontally inside the tag picture area.
- Leave source images already landscape unchanged.
- Keep product title, price, code, branch branding, QR, tile pack details, colours, tag size, and export unchanged.
- Applies to both on-screen tag preview and printed/downloaded cards because they share the same component.
- Nothing changes in the catalogue database or stored product photographs.

Install:
  Copy these three files to the same paths in your maliks-group-hub repository.
  Commit and deploy Maliks Group Hub.

Validation:
  Run: npm run build (in repository root)
  Then create a 600x1200 tile tag with a portrait source image and verify JPG and print output.

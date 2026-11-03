POWERBUILD PUBLIC WEBSITE + LIVE HUB CATALOGUE + HUB BUTTON
===========================================================

WHAT THIS PATCH ADDS
- A polished public PowerBuild customer website at /powerbuild/index.html.
- Official PowerBuild horizontal and diamond logos.
- A yellow “View Website” button in the Hub navigation/header.
- Product search, departments, current specials, product details, branch selection,
  project basket and WhatsApp enquiry.
- Live products from the Hub catalogue. New active products appear automatically.
- Changes to product names, codes, categories and pictures appear on the next website fetch.
- Explicitly disabled B2C products stay hidden. Inactive products stay hidden.
- Only the customer website, customer catalogue/order endpoint and public product/special
  pictures bypass the Hub’s source-code login gate. Company pages and admin APIs remain private.

INSTALL
1. Extract this ZIP.
2. Copy ALL folders from it into the root of your Maliks Group Hub GitHub repository,
   preserving the app/, public/, scripts/ and tests/ paths. Replace matching files.
3. From the repository root run:
      python3 scripts/install-powerbuild-website.py
   On Windows, “python” can be used instead of “python3”.
4. Review the changed files, commit, push and let the existing Hub deployment complete.
5. In the Hub select “View Website”, or open:
      https://YOUR-HUB-DOMAIN/powerbuild/index.html

CLOUDFLARE ACCESS
The patch bypasses the Hub’s own Worker login only for the public customer routes. If a
Cloudflare Zero Trust Access application protects the entire hostname before requests reach
the Worker, add a public Bypass policy for these paths:
- /powerbuild/*
- /api/ecommerce/public*
- /api/ecommerce/product-image/*
- /api/ecommerce/special-image/*
Keep /, /api/ecommerce/control and all other Hub/admin paths protected.

LIVE PRODUCT RULES
- Active catalogue product with no ecommerce settings row: visible on retail automatically.
- Explicit b2c_enabled=0: hidden.
- Inactive product: hidden.
- Product price is read from E-Commerce Control. A zero price displays “Price on request”.
- Physical stock is not automatically read from TOUCH 365; availability is the website
  status controlled in E-Commerce Control.
- No database migration is required for this patch.

CHECKS COMPLETED
- Website JavaScript syntax passed.
- Public-route boundary tests passed.
- New-product live-sync source checks passed.
- Installer was tested twice to confirm it is safe to rerun without duplicate buttons.

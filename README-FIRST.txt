PRICE TAG STUDIO — BRANCH PRICING
=================================

WHAT THIS PATCH ADDS
- All Branches remains the normal company-wide product price.
- Choose one store, several stores, or All Branches in Price Tag Studio.
- One entered price can be saved to every selected branch.
- Existing branch prices reload when the product is selected again.
- Every printed/JPG tag displays its branch name in a dedicated line below the
  product name, outside the product-picture area.
- Each branch tag QR opens the customer page with that branch's current price.
- The customer page clearly states which branch price is being shown.
- Multiple selected branches generate one printable tag per branch.
- Existing company-wide prices, QR tokens, pictures and Smart Measure details
  are preserved.

IMPORTANT BUSTERBUILD RULE
The BusterBuild sales app continues using the All Branches price. Branch-specific
prices apply to their printed tags and customer QR pages only.

INSTALL
1. Copy every folder from this patch into the Maliks Group Hub repository,
   preserving the app/, drizzle/ and tests/ paths. Replace matching files.
2. Prepare the production Cloudflare configuration if needed:
      npm run config:production
3. Apply the new D1 migration:
      npx wrangler d1 migrations apply maliks-group-hub-db --remote --config .deploy/wrangler.jsonc
4. Commit, push and allow the normal Cloudflare deployment to complete.

HOW TO USE IT
1. Open Price Tag Studio and choose PowerBuild or BusterBuild.
2. Load the product.
3. For a new product, first save its All Branches price.
4. Select one or more branches.
5. Enter the branch price and select Generate.
6. One branch-labelled tag is added to the print sheet for every selected store.

VALIDATION COMPLETED
- Production build passed.
- Price tag, paint search and colour-code compatibility tests passed: 20/20.
- Branch override test confirms Sungate pricing does not change the All Branches price.
- ESLint completed with no errors; existing image-element notices remain warnings.

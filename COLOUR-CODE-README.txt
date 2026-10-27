COMPANY HUB — EDIT PRODUCT CODE FOR PAINT COLOUR

Apply over the previous Single Price Tag Paint Colour / Name Search patch.
Copy all included folders into the Company Hub repository root, then commit
and redeploy through your usual workflow.

No additional database migration. Migration 0045 from the previous colour
patch is still required if you have not applied it yet.

Your current paint/search prebuild installer now calls this new code installer
automatically. It also preserves and extends your existing prebuild command.
If that hook is not active in your deployment, run once before building:
  node scripts/install-colour-variant-code.mjs
The previous paint/search installer must have run first. Source edits are
surgical; the full studio, catalogue, price tables and Worker are not replaced.
The installer is repeat-safe, supports --check, and refuses unsupported source
before writing. Keep its .before-colour-code backup files out of your commit.

WHERE THE OPTION IS
Price tag generator -> choose brand -> Single product tag -> choose product.
Below the price fields you will see:
  Product code for this colour
  Use code for this colour
  Paint colour (optional)

EXAMPLE
1. Load White paint, code PA001, and generate its tag if needed.
2. Write Ivory in Paint colour and enter the price for Ivory.
3. Change Product code for this colour to PA002.
4. Click Use code for this colour. The actual PA002 catalogue product loads;
   your entered colour and price carry over. Review the product and price.
5. Click Generate price tag. PA002 prints on the tag and its QR opens PA002.

Each colour code must be an existing ACTIVE catalogue product. This is not a
free-text label that silently keeps the previous product behind its QR. Unknown
codes show an error and cannot generate against the previous product. Add a
missing colour/stock code in the catalogue first, then use it here.

Different catalogue codes retain their own saved prices, colour text and QR
links, separately for PowerBuild and BusterBuild. Generating Ivory does not
rename White, overwrite White's price, or reuse White's QR. Both can remain on
the same print sheet. Updating a tag for the same existing code keeps its QR.
If a saved target already exists, it is loaded for review before you Generate.
The target product's picture is loaded through the existing image workflow.

The code field is available on standard non-tile tags alongside Paint colour.
The code is validated before generation and checked again on the server against
the chosen product ID. A code change or catalogue rename during editing requires
reloading the correct code. Existing designer and management checks stay in
place; older clients that omit the new product_code request field still work.

VERIFICATION
4 integration checks passed: independent colour codes/prices/QRs, brand
independence, rejection of mismatched/unknown/stale/inactive codes, management
and designer permissions, older-client compatibility, repeat-safe installation,
menu/build-hook preservation and refusal of unknown source without writes.
Focused browser checks used the actual modified editor, code selector, tag
card, search and SQL API: code-change save blocking, real catalogue lookup,
price/colour carry-over, correct printed code, distinct QR/product identity,
and unknown-code errors. Unrelated tools, images/export and legacy styles were
mocked in that functional browser check; those flows were not changed. A full
production deployment was not tested. No live product data or migration was
used while making this patch.

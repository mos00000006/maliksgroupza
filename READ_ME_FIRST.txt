MALIKS RETAILOS - FULL VIEW SALES / CHECKOUT V4
=================================================

THIS IS A DIRECT-PASTE UI PATCH FOR YOUR EXISTING MALIKS GROUP HUB.

What changes
------------
- Checkout opens in full-view workstation mode by default.
- Collapses the left navigation to an icon rail to give products and basket more room.
- Adds an "Expand menu" button to switch back to the full navigation layout.
- Makes the right-hand payment/checkout panel wider and independently scrollable.
- Keeps product search, quotations, sales orders, lay-bys, parked sales and basket on the left.
- Removes the redundant large summary strip in full-view mode.
- Keeps the right checkout in its own non-overlapping column on desktops/laptops.
- Automatically stacks panels on narrower screens so totals never cover products.
- All branch selections, access rules and the quotation-to-Cash-Office workflow remain.

FILES TO COPY
-------------
  app/tills/till-checkout.tsx
  app/tills/tills.module.css

HOW TO INSTALL
--------------
1. Make a backup or create a new GitHub branch first.
2. Download and extract this ZIP into a separate folder.
3. Copy the included app folder into your existing maliksgroupza folder.
4. In Windows, choose Merge folders and Replace existing files. Only the two
   files listed above should be replaced. Do not copy an extra nested app folder.
5. If you want to add the tests, copy the tests folder as well (optional).
6. To update the online Hub, commit and push these changed files to GitHub.
7. Run npm run check / your normal GitHub Actions workflow. Preview the deployed
   page on a test branch before using it in the live staff workspace.

HOW TO USE
----------
- Sales / Checkout opens in Full View by default.
- At the top-right click "Expand menu" to show the whole sidebar.
- Click "Full view" to collapse navigation again.
- Hover over left-rail icons to read the module name.
- The right-hand Order Summary stays visible when the product list scrolls.
  It has its own scrollbar if its contents exceed the available screen height.

SAFETY AND SCOPE
----------------
This patch is LAYOUT ONLY. It does not activate live payments, invoicing,
stock updates, receipts, refunds, drawer operations or accounting posting.
The existing checkout setup required warning and locked sale button remain.
Do not remove those controls until a secured backend has passed production tests.

VERIFICATION
------------
- TypeScript syntax: 0 diagnostics.
- CSS syntax: 0 parsing errors.
- 31 focused POS / quotation / access tests passed in a combined local fixture.
- Browser layout tested at 1650, 1280, 1024, 800 and 600 CSS pixel widths;
  zero horizontal overflow, right summary column verified at desktop widths.
- The full Hub build, D1 deployment and actual POS peripherals have NOT been tested.

PREVIEW
-------
FULL-VIEW-PREVIEW-1650.png and FULL-VIEW-PREVIEW-1280.png are browser-rendered
layout mockups using the patched CSS, not screenshots of a live deployed till.

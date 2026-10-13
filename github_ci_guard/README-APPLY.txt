POWERBUILD / MALIKS GROUP HUB
COMPANY WORKSPACES MODAL LAYER FIX V1

REPLACE ONLY:
  app/workspaces-modal.tsx

FIXES THE SCREENSHOT ISSUE
--------------------------
The Executive Overview header was appearing ABOVE the Company Workspaces modal.

The workspace modal now:
- uses a dedicated high z-index (220)
- always sits above the Hub header/sidebar/page content
- uses isolation to prevent stacking-context conflicts
- dims and slightly blurs the background
- locks background/body scrolling while open
- restores scrolling automatically when closed
- applies the same fix to both:
    * Company Workspaces list
    * Individual workspace board

No database changes.
No API changes.
No secret changes.

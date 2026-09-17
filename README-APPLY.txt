POWERBUILD / MALIKS GROUP HUB
ROLLOUT & ONBOARDING — FULL VIEW FIX V2

REPLACE ONLY:
  app/rollout-onboarding-centre.tsx

WHAT THIS FIXES
---------------
The Rollout & Onboarding page was wider than the available Hub content area,
forcing the entire page to scroll left/right.

This patch:
- prevents page-level horizontal overflow
- makes the 6 KPI cards shrink correctly
- changes the two-column readiness area to use shrink-safe grid columns
- keeps the role cards inside their panel
- makes the user rollout table fit the desktop content width
- assigns sensible table column widths
- wraps long emails/workspace text instead of widening the page
- changes to 3 KPI columns on narrower desktop windows
- changes to 2 KPI columns on tablets / smaller windows
- changes to 1 KPI column on very small screens

On desktop, the page should now stay fully inside the Hub window with NO
bottom left/right page scrollbar.

On smaller mobile/tablet widths, only the detailed user table may scroll inside
its own box where necessary; the overall Hub page itself remains fixed to the
screen width.

No API changes.
No database migration.
No secret changes.

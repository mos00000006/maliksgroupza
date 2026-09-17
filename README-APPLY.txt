POWERBUILD / MALIKS GROUP HUB
STORE SPECIALS — 25 MB PER IMAGE + SEQUENTIAL UPLOAD V4

REPLACE:
  app/store-specials.tsx
  app/api/store-specials/route.ts

NEW UPLOAD RULE
---------------
- Every promotion image may be up to 25 MB.
- Up to 12 images can be selected.
- The Hub no longer sends all pictures inside the Create Special request.
- It creates the promotion record FIRST.
- It then uploads each image ONE AT A TIME.
- This prevents multiple large files from making one oversized request.

Example:
  2 images x 20 MB = accepted.
  They are uploaded as two separate ~20 MB requests instead of one ~40 MB request.

If an image is over 25 MB:
  The phone immediately tells the user which image is too large.

The slideshow, branch permissions and promotion notifications are unchanged.

No D1 migration.
No new GitHub secret.

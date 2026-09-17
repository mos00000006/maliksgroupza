POWERBUILD / MALIKS GROUP HUB
STORE SPECIALS CREATION FIX V2

REPLACE ONLY:
  app/api/store-specials/shared.ts
  app/api/store-specials/route.ts
  app/store-specials.tsx

WHAT THIS FIXES
---------------
1. Store Specials no longer relies on INSERT ... RETURNING to obtain the new D1 row.
   It now uses the D1 insert result / last_row_id and reads the created row back safely.

2. Notification/push problems can no longer make a successfully saved promotion
   appear as "Special could not be created".

3. The creation order is now:
   - Save promotion record
   - Upload promotion pictures to R2
   - Schedule/send notifications
   Notification failure is logged, but the promotion remains saved.

4. Upcoming and start-date notification functions are non-fatal and retryable.

5. If another backend problem occurs, the Store Specials screen now displays the
   actual backend error instead of only the generic "Special could not be created."

NO NEW SECRET.
NO MANUAL D1 MIGRATION.

COMPANY HUB — FIX COLOUR TEST DATABASE SETUP

Copy the tests folder into your Company Hub repository root and replace the
two files. Commit and rerun the normal GitHub build / npm run check.

The previous colour patch added colour columns to both price-tag tables through
migration 0045. These two older tests created their own temporary SQLite test
databases, applying migrations only through 0038. They therefore failed with:
  no such column: t.colour
  table powerbuild_price_tags has no column named colour

Both test database setups now also apply the existing 0045 migration. No
assertions are removed or weakened, and no application code is changed.

No additional production migration is introduced by this fix. The original
0045 migration remains required for live colour functionality if still pending.
The lint warnings in the supplied log are warnings, not this build failure.
The supplied log showed the application built, then two tests failed.

Validation: both corrected legacy test files were run against the updated
colour/code tag API and the original combo APIs. Their tests passed, including
permissions, stable QR links, public whitelisting, unpublishing, image handling,
combo persistence, price feed and tile price calculations. No remote database
or live deployment was used in verification.

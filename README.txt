Maliks Group Hub — GitHub CI test correction

Replace ONLY tests/powerbuild-live-storefront.test.mjs in your CURRENT GitHub repository.

Why: The Hub View Website header button was intentionally removed. The previous test still required that button and therefore failed after the successful removal. This changes the test to assert the button is absent while preserving the existing storefront feed/image and refresh checks.

Do not replace app/page.tsx or any other app files with older copies. Commit and push, then run npm run check. This patch does not remove any website routes.

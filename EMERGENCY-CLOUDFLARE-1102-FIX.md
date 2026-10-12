# Emergency Cloudflare 1102 fix — 12 October 2026

This build moves the 495-item catalogue seed out of live Worker requests and into a D1 migration.

Changes:
- Added `drizzle/0012_catalogue_prepared_stock.sql` to create/seed the catalogue during the deployment migration step.
- Removed runtime import/execution of the 495-item stock array from `app/api/catalogue/shared.ts`.
- Cached Cloudflare Access JWKS instead of recreating the remote verifier on every request.
- Removed repeated `CREATE TABLE` and owner upsert work from the authentication hot path; the owner is authorised directly and normal members use one D1 lookup.
- AI image generation remains removed.
- Catalogue Add/Edit/Remove and manual image upload remain unchanged.

The existing GitHub deployment workflow already applies D1 migrations before deploying the Worker, so no extra manual database step is required when deployed through that workflow.

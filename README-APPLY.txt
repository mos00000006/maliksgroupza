POWERBUILD / MALIKS GROUP HUB
CLOUDFLARE DEPLOY ORDER FIX

PROBLEM
-------
GitHub Actions failed at:
  Sync AI Sidekick secret

Cloudflare returned:
  "Secret edit failed. You attempted to modify a secret, but the latest
   version of your Worker isn't currently deployed."

FIX
---
The deployment order has been changed to:

1. Validate and build
2. Prepare production configuration
3. Apply D1 migrations
4. Deploy the full Hub Worker
5. Sync OPENAI_API_KEY after the Worker version is deployed

FILES
-----
Replace:
  .github/workflows/deploy.yml

Then commit and push.

No application files need to be changed.
No GitHub secrets need to be deleted or recreated.

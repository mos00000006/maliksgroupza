# Cloudflare Worker secret deployment fix — 12 October 2026

The GitHub Actions deployment no longer runs `wrangler secret put` after the Worker deploy.

That post-deploy command could fail when Cloudflare had a newer Worker version that was not the currently deployed version, producing:

`Secret edit failed. You attempted to modify a secret, but the latest version of your Worker isn't currently deployed.`

The workflow now supplies `OPENAI_API_KEY` to the same `wrangler deploy` command through a temporary `.env` secrets file using `--secrets-file`.

Benefits:
- code and the secret are uploaded in the same Worker deployment;
- no second Worker version/deployment is created just to update the secret;
- the temporary secrets file is permission-restricted and deleted after deploy;
- if `OPENAI_API_KEY` is not configured in GitHub, deployment proceeds without attempting to change it.

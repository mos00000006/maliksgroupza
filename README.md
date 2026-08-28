# Maliks Group Hub — Independent Edition

This is the company-controlled Maliks Group Hub. It contains the existing operational modules and no longer depends on ChatGPT Sites for sign-in or hosting.

## What runs the Hub

- **Application:** Cloudflare Worker on a Maliks Group-owned account
- **Secure login:** Cloudflare Access with approved email addresses, one-time email codes, or company SSO/MFA
- **Business data:** Cloudflare D1 database
- **Documents and pictures:** Cloudflare R2 private object storage
- **AI Sidekick:** OpenAI API key stored as an encrypted Cloudflare secret
- **Permissions:** Owner, Developer / Technical Admin, management, member, and read-only roles enforced by the Hub; users only receive their allocated workspaces

The installed app is a PWA. Once the independent URL is live, installed devices receive new versions automatically through the service worker; reinstalling is normally unnecessary.

## Local setup

Requirements: Node.js 22.13 or later and npm.

```bash
npm ci
cp .dev.vars.example .dev.vars
npm run db:migrate:local
npm run dev
```

Local Cloudflare Access simulates the owner account configured in `vite.config.ts`.

## Verification

```bash
npm run check
```

## First company deployment

Upload the contents of this folder to a private GitHub repository, then follow
`GITHUB-CLOUDFLARE-SETUP.md`. GitHub Actions validates, migrates and deploys the
full Hub automatically after the required repository secrets are added.

No ChatGPT account or ChatGPT-hosted authentication is used. Cloudflare Access
provides the independent company sign-in and the Worker verifies its signed JWT.

The owner email is `msallikutti@gmail.com`. Change `OWNER_EMAIL` and `OWNER_NAME` in both `vite.config.ts` and `infrastructure/wrangler.jsonc` only if ownership changes.

## Zak's access

Zak can receive two distinct permissions:

1. **Hub role:** `Developer / Technical Admin` for application administration.
2. **Cloudflare account role:** scoped access to Workers, D1, R2, logs and deployments. He should not receive billing ownership or the owner's recovery methods.

Use individual accounts and MFA. Never share the owner's password or API keys.

See `docs/SECURITY.md` and `docs/OPERATIONS.md` for the handover controls and recurring maintenance.

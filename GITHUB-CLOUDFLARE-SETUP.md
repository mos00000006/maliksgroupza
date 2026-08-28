# GitHub and Cloudflare setup

This repository is the complete independent Maliks Group Hub. GitHub controls
the source and deployment history. Cloudflare runs the application, database,
private files and company sign-in. ChatGPT hosting and ChatGPT login are not used.

## 1. Create the private GitHub repository

1. Create a new **Private** repository named `maliks-group-hub`.
2. Do not generate another README or `.gitignore`.
3. Extract the supplied ZIP.
4. Upload every file and folder from inside the extracted folder to the repository root.
5. Commit to the `main` branch.

The first deployment will wait or fail safely until the Cloudflare resources and
GitHub secrets below exist.

## 2. Create the Cloudflare resources

Use a Maliks Group-owned Cloudflare account:

1. Create D1 database `maliks-group-hub-db` and copy its database ID.
2. Create private R2 bucket `maliks-group-hub-files`.
3. Create or deploy the Worker named `maliks-group-hub`.
4. In Cloudflare Zero Trust, create an Access self-hosted application covering
   the complete Hub hostname.
5. Allow only approved Maliks Group email addresses or the approved company domain.
6. Copy the Access team domain, for example
   `https://maliks-group.cloudflareaccess.com`.
7. Copy the Access application audience tag (AUD).

## 3. Add GitHub repository secrets

In GitHub open **Settings → Secrets and variables → Actions → New repository secret**.
Add these exact names:

| Secret | Value |
| --- | --- |
| `CLOUDFLARE_ACCOUNT_ID` | Maliks Group Cloudflare account ID |
| `CLOUDFLARE_API_TOKEN` | Scoped token with Workers, D1 and R2 deployment access |
| `MALIKS_GROUP_D1_DATABASE_ID` | ID of `maliks-group-hub-db` |
| `CF_ACCESS_TEAM_DOMAIN` | Full `https://...cloudflareaccess.com` team domain |
| `CF_ACCESS_AUD` | Access application audience tag |

Never place these values directly in repository files.

## 4. Deploy

Open **Actions → Deploy Maliks Group Hub → Run workflow**.

The workflow will:

1. Install locked dependencies.
2. Run lint, build and security tests.
3. Apply D1 database migrations.
4. Deploy the complete Worker and frontend.

After it succeeds, open the Worker address or attach a company domain such as
`hub.maliksgroup.co.za`.

## 5. Owner access

The initial Hub owner is `msallikutti@gmail.com`. Add that email to the
Cloudflare Access allow policy. The Hub then creates or restores the Owner / Admin
record after the first verified sign-in.

Staff do not need ChatGPT accounts. They sign in using the identity provider
configured in Cloudflare Access, such as an approved email one-time code or the
company's Microsoft/Google identity system.


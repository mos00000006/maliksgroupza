# Security baseline

## Identity and permissions

- Put the entire Maliks Group Hub Worker behind Cloudflare Access. The Worker accepts identity only from the verified `ctx.access` object and replaces any user-supplied internal identity headers.
- Keep Sulliman as the sole `Owner / Admin` unless ownership is deliberately transferred.
- Give Zak an individual `Developer / Technical Admin` account and scoped Cloudflare access. Do not share credentials.
- Require MFA for the owner and developer. Store account recovery codes offline.
- Review active members and store allocations monthly and immediately disable leavers.
- Store-level and finance access remains enforced by the Hub database; Access login alone does not grant Hub membership.

## Secrets and data

- Put OpenAI and email-provider keys in Cloudflare encrypted secrets, never in source control or browser code.
- Keep R2 private. Files must only be read through authorised Hub API routes.
- Enable database and file retention/backup procedures in `OPERATIONS.md`.
- Do not place customer identity documents, passwords, banking credentials or API keys in task comments.

## Deployment controls

- Keep source in a PowerBuild-owned private Git repository.
- Protect the production branch and require review for changes.
- Give deployment tokens only the minimum Workers, D1 and R2 permissions required.
- Test migrations against a backup before production.
- Keep observability enabled and review authentication, permission and server errors.

## Incident response

If an account or key may be compromised: disable the user in Cloudflare Access and Hub Team Access, revoke active sessions, rotate affected keys, review logs, restore clean data if required, and record the event and response.

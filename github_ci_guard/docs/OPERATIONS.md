# Operations and handover

## Routine backups

- Export D1 before every schema change and keep dated encrypted copies in a company-controlled backup location.
- Replicate or export R2 documents to a separate company-controlled backup location.
- Retain daily backups for 30 days, monthly backups for 12 months, and annual business records for the period required by company policy and South African law.
- Test a restore at least quarterly. A backup is not complete until it can be restored.

Example database export after Cloudflare login:

```bash
mkdir -p backups
npx wrangler d1 export maliks-group-hub-db --remote --output backups/maliks-group-hub.sql
```

Do not commit backup files to Git.

## Release process

1. Create a database and file backup.
2. Run `npm ci` and `npm run check`.
3. Review security and permission changes.
4. Run `npm run db:migrate:production` if migrations changed.
5. Run `npm run deploy`.
6. Test owner login, restricted member login, file upload/download, store access and sign-out.
7. Record the deployed source revision and date.

## Ownership

- Maliks Group owns the Cloudflare account, domain, private source repository, OpenAI API account and email service account.
- The owner controls billing and recovery.
- Zak may maintain code and infrastructure through his own scoped account.
- The Hub continues operating independently of ChatGPT. ChatGPT/Codex can still be used as a development assistant, but it is not required for users to run the Hub.

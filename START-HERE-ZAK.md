# Maliks Group Hub — Developer Start Guide

This Hub is a full-stack application, not a standalone `index.html` website.

For Windows, double-click `START-MALIKS-HUB.bat`. The browser opens the complete Hub automatically when the server is ready. You can also browse directly to `http://127.0.0.1:5173`.

## Open in Visual Studio Code

1. Double-click `OPEN-IN-VSCODE.bat`, or open `Maliks-Group-Hub.code-workspace` from VS Code.
2. Open **Run and Debug** in VS Code.
3. Choose Chrome or Edge.
4. Press **F5**. VS Code prepares the local database, starts the Hub and opens the browser.

The complete application is rendered as HTML in the browser. Keep the `.tsx`, `.ts`, CSS, database and Worker files in the project because they generate the HTML and provide the secure backend features.

## Main entry files

- Browser interface: `app/page.tsx`
- Application layout and metadata: `app/layout.tsx`
- Cloudflare Worker/server entry: `worker/index.ts`
- Build and local runtime configuration: `vite.config.ts`
- Database schema: `db/schema.ts` and `drizzle/`
- Cloud deployment configuration: `infrastructure/wrangler.jsonc`

## Run locally in any browser

Install Node.js 22.13 or newer, open a terminal in this folder, then run:

```bash
npm ci
copy .dev.vars.example .dev.vars
npm run db:migrate:local
npm run dev
```

On macOS or Linux use this instead of the Windows `copy` command:

```bash
cp .dev.vars.example .dev.vars
```

Open the local address printed by Vite, normally:

`http://127.0.0.1:5173`

The local environment simulates the owner login. Production must use Cloudflare Access and must not trust browser-supplied identity headers.

## Production resources required

Create these in the Maliks Group-owned Cloudflare account:

- Worker: `maliks-group-hub`
- D1 database: `maliks-group-hub-db`
- Private R2 bucket: `maliks-group-hub-files`
- Cloudflare Access application for the complete Hub hostname
- OpenAI and email-service keys as encrypted Worker secrets

Before production deployment, replace the placeholder D1 ID in `infrastructure/wrangler.jsonc`, set `MALIKS_GROUP_D1_DATABASE_ID`, apply migrations, and run `npm run deploy`.

Do not commit `.dev.vars`, API keys, database exports, customer documents or recovery credentials to source control.

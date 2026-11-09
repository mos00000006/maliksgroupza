# MaliksPOS Deployment & Acceptance Checklist

## Scope

Independent Cloudflare Worker and installable PWA. The existing Maliks Hub keeps its existing deployment, records, and custom domain. Both apps may use the same D1 binding only after integration validation.

## Required deployment values

| Field | Source | Example only |
|---|---|---|
| Worker name | `wrangler.jsonc` | `maliks-pos` |
| Shared D1 ID | Existing Maliks Hub Worker D1 binding | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` |
| Access team domain | Cloudflare Zero Trust team | `https://team.cloudflareaccess.com` |
| Access AUD | The **new** MaliksPOS Access app | `Access application audience value` |
| Domain | Cloudflare Worker Custom Domain | `pos.maliks.co.za` (example only) |
| GitHub secrets | Actions settings | `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` |

## Safe rollout order

1. Back up your current D1 and save the existing Hub `wrangler` config.
2. Configure and check the existing schema migrations 0033, 0035, 0054 and 0055. Do not create a second competing product catalogue.
3. Configure the separate `maliks-pos` repository and Cloudflare Worker name.
4. Register the POS-only Cloudflare Access self-hosted application and staff access policy.
5. Configure the shared D1 ID, Access team URL and its new app AUD.
6. Run `npm install && npm run check && npm run config:check`.
7. Deploy the new Worker without changing the old Hub Worker.
8. Open the new app as an approved user, confirm Store selector is restricted and published prices are correct.
9. Verify quote create/print/history and Hub Cash Office review visibility. Confirm repeated submit with same UUID cannot duplicate the quotation.
10. Open a different branch staff account and verify isolation.
11. Switch off Wi-Fi after login: edit/save local drafts; confirm server submission and payments remain disabled. Reconnect and reconfirm price before submitting.
12. Attach custom domain, ensure it is included in Access policy, then install the PWA.

## Production stop conditions

- A user can access a branch they do not belong to.
- A product price is accepted without server recomputation.
- A quote can be mistaken for a paid invoice.
- Quote numbering or idempotency behaves inconsistently across Hub and MaliksPOS.
- The POS domain is not protected by Cloudflare Access.
- Live D1 bindings point to a different database from the Hub.
- A user sees a false stock-on-hand amount for a branch without a verified stock ledger.

## Accounting and operations status

This release is **quotation only**. It is not compliant to advertise full accounting integration, VAT tax invoices, debtor settlement, financial cash-up, inventory decrement or dispatch release as live. These items remain disabled until an atomic, auditable system of record exists.

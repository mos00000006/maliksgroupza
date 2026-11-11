CATALOGUE PDF FIX + PRATLEY PRODUCT IMPORT PATCH

Files in this patch:
- app/catalogue-pdf.ts: reserves a clear text area below each product image and enlarges the yellow CODE badge.
- drizzle/0068_pratley_adhesives_catalogue.sql: imports 68 Pratley products with manufacturer codes into Adhesives & Chemicals.

Apply the patch:
1. Extract this ZIP.
2. Copy the included app/ and drizzle/ folders into the root of the existing Hub repository, merging folders and replacing app/catalogue-pdf.ts.
3. Commit and push the changes to the main branch.
4. In GitHub, open the repository's Actions tab and wait for the "Deploy Maliks Group Hub" workflow to finish successfully. That workflow prepares the production configuration, applies D1 migrations, and deploys the Hub using the repository's GitHub secrets.
5. Refresh the Hub and search for Pratley or code 60211.

Do not run npm run db:migrate:production from a local PowerShell terminal unless you have configured the required Cloudflare and Hub secrets locally. The local command reads those values from environment variables; GitHub Actions receives them from repository secrets. The product import uses INSERT OR IGNORE, preserves existing catalogue records, and leaves prices and images unchanged. New Pratley products have blank images and prices for entry in the Hub.

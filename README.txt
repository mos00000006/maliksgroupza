CATALOGUE PDF FIX + PRATLEY PRODUCT IMPORT PATCH

Files in this patch:
- app/catalogue-pdf.ts: reserves a clear text area below each product image and enlarges the yellow CODE badge.
- drizzle/0068_pratley_adhesives_catalogue.sql: imports 68 Pratley products with manufacturer codes into Adhesives & Chemicals.

Apply the patch:
1. Extract this ZIP.
2. Copy the included app/ and drizzle/ folders into the root of the existing Hub repository, merging folders and replacing app/catalogue-pdf.ts.
3. Commit and push the changed files so the Hub deploys.
4. From the repository, run: npm run db:migrate:production
5. Refresh the catalogue and search for Pratley.

Important: uploading the ZIP as a file does not install its contents. The import is a database migration and must be applied to the production D1 database. The SQL uses the catalogue table's required empty-string image fields, preserves existing codes with INSERT OR IGNORE, and does not set prices. New Pratley products will need images uploaded in the Hub.

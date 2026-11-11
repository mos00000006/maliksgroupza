CATALOGUE PDF LAYOUT + PRATLEY IMPORT PATCH

This patch contains only two catalogue changes:
1. Replace app/catalogue-pdf.ts to keep product names below the image and enlarge the yellow CODE label.
2. Add drizzle/0068_pratley_adhesives_catalogue.sql to import 68 Pratley products using their manufacturer codes.

Apply:
- Copy the app/ and drizzle/ folders from this ZIP into the existing Maliks Group Hub repository, merging folders and replacing the matching catalogue-pdf.ts file.
- Commit and push the changes through the normal GitHub workflow.
- After the code deploy, apply the database migration through the Hub's normal D1 migration workflow (npm run db:migrate:production).

The import uses INSERT OR IGNORE. Existing catalogue codes and records are retained; existing prices and images are not updated. New Pratley records have no price or image assigned, so prices can be entered and images uploaded in the Hub.

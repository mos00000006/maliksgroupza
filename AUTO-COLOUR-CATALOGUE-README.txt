COMPANY HUB — AUTOMATIC COLOUR PRODUCT CODES

Apply to Company Hub only, over the existing editable paint colour product code patch.
Copy app, scripts and tests into the repository, replacing matching files. Commit and build normally. The existing colour-code installer now runs this integration automatically. If needed run:
node scripts/install-auto-colour-catalogue.mjs

No new database migration. Keep the previous 0045 colour migration and test database fix.

Use: Load an existing paint product. Enter its new paint colour and your price. Change Product code for this colour, then select Use / save colour code.
An existing active code loads that product. A missing code automatically creates a separate active catalogue product named original product name — colour, with the original description/category and a separate copy of its catalogue picture. Your original product stays unchanged. Review, then Generate to save the new code's price tag and QR.
The price is saved when Generate is clicked; catalogue creation alone does not publish a priced tag. The catalogue list may need refreshing.
The original product picture is reused, not recoloured. Products with no original catalogue picture can use the normal picture upload before generating. Inactive existing codes require manager reactivation.
Management permission and graphic designer sign-in remain required. This patch creates no public product-creation endpoint.

Validation: Four local SQLite/API and integration tests passed, including duplicate and case-varied codes, picture copying, invalid input, inactive products, guard placement, repeat-safe integration and preserving studio tools/build commands. No live deployment or full project check was run.

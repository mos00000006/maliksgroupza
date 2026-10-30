MALIKS CATALOGUE - FINAL REVIEWED PATCH (30 October 2026)

Copy the app/ and tests/ folders into the repository root, replacing matching files.
Commit and push, then run npm run check before production deployment.

Corrections:
- PDF / flipbook: no mixed Fittings section; UG/SV and fitting families separated.
- PDF / flipbook: Alco blinds from existing Homeware records get a dedicated Window Blinds & Treatments section.
- Online catalogue: a new Window Blinds & Treatments category filter; existing imported blinds appear there even without running a database migration, and are excluded from Homeware while browsing.
- New/edited blinds automatically save with the blinds category.
- Stock codes, prices, images and stored legacy product data remain intact.
- Tests updated for intended classification.

Note: This patch does NOT rewrite pre-existing database records. PDF export classification and online catalogue browsing are adjusted at read time.

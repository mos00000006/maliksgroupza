STAFF HARDWARE TRAINING — COMPANY HUB PATCH

Apply to Company Hub only. No BusterBuild Sales App patch is needed.

INSTALL
1. Extract the ZIP into the Company Hub repository, retaining the app/, drizzle/ and tests/ folders. Replace the included price-tag-generator.tsx file.
2. Apply the new database migration 0040_staff_hardware_training.sql using your normal deployment workflow. The project command is:
   npm run db:migrate:production
   This prepares the configuration and applies pending migrations to the production D1 database. Do not remove earlier migration files.
3. Deploy the updated Company Hub, then refresh the browser.
4. In the price tag studio, choose a brand and click Staff training & knowledge tests. Staff can also open the Hub address followed by /training directly and bookmark it. Example after deploying:
   https://maliks-group-hub.moyanamoses006.workers.dev/training

STAFF ACCESS
Staff use their own existing permitted Company Hub accounts; they do not need the graphic designer password to open /training. The normal Hub/Cloudflare sign-in protection remains. Results are attached to the authenticated account, not a typed name. Do not share a manager account for staff tests.

FEATURES
- PowerBuild and BusterBuild colours.
- 36 questions: six each for Tiles, Paint, Plumbing, Tools, Building materials and Customer service.
- Practice mode includes immediate answer checks and explanations; practice scores are not stored.
- Department tests contain six questions. A mixed test has 18 questions, three per department. Questions and answer options are shuffled.
- Untimed tests with an 80% pass threshold; every question must be answered before submission.
- Final test grading happens on the server. Submitted results cannot be replaced by resubmission. A new attempt creates a separate result.
- Answers and explanations for tests are returned after submission. Saved tests retain a snapshot of their questions and options so later edits to the bank do not change those questions.
- Staff see their latest 50 attempts, completed results and topic breakdowns.
- Owner / Admin and Developer / Technical Admin roles may review the latest 200 completed staff tests and their detailed results. Other staff cannot read another account's test.
- Printable result pages; this does not automatically issue a staff certificate.
- Draft answers stay in the current browser tab and survive refresh. Starting another session replaces that local draft. Answers are only stored on the server when submitting a test. Resuming elsewhere starts with unanswered questions.
- Up to ten new test attempts per staff account per South African calendar day; practice remains available. This is a training assessment, not a proctored exam.

QUESTION CONTENT
Coverage and quantity questions state their example figures. Real consumption, joint requirements and product compatibility depend on the exact product and job. No universal brick, adhesive or paint coverage is assumed. Edit the server-only bank in app/lib/hardware-training.ts to add reviewed questions, and update BANK_VERSION. Never import that bank into a client component.
Manufacturer references used for tile and tool selection principles:
https://tal.co.za/tech-support/selection-guides
https://tal.co.za/why-use-tal-bond-as-a-water-substitute
https://www.bosch-professional.com/za/en/drill-bits-2790340-ocs-ac/
https://www.bosch-diy.com/za/en/p/9-piece-metal-and-masonry-drill-bit-set-2762930

PATCH SCOPE
The included price-tag-generator.tsx differs from the previous Staff ID studio menu only by one link. Existing staff ID, QR verification, price tags and other design tools are retained. This patch does not replace the staff ID generator or its QR save fix. It adds one database table and indexes, without modifying catalogue or pricing data. No package changes or new Cloudflare bindings are required.

VALIDATION
Production build, focused lint, four automated test groups and browser flow checks passed. Checks cover scoring, ownership, administrator access, origin protection, hidden answer keys, saved results, repeat submissions, missing migration messages, both brands, draft refresh/resume, failed-save retry and mobile width. New training files have no TypeScript diagnostics with generated Cloudflare runtime types; the repository-wide type check still reports existing issues outside this module.

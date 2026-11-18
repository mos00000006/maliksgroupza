Maliks POS - Phase 34 Supplier Master Files CI Test Correction

Your GitHub run passed 298 of 299 tests. The lone failing Phase 27 test still expected 11 reference kinds, but Phase 34 adds three supplier kinds, bringing the total to 14.

Install:
1. Keep the previously installed Phase 34 supplier master files patch.
2. Copy maliks-operations/tests/phase27-reference-master.test.mjs into the same folder in your GitHub repository, overwriting the old test file.
3. Commit and push to trigger GitHub Actions.

This correction changes only a test expectation; it does not modify application logic, database tables, migrations or accounting operations.

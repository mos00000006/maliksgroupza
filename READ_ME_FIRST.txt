MALIKS GROUP HUB - STORE OPERATIONS STOCK CONTROL V3 (VISIBLE BUTTON)
===================================================================

WHY THIS PATCH
The V2 Stock Control files installed, but the Store Operations dashboard
button required running a separate Node command. The screenshot shows that
the old dashboard still appears, without the new entry.

THIS V3 ZIP NEEDS NO EXTRA NAVIGATION SCRIPT.
It includes the finished dashboard file with the link already inserted.

INSTALLATION
1. BACK UP your existing app/operational-view.tsx and D1 database.
2. Open the extracted ZIP. Copy the app, drizzle, tests, docs, and scripts
   folders into your existing maliksgroupza project root.
3. Allow folder merges and file replacement. The main UI file that gets
   replaced is app/operational-view.tsx. This file was built from the last
   repository copy you supplied; if you have made your own newer changes
   to THIS FILE since then, do not overwrite it blindly; use the optional
   safe integration script from V2 on your current copy instead.
4. Check that VS Code shows the following Git change:
      modified: app/operational-view.tsx
   And check the file contains: Open Stock Control
5. Commit your changes to GitHub (including the modified UI file).
6. After checks and deployment, reopen the PowerBuild Hub, press Ctrl+F5,
   then go to Store Operations. The button is immediately below the large
   blue 'Store Network' banner and above the four KPI tiles.

STOCK FUNCTIONS PATH
   Store Operations > Open Stock Control
   Direct route: /store-operations/stock

DATABASE
The first install also requires migration:
   drizzle/0056_stock_operations_control_register.sql
Test on a disposable local DB first (npm run db:migrate:local); back up the
remote D1 DB and use only your existing verified production migrations.
If 0056 was already applied successfully, DO NOT re-apply it manually.

IMPORTANT
This is a controlled DOCUMENT / APPROVAL register. It does not yet change
real branch stock balances or financial ledgers. Keep TOUCH365 as the live
stock system until a fully reconciled ledger is implemented.

The previous V2 integration command is not necessary for this ZIP. The
integration signature is retained so running that old script won't create
a second card.

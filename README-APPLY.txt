POWERBUILD / MALIKS GROUP HUB
SYSTEM CONTROL CENTRE V1 — PRE-ROLLOUT CONTROL PACK

ADD:
  app/system-control-centre.tsx
  app/system-client-monitor.tsx
  app/api/system-control-centre/route.ts

REPLACE:
  app/page.tsx

NEW OWNER/ADMIN MODULE
----------------------
A new sidebar item appears only for:
- Owner / Admin
- Developer / Technical Admin

It is hidden from:
- EXCO Full Company
- Regional Managers
- Store Managers
- HR
- ordinary users

FEATURES
--------
1. SYSTEM HEALTH
   - D1 database reachability
   - R2 file-storage reachability
   - Push-notification coverage
   - Active/disabled users
   - Workspaces
   - Open/completed tasks
   - Unread notifications
   - Client-error counts
   - Last database snapshot

2. USER ACCESS / EMERGENCY REVOKE
   - View every Hub account
   - Disable access immediately
   - Disabled users can no longer pass Hub authorization
   - Push subscriptions are removed on disable
   - Re-enable users
   - Primary Owner cannot be disabled
   - Current signed-in admin cannot disable themselves

3. ACCESS TEST MODE
   - Select any user
   - Preview the Hub modules they should see
   - Preview assigned workspaces
   - Check role/scope before rollout

4. ADMIN AUDIT
   Exact identity is logged for System Control Centre actions such as:
   - Disable/re-enable user
   - Create database snapshot
   - Download database snapshot
   - Send test push
   - Resolve system errors

5. CRITICAL DATA CHANGE LOG
   D1 triggers are automatically created for core business tables that exist.
   They record INSERT / UPDATE / DELETE events for:
   - Tasks
   - Workspaces
   - Team members
   - Employee records / attendance / warnings / HR records
   - Store specials
   - Promotion planning
   - P&L
   - Developments
   - Wholesale
   - SOPs

   NOTE:
   The generic data-change log records the table/record/time and any available
   user/item field. It should not be treated as proof of the exact human actor
   for routes that do not store an updated_by field. Exact admin identity is
   captured for Control Centre actions.

6. CLIENT ERROR LOG
   A small background monitor records browser runtime errors and unhandled
   promise failures from Hub users.

   This is useful when a store reports:
   "the button did nothing"
   "the page stopped"
   "it didn't save"

7. NOTIFICATION TEST
   Owner/Admin can send a real Hub test notification to their own account.

8. DATABASE SNAPSHOTS
   "Create snapshot" exports business D1 tables to JSON and stores the snapshot
   in R2.

   Excluded for security/noise:
   - VAPID private keys
   - Push subscription cryptographic keys
   - Notifications
   - System logs
   - D1 migration history
   - Promotion read markers

   Team invitation tokens are REDACTED.

   The latest 20 snapshots are retained.
   Snapshots can be downloaded from the Control Centre.

IMPORTANT BACKUP NOTE
---------------------
This is an additional in-Hub business-data snapshot, not a replacement for
Cloudflare D1 Time Travel / formal disaster recovery.

There is deliberately NO one-click restore button in V1 because a production
restore is destructive and should be controlled separately.

DATABASE
--------
No manual migration is required.

The module creates:
- system_audit_log
- system_data_change_log
- system_error_log
- system_backup_snapshots

No new GitHub secret is required.

RECOMMENDED BEFORE COMPANY-WIDE ROLLOUT
---------------------------------------
After deployment:
1. Open System Control Centre.
2. Confirm Database = Online.
3. Confirm File Storage = Online.
4. Send a Test Notification.
5. Create the first database snapshot.
6. Download that snapshot once.
7. Use Access Test Mode on:
   - one Store Manager
   - one Regional Manager
   - HR
   - one Full Company user
8. Disable and re-enable a TEST account to verify emergency revoke.
9. Review the Audit Log.
10. Pilot with Head Office + 2–3 stores before installing for everyone.

POWERBUILD / MALIKS GROUP HUB
SYSTEM CONTROL CENTRE SNAPSHOT FIX V3

REPLACE ONLY:
  app/api/system-control-centre/route.ts

FIX
---
Create Snapshot was failing with:

  D1_ERROR: access to _cf_KV.key is prohibited: SQLITE_AUTH

CAUSE
-----
_cf_KV is an internal Cloudflare D1 table.
The snapshot export must never try to read provider-internal tables.

CHANGES
-------
The snapshot exporter now excludes:
- _cf_*
- cf_*
- _d1_*
- d1_*
- sqlite_*
- system_* tables

It also retains the existing exclusions:
- d1_migrations
- push_vapid_config
- push_subscriptions
- notifications
- promotion_planning_reads

A second defensive check in the export loop prevents future Cloudflare/D1
internal tables from being read even if they appear in sqlite_master.

NO MIGRATION.
NO SECRET CHANGES.

After deployment:
1. Open System Control Centre.
2. Click Create Snapshot again.
3. Backup should change from Missing to Protected.
4. Open Backups and download the generated JSON once to confirm it is usable.

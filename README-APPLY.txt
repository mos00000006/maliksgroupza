POWERBUILD / MALIKS GROUP HUB
STORE CONTROL CENTRE PATCH

FEATURES INCLUDED
=================
1. DIGITAL STORE AUDITS
   - 12 operational audit areas
   - 0-5 scoring per control
   - automatic overall percentage
   - findings and comments
   - corrective action, responsible person and due date
   - manager sign-off
   - up to 5 photo/PDF evidence files
   - corrective action Open / Overdue / Closed tracking
   - audit history per store

2. DAILY MANAGER CHECKLISTS
   - 12 opening-to-closing controls
   - Done / Issue / N/A status
   - issue comments are mandatory
   - automatic compliance percentage
   - manager notes and sign-off
   - photo/PDF evidence
   - daily history per store
   - missing operating days reduce the 7-day executive compliance score

3. EXECUTIVE STORE RANKING
   Weighted score:
   - 35% latest digital audit
   - 30% daily checklist compliance (last 7 operating days; Sundays excluded)
   - 25% Hub task completion
   - 10% corrective-action discipline

   Shows:
   - #1, #2, #3 podium
   - full store league table
   - Green / Amber / Red status
   - audit score
   - checklist score
   - task score
   - open / overdue corrective actions
   - today's checklist status
   - data setup/coverage state

4. EXECUTIVE OVERVIEW INTEGRATION
   - Store Control Score KPI
   - Executive Store Ranking card
   - missing daily checklist alerts
   - overdue corrective action alerts

5. MOBILE QUICK ACTION INTEGRATION
   - Audit Store opens Digital Store Audits
   - Daily Checklist opens Daily Manager Checklists

6. PERMISSIONS
   - Owner/Admin and full-company EXCO see the whole store network
   - restricted users only receive their permitted store(s)
   - read-only users can view but cannot submit/update controls

DATABASE / HOSTING
==================
No new GitHub secret is required.
No manual D1 migration is required.
The API safely creates these D1 tables automatically on first use:
- store_audits
- daily_manager_checklists
- store_control_attachments

Evidence files use the Hub's existing R2 BUCKET binding.
Touch365 is NOT used by this feature.

FILES TO REPLACE / ADD
======================
REPLACE:
- app/page.tsx
- app/executive-overview.tsx
- app/globals.css

ADD:
- app/store-controls.tsx
- app/api/store-controls/route.ts
- app/api/store-controls/shared.ts
- app/api/store-controls/attachments/route.ts
- app/api/store-controls/attachments/[id]/route.ts

DEPLOY
======
1. Copy the files to the same paths in the GitHub repository.
2. Commit changes.
3. Push / allow the normal GitHub Actions deployment to run.
4. After deployment open the Hub and use:
   - Store Audits
   - Daily Checklists
   - Store Ranking

Recommended first rollout:
- Complete one audit for Power Build Krugersdorp.
- Complete today's Daily Manager Checklist for the same store.
- Open Store Ranking and confirm the score updates.
- Then roll the process out to the remaining branches.

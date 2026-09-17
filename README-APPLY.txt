POWERBUILD / MALIKS GROUP HUB
ROLLOUT & ONBOARDING CENTRE V1

ADD:
  app/api/rollout-onboarding/route.ts
  app/onboarding-gate.tsx
  app/rollout-onboarding-centre.tsx

REPLACE:
  app/page.tsx

WHAT USERS SEE
--------------
Every active Hub user gets a first-time setup assistant.

The assistant checks 4 items:

1. CONFIRM ACCESS
   - Shows name
   - Role
   - Assigned workspace(s)
   - User confirms the access is correct

2. INSTALL POWERBUILD HUB
   - Detects installed PWA / Home Screen app
   - Uses native browser install prompt where supported
   - Gives iPhone/iPad Add to Home Screen instructions
   - Installation is only marked complete after the Hub is actually opened
     from an installed app

3. ENABLE NOTIFICATIONS
   - Uses the Hub's EXISTING push-notification registration flow
   - Does not duplicate push keys or subscriptions
   - Checks the server for a real push subscription
   - HR restricted role is correctly shown as "notifications not required"
     because HR should not receive normal task alerts

4. QUICK GUIDE
   - My Work
   - Inbox
   - Store Specials
   - Quick Actions

When all required steps are complete:
  Setup complete ✓

Users can choose "Finish later". The assistant returns in a future session
until setup is complete.

ONBOARDING REMINDERS
--------------------
Owner/Admin can send an onboarding reminder.

Clicking an onboarding reminder opens the setup assistant directly.

OWNER / DEVELOPER DASHBOARD
---------------------------
New sidebar module:
  Rollout & Onboarding

Visible only to:
- Owner / Admin
- Developer / Technical Admin

Hidden from:
- EXCO
- Regional Managers
- Store Managers
- HR
- ordinary users

DASHBOARD SHOWS
---------------
- Total rollout ready
- Hub installed
- Notifications ready
- Training complete
- Access confirmed
- Not started
- Overall completion %
- Readiness by role
- Individual user rollout tracker
- Last seen
- Last reminder
- Push-device count
- Outstanding / Ready / Not Started filters

OWNER ACTIONS
-------------
- Send reminder to one outstanding user
- Remind all outstanding users
- Refresh rollout data

DATABASE
--------
New auto-created table:
  rollout_onboarding

No manual migration.

NOTIFICATIONS
-------------
No new push secret.
No new VAPID configuration.

The module uses the Hub's existing:
- service worker
- push subscription API
- notifications table
- push sender

IMPORTANT
---------
Rollout readiness requires:
- Installed Hub app
- Correct access confirmed
- Quick guide completed
- Real push subscription where the role requires notifications

HR does not require a push subscription because HR remains Employee Records
only and does not receive normal task notifications.

RECOMMENDED ROLLOUT
-------------------
1. Deploy this patch.
2. Log in once on your own installed Hub.
3. Complete the 4-step assistant.
4. Open Rollout & Onboarding.
5. Add/test one Store Manager.
6. Add/test one Regional Manager.
7. Add/test HR.
8. Pilot Head Office + 2–3 stores.
9. Use "Remind outstanding" during rollout.
10. Expand to the remaining stores after the pilot is stable.

POWERBUILD / MALIKS GROUP HUB
NEXT PROMOTION PLANNING V2 — ASYNC DECISION ROOM

ADD/REPLACE:
  app/promotion-planning.tsx
  app/api/promotion-planning/shared.ts
  app/api/promotion-planning/route.ts
  app/store-specials.tsx

KEY CHANGE
----------
Promotion dates are NO LONGER required when opening the planning room.

The date itself is now one of the decisions managers can propose, debate and
agree on.

NEW "DECISION ROOM"
-------------------
Managers can make proposals under:
- Promotion Date / Period
- Campaign Theme / Name
- Focus Categories
- Hero Products
- Pricing / Deal Structure
- Combo Deals
- Supplier Support
- Stock Commitment
- Marketing / Advertising
- Display / Merchandising
- Customer Target
- Budget / Spend
- Other

Managers then vote:
- Support
- Prefer alternative
- Need discussion

They can also leave a short explanation.

Head Office can mark each decision:
- Proposed
- Discuss
- Agreed
- Closed

This creates a permanent record of what the group agreed instead of relying on
a meeting or WhatsApp chat.

NOTIFICATION CIRCLE / NUMBER
----------------------------
The "💡 Next Promotion Planning" button now has a red notification badge.

Example:
  💡 Next Promotion Planning   (7)

The number counts NEW planning activity since that user last opened the planning
room, excluding their own activity.

Activity counted includes:
- New decision proposals
- Decision votes
- Product suggestions
- Product votes
- Branch comments
- Head Office status changes

When the user opens Next Promotion Planning, the activity is marked as seen and
the badge clears.

STORE / REGIONAL / FULL COMPANY ACCESS
--------------------------------------
- Store Manager: contributes for assigned store only.
- Regional / multi-store manager: contributes for assigned stores.
- Department Manager: contributes for authorised store/workspace.
- Full Company management: sees all branches and controls final statuses.
- HR: still Employee Records only.

MEETING-REPLACEMENT FEATURES
----------------------------
Dashboard shows:
- Branch participation %
- Outstanding branches
- Open decisions
- Agreed decisions
- Product ideas
- Approved items
- Branch thoughts

"What changed" activity feed:
Managers can immediately see what happened since the last time they checked.

"Remind outstanding branches":
Head Office can notify stores that still have not contributed.

Product collaboration is retained:
- Product code/name/category
- Brand/supplier
- Current price
- Suggested promo price
- Expected quantity
- Reason / demand
- Competitor note
- Merchandising idea
- Strong Yes / Yes / Maybe / No manager support

DATABASE
--------
No manual migration required.

New auto-created tables:
- promotion_decisions
- promotion_decision_votes
- promotion_planning_activity
- promotion_planning_reads

Existing promotion planning tables are retained.

No new GitHub secret required.

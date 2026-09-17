POWERBUILD / MALIKS GROUP HUB
NEXT PROMOTION PLANNING / PROMOTION LAB V1

ADD:
  app/promotion-planning.tsx
  app/api/promotion-planning/shared.ts
  app/api/promotion-planning/route.ts

REPLACE:
  app/store-specials.tsx
  app/page.tsx

WHAT IT DOES
------------
Inside Store Specials there is now:
  💡 Next Promotion Planning

Full-company management can open a planning cycle with:
- Promotion name/theme
- Planned promotion dates
- Manager input deadline
- Planning brief

Managers receive an Inbox / push notification to contribute.

EVERY BRANCH MANAGER CAN ADD
----------------------------
- Product code
- Product name
- Category
- Brand / supplier
- Current selling price
- Suggested promotion price
- Expected promotion quantity
- Why the item should be promoted
- Competitor / market observations
- Display / merchandising idea

MANAGER COLLABORATION
---------------------
Managers can review product ideas from other branches and record:
- Strong Yes
- Yes
- Maybe
- No
- A comment explaining their view

The Hub calculates a support score so strong group-wide ideas rise to the top.

BRANCH THOUGHTS
---------------
Managers can also add general feedback under:
- Products
- Pricing
- Stock
- Competitors
- Marketing
- Display / Merchandising
- Customer Demand
- Other

HEAD OFFICE CONTROL
-------------------
Full-company management sees:
- Branches responded / total branches
- Participation %
- Outstanding branches
- Total product ideas
- Approved item count
- Branch comment count
- Product support scores
- Reminder button for outstanding branches

Head Office can set each proposed item to:
- Suggested
- Under Review
- Approved
- Hold
- Declined

Planning cycle status:
- Open
- Reviewing
- Finalised

ACCESS
------
- Store Manager: contributes for assigned store only.
- Regional / multi-store manager: contributes for assigned stores.
- Full Company: sees/manages all branches.
- HR remains Employee Records only.

DATABASE
--------
No manual migration required. Tables create automatically:
- promotion_plans
- promotion_suggestions
- promotion_feedback
- promotion_comments

No new GitHub secret required.

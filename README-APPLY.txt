POWERBUILD / MALIKS GROUP HUB
PROMOTION PLANNING V4 — MANAGER DISCUSSION + THOUGHT BOARD

REPLACE:
  app/promotion-planning.tsx
  app/api/promotion-planning/route.ts
  app/api/promotion-planning/shared.ts

KEY CHANGE: NO BRANCH SELECTION IN THE DISCUSSION
--------------------------------------------------
Promotion Planning is now treated as one group management discussion.

The UI no longer asks managers to select a branch when:
- proposing a decision;
- voting on a decision;
- suggesting a product;
- voting/commenting on a product;
- adding general comments;
- adding manager thoughts.

Cards no longer display branch names either.

Access control is still enforced from the signed-in user's Hub role and assigned
workspaces, but the discussion itself feels like one management room.

NEW: MANAGER THOUGHTS
---------------------
Managers now have a fast "Add manager thought" button.

Thought types:
- Product / Item Idea
- Pricing Idea
- Customer Demand
- Stock / Availability
- Competitor Insight
- Promotion Mechanics
- Marketing Idea
- Display / Merchandising
- Supplier Opportunity
- Margin / Profitability
- Risk / Concern
- Other

A thought can optionally include:
- Item / product name
- Product code
- Current price
- Suggested promotion price
- Expected quantity / requirement
- Full explanation
- Impact: High / Medium / Low

OTHER MANAGERS CAN REACT
------------------------
- Strong idea
- Agree
- Consider
- Not for this promotion
- Optional comment / alternative

The Hub calculates a support score so useful thoughts rise to the top.

HEAD OFFICE CONTROL
-------------------
Thought status:
- New
- Discuss
- Shortlist
- Agreed
- Closed

This allows quick thoughts to become actual promotion actions.

MANAGER PARTICIPATION
---------------------
The dashboard now tracks managers, not branches:
  Managers active / Managers invited

Full-company users can see managers who have not contributed and send:
  "Remind managers still to contribute"

The participation calculation includes:
- Manager thoughts
- Thought reactions
- Decision proposals
- Decision votes
- Product ideas
- Product votes
- General comments

NOTIFICATION BADGE
------------------
The existing red Next Promotion Planning badge continues to count new thoughts,
reactions, votes and comments since the user last opened the planning room.

DATABASE
--------
No manual migration.

New auto-created tables:
- promotion_thoughts
- promotion_thought_reactions

No new GitHub secret.

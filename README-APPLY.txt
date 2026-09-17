POWERBUILD / MALIKS GROUP HUB
PROMOTION PLANNING V6 — COMPLETE CATCH-UP ARCHIVE

REPLACE:
  app/promotion-planning.tsx
  app/api/promotion-planning/route.ts

PURPOSE
-------
The Finalized Archive is now a complete "I missed the discussion — catch me up"
record.

When a user was offline, away from work, or did not participate in the live
planning room, they can later open the finalized promotion and see EVERYTHING
that was discussed.

ARCHIVE NOW SHOWS
-----------------
1. FULL DECISION DISCUSSION
   - Every decision proposal, not only agreed ones
   - Proposal status
   - Who proposed it
   - Reason/rationale
   - Every manager vote
   - Every vote comment

2. FULL PRODUCT DISCUSSION
   - Every product suggested, not only approved products
   - Product code/category
   - Current price
   - Suggested promotional price
   - Expected quantity
   - Brand/supplier
   - Why it was suggested
   - Competitor / market note
   - Display / merchandising idea
   - Final product status
   - Every manager support vote/comment

3. FULL MANAGER THOUGHTS
   - Every thought regardless of final status
   - Thought type
   - Impact
   - Item/product
   - Pricing and quantity
   - Complete explanation
   - Every manager reaction/comment

4. GENERAL DISCUSSION
   - Every general manager comment
   - Topic
   - Author
   - Date/time

5. COMPLETE CHRONOLOGICAL TIMELINE
   - Replays the planning room from first event to last
   - Who did what
   - Date/time
   - Activity description

CATCH-UP DASHBOARD
------------------
Shows:
- Number of participants
- Decision proposals
- Product ideas
- Manager thoughts
- General comments
- Activity events

The archive remains READ-ONLY.

IMPORTANT
---------
The API no longer limits promotion planning activity to only the latest 120
events. The complete stored activity history is returned so older finalized
rooms can retain their full timeline.

No database migration.
No new GitHub secret.

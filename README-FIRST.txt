REMOVE THE VIEW WEBSITE BUTTON FROM THE CATALOGUE / HUB HEADER
==============================================================

This patch removes only the yellow “View Website” button shown beside Quick,
Inbox and Access. It does not remove the PowerBuild customer website, the live
Hub catalogue connection, product sync, public product pages or E-Commerce
Control website link.

INSTALL
1. Copy the scripts/ folder into the root of the Maliks Group Hub repository.
2. From the repository root run:
      python3 scripts/remove-catalogue-website-button.py
   On Windows, use “python” if “python3” is unavailable.
3. Commit, push and allow the normal Cloudflare deployment to complete.

The script creates a one-time backup beside app/page.tsx and is safe to run
again. No database migration is required.

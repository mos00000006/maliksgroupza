Replace the existing file:
  drizzle/0018_catalogue_assorted_display.sql
with the file in this patch, then rerun the same D1 migration command.

Because migration 0018 failed, Cloudflare has not recorded it as successful, so it is safe to retry after replacing the file.

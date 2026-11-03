#!/usr/bin/env python3
"""Add the public PowerBuild website gate and Hub button without replacing app/page.tsx."""
from pathlib import Path
import re, sys

repo = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else Path.cwd()
worker_path = repo / "worker" / "index.ts"
page_path = repo / "app" / "page.tsx"
control_path = repo / "app" / "ecommerce-control.tsx"
for required in (worker_path, page_path):
    if not required.is_file():
        raise SystemExit(f"ERROR: {required.relative_to(repo)} not found. Run this script from the Hub repository root.")

worker = worker_path.read_text(encoding="utf-8")
original_worker = worker
import_line = 'import { isPublicPowerBuildWebsiteRequest } from "../app/lib/powerbuild-website-public";\n'
if "../app/lib/powerbuild-website-public" not in worker:
    worker = import_line + worker
if "!isPublicPowerBuildWebsiteRequest(request)" not in worker:
    anchor = "!isPublicAsset(url.pathname)"
    if anchor not in worker:
        raise SystemExit("ERROR: Worker access guard differs. No files were changed.")
    worker = worker.replace(anchor, f"!isPublicPowerBuildWebsiteRequest(request) && {anchor}", 1)

page = page_path.read_text(encoding="utf-8")
original_page = page
link = '<a href="/powerbuild/index.html" target="_blank" rel="noopener noreferrer" title="Open the live PowerBuild customer website" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "10px 14px", background: "#ffcf26", color: "#12283d", borderRadius: 11, fontWeight: 850, textDecoration: "none", whiteSpace: "nowrap", fontSize: 12 }}>↗ View Website</a>'
anchor_pattern = re.compile(r'<a\b(?:(?!</a>).)*View\s+(?:PowerBuild\s+)?Website(?:(?!</a>).)*</a>', re.I | re.S)
match = anchor_pattern.search(page)
if match:
    # Keep the Hub's existing button class and styling; update only its destination.
    existing_link = match.group(0)
    updated_link, replacements = re.subn(
        r'href=(["\'])[^"\']*\1',
        'href="/powerbuild/index.html"',
        existing_link,
        count=1,
    )
    if replacements != 1:
        raise SystemExit("ERROR: Existing Hub website button has no usable href. No files were changed.")
    page = page[:match.start()] + updated_link + page[match.end():]
elif 'href="/powerbuild/index.html"' not in page:
    actions = '<div className="actions">'
    if actions not in page:
        raise SystemExit("ERROR: Hub header actions layout differs. No files were changed.")
    page = page.replace(actions, actions + "\n            " + link, 1)

control = control_path.read_text(encoding="utf-8") if control_path.is_file() else None
original_control = control
if control is not None:
    control = re.sub(
        r'<a\s+href="/shop"\s+target="_blank"\s+rel="noreferrer">(?:Open B2C Store|View PowerBuild Website)\s*↗</a>',
        '<a href="/powerbuild/index.html" target="_blank" rel="noreferrer">View PowerBuild Website ↗</a>',
        control,
        count=1,
    )

# Write only after every expected integration point validated successfully.
changes = []
for path, before, after in ((worker_path, original_worker, worker), (page_path, original_page, page), (control_path, original_control, control)):
    if before is not None and after != before:
        backup = path.with_suffix(path.suffix + ".before-powerbuild-website")
        if not backup.exists():
            backup.write_text(before, encoding="utf-8")
        path.write_text(after, encoding="utf-8")
        changes.append(str(path.relative_to(repo)))
print("PowerBuild website integration ready.")
print("Updated: " + (", ".join(changes) if changes else "already installed"))
print("Customer website: /powerbuild/index.html")

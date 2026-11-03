#!/usr/bin/env python3
"""Remove the injected catalogue/header website button without changing the website."""
from pathlib import Path
import re
import sys

repo = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else Path.cwd()
page_path = repo / "app" / "page.tsx"
if not page_path.is_file():
    raise SystemExit(
        f"ERROR: {page_path} not found. Run this script from the Maliks Group Hub repository root."
    )

source = page_path.read_text(encoding="utf-8")

# This is the exact button installed beside Quick, Inbox and Access. The visible
# text is deliberately checked so other PowerBuild website links stay available.
button = re.compile(
    r"\s*<a\b(?:(?!</a>).)*?href=([\"'])/powerbuild/index\.html\1"
    r"(?:(?!</a>).)*?>\s*↗\s*View\s+Website\s*</a>",
    re.IGNORECASE | re.DOTALL,
)
updated, removed = button.subn("", source)

if removed == 0:
    print("Catalogue View Website button is already removed. No files changed.")
    raise SystemExit(0)

backup = page_path.with_suffix(page_path.suffix + ".before-remove-catalogue-website-button")
if not backup.exists():
    backup.write_text(source, encoding="utf-8")
page_path.write_text(updated, encoding="utf-8")

print(f"Removed {removed} catalogue View Website button(s).")
print("The PowerBuild customer website and live catalogue connection remain active.")

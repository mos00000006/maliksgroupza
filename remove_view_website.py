#!/usr/bin/env python3
"""Remove only PowerBuild 'View Website' links installed by prior Hub website patch."""
from pathlib import Path
import re

root = Path(__file__).resolve().parent
# Use repository root supplied as argument, or current directory.
import sys
repo = Path(sys.argv[1]).resolve() if len(sys.argv)>1 else Path.cwd()
page = repo / 'app/page.tsx'
if not page.exists():
    raise SystemExit('Cannot find app/page.tsx. Run from the Hub repository root.')
s = page.read_text(encoding='utf-8')
# Remove exact self-contained header link only.
pattern = re.compile(r'^\s*<a href="/shop" target="_blank" rel="noopener noreferrer" title="Open the live PowerBuild customer website"[^\n]*>↗ View Website</a>\s*\n', re.M)
s2, count = pattern.subn('\n', s)
if count:
    page.write_text(s2, encoding='utf-8')
print(f'Header View Website button removed: {count}; no other Hub files changed.')

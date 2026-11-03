#!/usr/bin/env python3
"""Remove only Hub header View Website links; preserve all other modules."""
from pathlib import Path
import re, sys
repo=Path(sys.argv[1]).resolve() if len(sys.argv)>1 else Path.cwd()
p=repo/'app'/'page.tsx'
if not p.is_file():
    raise SystemExit('ERROR: app/page.tsx not found. Run from the GitHub repo root.')
s=p.read_text(encoding='utf-8')
# Match a complete JSX anchor on one or multiple lines: only targets the View Website link.
anchors=re.compile(r'<a\b(?:(?!</a>).)*</a>',re.S)
removed=[]
def replace(m):
    tag=m.group(0)
    if (re.search(r'\bView\s+(?:PowerBuild\s+)?Website\b',tag,re.I)
        and (re.search(r'href\s*=\s*[\"\'](?:/shop|/shop/|https?://[^\"\']+)[\"\']',tag,re.I)
             or re.search(r'title\s*=\s*[\"\'][^\"\']*customer website',tag,re.I))):
        removed.append(tag)
        return ''
    return tag
out=anchors.sub(replace,s)
# Fail safely for unknown layouts rather than claiming success.
if out==s:
    if re.search(r'View\s+(?:PowerBuild\s+)?Website',s,re.I):
        raise SystemExit('No recognized button removed. A View Website reference remains; please share your latest app/page.tsx.')
    print('Already removed: no View Website link in app/page.tsx.')
    sys.exit(0)
backup=p.with_suffix('.tsx.view-website-backup')
backup.write_text(s,encoding='utf-8')
p.write_text(out,encoding='utf-8')
print(f'Removed {len(removed)} View Website link(s) from app/page.tsx.')
print(f'Backup: {backup.name}')

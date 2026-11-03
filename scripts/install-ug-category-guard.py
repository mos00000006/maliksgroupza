#!/usr/bin/env python3
"""Patch existing catalogue POST/PATCH category assignments without replacing routes.
Idempotent; aborts without writing on unexpected source.
"""
from pathlib import Path
files=[
    (Path('app/api/catalogue/route.ts'), '../../catalogue-ug-category'),
    (Path('app/api/catalogue/[id]/route.ts'), '../../../catalogue-ug-category'),
]
new={}
for path, imp in files:
    if not path.is_file(): raise SystemExit(f'Missing {path}. No files changed.')
    source=path.read_text(encoding='utf-8')
    expected='const category = String(form.get("category") || "General").trim() || "General";' if path.name=='route.ts' and path.parent.name=='catalogue' else 'const category = String(form.get("category") || existing.category || "General").trim() || "General";'
    if 'correctUgCategory(name,' in source:
        print(f'Already protected: {path}')
        continue
    if source.count(expected)!=1: raise SystemExit(f'Unexpected category assignment in {path}. No files changed.')
    importline=f'import {{ correctUgCategory }} from "{imp}";'
    # Import insertion after first existing import line
    lines=source.splitlines(keepends=True)
    first=next((i for i,line in enumerate(lines) if line.startswith('import ')),None)
    if first is None:raise SystemExit(f'No import statement in {path}. No files changed.')
    lines.insert(first+1, importline+'\n')
    source=''.join(lines)
    raw=expected.replace('const category = ','const enteredCategory = ')
    source=source.replace(expected,raw+'\n  const category = correctUgCategory(name, enteredCategory);')
    new[path]=source
for path,source in new.items():
    path.write_text(source,encoding='utf-8');print(f'Protected new catalogue entries: {path}')

"""Safely add actual hardware departments to the EXISTING app files.
Run from the GitHub repository root. Does not replace any existing page component.
"""
from pathlib import Path
import re

cat=Path('app/catalogue.tsx')
pdf=Path('app/catalogue-pdf.ts')
if not cat.exists() or not pdf.exists():
    raise SystemExit('Run from the repository root (app/catalogue.tsx missing).')

text=cat.read_text()
match=re.search(r'const CATALOGUE_CATEGORIES\s*=\s*\[(.*?)\]\s*as const;',text,re.S)
if not match:
    raise SystemExit('Unexpected catalogue category list. No files changed.')
new_categories=[
'Plumbing Pipes','Underground (UG)','Soil & Vent (SV)','HDPE & Compression Fittings',
'Copper & Brass Fittings','Galvanised Fittings','PVC & Pressure Fittings','Waste & Trap Fittings','Plumbing Accessories',
'Window Blinds & Treatments'
]
existing=match.group(1)
missing=[x for x in new_categories if f'"{x}"' not in existing]
updated=existing
if missing:
    index=updated.find('"Electrical & Lighting"')
    if index<0:raise SystemExit('Unknown catalogue structure. No files changed.')
    updated=updated[:index]+''.join('  "'+s+'",\n  ' for s in missing)+updated[index:]
new_text=text[:match.start(1)]+updated+text[match.end(1):]

pdf_text=pdf.read_text()
match2=re.search(r'const CATEGORY_ORDER\s*=\s*\[(.*?)\]\s*as const;',pdf_text,re.S)
if not match2:raise SystemExit('Unknown PDF ordering structure. No files changed.')
existing2=match2.group(1)
existing2=re.sub(r'^\s*"Fittings",\s*\n','\n',existing2,flags=re.M)
missing2=[x for x in new_categories if f'"{x}"' not in existing2]
if missing2:
    index=existing2.find('"Electrical & Lighting"')
    if index<0:raise SystemExit('Unexpected PDF ordering. No files changed.')
    existing2=existing2[:index]+''.join('  "'+s+'",\n  ' for s in missing2)+existing2[index:]
new_pdf=pdf_text[:match2.start(1)]+existing2+pdf_text[match2.end(1):]
cat.write_text(new_text)
pdf.write_text(new_pdf)
print('Added category filters:', ', '.join(missing) if missing else '(already present)')
print('Added PDF order categories:',', '.join(missing2) if missing2 else '(already present)')
print('Existing PDF cover layout, catalogue UI, business data and other Hub modules preserved.')

import re,json,os,csv
from pathlib import Path
root=Path(__file__).resolve().parents[1]
src=Path('/mnt/data/catalogue_audit_src/drizzle')
rows=[]
for filename in ['0014_wholesale_one_by_one_catalogue_fix.sql','0028_pulse_decor_catalogue_import.sql']:
 s=(src/filename).read_text()
 if filename.startswith('0014'):
  found=re.findall(r"VALUES \('((?:''|[^'])*)','((?:''|[^'])*)','((?:''|[^'])*)','((?:''|[^'])*)'",s)
 else:
  found=re.findall(r"SELECT '((?:''|[^'])*)','((?:''|[^'])*)','((?:''|[^'])*)','((?:''|[^'])*)'",s)
 for code,name,desc,category in found:
  rows.append(dict(code=code.replace("''","'"),name=name.replace("''","'"),description=desc.replace("''","'"),category=category.replace("''","'"),source=filename))
(root/'audit/source_products.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
print('Loaded',len(rows),'records')

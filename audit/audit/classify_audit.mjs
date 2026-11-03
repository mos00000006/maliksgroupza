import fs from 'node:fs';
import { cataloguePdfCategory } from '../app/catalogue-pdf-grouping.ts';
const rows=JSON.parse(fs.readFileSync(new URL('./source_products.json',import.meta.url)));
const csv=(str)=>'"'+String(str??'').replaceAll('"','""')+'"';
const changes=[],review=[];
for (const p of rows) {
 const to=cataloguePdfCategory(p);
 if (to===p.category) continue;
 const clear= !['General Hardware','Plumbing Accessories','General','Homeware','Roofing & Gutters'].includes(to) ||
    (to==='Roofing & Gutters' && /(?:GUTTER|ROOF|DOWNPIPE)/i.test(p.name)) ||
    (to==='Plumbing Accessories' && /MASTERBATT/i.test(p.name));
 const record={...p,proposed:to,classification:clear?'specific':'needs-review'};
 (clear?changes:review).push(record);
}
const out=fs.createWriteStream(new URL('./proposed_changes.csv',import.meta.url));
out.write('code,name,old_category,proposed_category,source\n');
for(const p of changes)out.write([p.code,p.name,p.category,p.proposed,p.source].map(csv).join(',')+'\n');out.end();
const r=fs.createWriteStream(new URL('./needs_review.csv',import.meta.url));
r.write('code,name,old_category,suggested_category,reason\n');
for(const p of review)r.write([p.code,p.name,p.category,p.proposed,'Ambiguous product family; verify physically or against supplier specification'].map(csv).join(',')+'\n');r.end();
const esc=(str)=>"'"+str.replaceAll("'","''")+"'";
const sql=['-- PREVIEW FIRST: list of products to be reclassified is in audit/proposed_changes.csv.',
'-- Applies only to known imported stock codes and system-maintained rows.',
'-- Does not delete products, change price, image, code, status, or modify user-edited rows.',
'-- Run against a D1 backup/staging copy first; production only after review.',
'BEGIN TRANSACTION;'];
for(const p of changes){
 sql.push(`UPDATE catalogue_products SET category=${esc(p.proposed)}, updated_by='system:category-audit-v2', updated_at=datetime('now') WHERE code=${esc(p.code)} COLLATE NOCASE AND active=1 AND (updated_by LIKE 'system:%' OR updated_by IS NULL OR updated_by='') AND category<>${esc(p.proposed)};`);
}
sql.push('COMMIT;');
fs.writeFileSync(new URL('../drizzle/CATALOGUE_REVIEWED_CLASSIFICATION.sql',import.meta.url),sql.join('\n')+'\n');
console.log(JSON.stringify({sourceCount:rows.length,clearChanges:changes.length,needsReview:review.length,unchanged:rows.length-changes.length-review.length},null,2));

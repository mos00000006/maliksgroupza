export function parsePaintColour(value:unknown):string|undefined {
 if(value===undefined)return undefined;
 if(typeof value!=='string'||value.trim().length>80||/[\u0000-\u001f\u007f\u2028\u2029]/.test(value))throw new Error('Enter a paint colour of up to 80 characters on one line.');
 return value.trim();
}
export function catalogueSearch(query:string){
 const q=query.trim();if(!q||q.length>150)throw Error('Enter a product name or code, up to 150 characters.');
 const terms=q.split(/\s+/);if(terms.length>20)throw Error('Use up to 20 search words.');const escaped=(value:string)=>value.replace(/[\\%_]/g,c=>'\\'+c);
 const clause=terms.map(()=>"(name LIKE ? ESCAPE '\\' COLLATE NOCASE OR code LIKE ? ESCAPE '\\' COLLATE NOCASE)").join(' AND ');
 return {sql:`SELECT id,code,name,category FROM catalogue_products WHERE active=1 AND ${clause} ORDER BY CASE WHEN upper(trim(code))=upper(?) THEN 0 WHEN lower(name)=lower(?) THEN 1 ELSE 2 END,name,code,id LIMIT 31`,bindings:[...terms.flatMap(t=>['%'+escaped(t)+'%','%'+escaped(t)+'%']),q,q]};
}

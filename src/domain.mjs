/** Shared business rules. All amounts are ZAR cents, VAT-inclusive. */
export const VAT_RATE = 15;
export const SALES_ROLE = 'Sales / Tills';
export const MANAGER_ROLES = new Set(['Owner / Admin','Developer / Technical Admin','Store Manager','Regional Manager']);
export function allowPosRole(role, scope) {
  return role === SALES_ROLE || MANAGER_ROLES.has(role) || (role === 'Executive / EXCO' && scope === 'Full company');
}
export function isManager(role, scope) {
  return MANAGER_ROLES.has(role) || (role === 'Executive / EXCO' && scope === 'Full company');
}
export function allowedBranches(member, activeBranches) {
  if (!member) return [];
  if (member.role === 'Owner / Admin' || member.role === 'Developer / Technical Admin' ||
    (member.role === 'Executive / EXCO' && member.access_scope === 'Full company')) return [...activeBranches];
  let access = [];
  try { const val = JSON.parse(member.workspace_access || '[]'); if (Array.isArray(val)) access = val.filter(x => typeof x === 'string').map(x => x.trim()).filter(Boolean); }
  catch { access = []; }
  if (member.access_scope === 'Assigned workspace') access = access.slice(0,1);
  if (!access.length && member.department) access = [member.department];
  return activeBranches.filter(x => access.some(a => a.toLowerCase() === x.toLowerCase()));
}
export function getBranch(branches, requested) {
  const raw = typeof requested === 'string' ? requested.trim() : '';
  if (!raw && branches.length === 1) return branches[0];
  return branches.find(x => x.toLowerCase() === raw.toLowerCase()) || null;
}
export function brandForBranch(branch) { return /buster\s*build/i.test(branch) ? 'busterbuild' : 'powerbuild'; }
export function quoteNumber(id) {
  if (!Number.isSafeInteger(id) || id <= 0) throw Error('Invalid quotation number');
  return 'Q-'+String(id).padStart(8,'0');
}
export function quoteId(raw) {
  const found = /^Q-(\d{1,12})$/i.exec(String(raw||'').trim());
  const n = found ? Number(found[1]) : NaN;
  return Number.isSafeInteger(n) && n>0 ? n : null;
}
export function validatedLines(raw) {
  if (!Array.isArray(raw) || raw.length < 1 || raw.length > 100) throw Error('Select 1–100 products.');
  const seen = new Set();
  return raw.map(x => {
    const product_id=Number(x?.product_id), quantity=Number(x?.quantity), expected_price_cents=Number(x?.expected_price_cents);
    if (!Number.isSafeInteger(product_id) || product_id<1 || seen.has(product_id)) throw Error('Invalid or duplicated product line.');
    if (!Number.isFinite(quantity) || quantity<0.001 || quantity>9999 || Math.abs(quantity*1000-Math.round(quantity*1000))>0.000001) throw Error('Quantity must be positive, maximum three decimals.');
    if (!Number.isSafeInteger(expected_price_cents)||expected_price_cents<1||expected_price_cents>100000000) throw Error('Invalid published product price.');
    seen.add(product_id);
    return {product_id,quantity:Math.round(quantity*1000)/1000,expected_price_cents};
  }).sort((a,b)=>a.product_id-b.product_id);
}
export function calculateQuote(rows) {
  if (!rows.length) throw Error('Quotation is empty.');
  let total=0;
  const lines=rows.map(r=>{
    const line_total_cents=Math.round(Number(r.price_cents)*Number(r.quantity));
    if (!Number.isSafeInteger(line_total_cents)||line_total_cents<=0) throw Error('Invalid line total.');
    total+=line_total_cents;
    if (!Number.isSafeInteger(total)||total>1000000000) throw Error('Quotation amount exceeds limit.');
    return {...r,line_total_cents};
  });
  const vat_cents=Math.round(total*VAT_RATE/(100+VAT_RATE));
  return {lines,net_cents:total-vat_cents,vat_cents,total_cents:total};
}
export function canonicalQuotePayload(branch,customerName,customerContact,notes,lines) {
  return JSON.stringify({branch,customerName,customerContact,notes,lines});
}
export function productFilter(q) {return `%${q.toLowerCase().replaceAll('%','\\%').replaceAll('_','\\_')}%`;}
export function serialQuote(row) {
  return { id:row.id,number:quoteNumber(row.id),branch:row.branch,status:row.status,
    customer_name:row.customer_name,customer_contact:row.customer_contact,
    submitted_by_name:row.submitted_by_name,submitted_by_email:row.submitted_by_email,
    notes:row.notes,net_cents:row.net_cents,vat_cents:row.vat_cents,total_cents:row.total_cents,
    created_at:row.created_at,lines:JSON.parse(row.lines_json||'[]') };
}

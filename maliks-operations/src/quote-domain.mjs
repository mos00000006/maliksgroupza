/** Deterministic VAT-inclusive quotation arithmetic, shared by API and tests. */
export function quoteNumber(id) {
  if (!Number.isSafeInteger(id) || id < 1) throw new Error('Invalid quotation id');
  return `Q-${String(id).padStart(8,'0')}`;
}
export function quoteId(input) {
  const text=String(input||'').trim().toUpperCase();
  const match=/^Q-(\d{1,12})$/.exec(text);
  const id=match?Number(match[1]):Number.NaN;
  return Number.isSafeInteger(id)&&id>0?id:null;
}
export function validateQuoteLines(raw) {
  if (!Array.isArray(raw) || raw.length<1 || raw.length>100) throw new Error('Select 1–100 product lines.');
  const seen=new Set();
  return raw.map(item=>{
    const productId=Number(item?.product_id);
    const qty=Number(item?.quantity);
    const expected=Number(item?.expected_price_cents);
    if (!Number.isSafeInteger(productId)||productId<=0||seen.has(productId))throw new Error('Product list contains an invalid or repeated item.');
    if(!Number.isFinite(qty)||qty<0.001||qty>9999||Math.abs(qty*1000-Math.round(qty*1000))>0.000001)throw new Error('Enter valid quantities to three decimal places.');
    if(!Number.isSafeInteger(expected)||expected<1||expected>100000000)throw new Error('A valid published price is required for each item.');
    seen.add(productId);
    return {product_id:productId,quantity:Math.round(qty*1000)/1000,expected_price_cents:expected};
  }).sort((a,b)=>a.product_id-b.product_id);
}
export function calculateQuote(lines) {
  if(!Array.isArray(lines)||!lines.length)throw new Error('Quotation must have items.');
  let total=0;
  const detailed=lines.map(line=>{
    if(!Number.isSafeInteger(line.price_cents)||line.price_cents<1||!Number.isFinite(line.quantity)||line.quantity<=0)throw new Error('Invalid quoted line.');
    const line_total_cents=Math.round(line.price_cents*line.quantity);
    if(!Number.isSafeInteger(line_total_cents)||line_total_cents<1)throw new Error('Invalid line amount.');
    total+=line_total_cents;
    if(!Number.isSafeInteger(total)||total>1000000000)throw new Error('Quotation total exceeds limit.');
    return {...line,line_total_cents};
  });
  const vat_cents=Math.round(total*15/115);
  return {lines:detailed,total_cents:total,vat_cents,net_cents:total-vat_cents};
}
export function canReviewCashOffice(role,scope) {
  return ['Owner / Admin','Developer / Technical Admin','Store Manager','Regional Manager'].includes(role)||
    (role==='Executive / EXCO'&&scope==='Full company');
}
export function canonicalQuotePayload(branch,customerName,customerContact,notes,lines) {
  return JSON.stringify({branch,customerName,customerContact,notes,lines});
}

/** Returns a branch-scoped read-only query; POS is additionally restricted to its own user. */
export function quoteListStatement(app, branch, userEmail) {
  if (typeof branch !== 'string' || !branch || !['pos','tills','cashoffice'].includes(app)) throw Error('Not authorised to list quotations.');
  const sql='SELECT * FROM till_quotation_submissions WHERE lower(branch)=lower(?)';
  if (app==='pos') {
    if (typeof userEmail !== 'string' || !userEmail.trim()) throw Error('Current user required.');
    return {sql:sql+' AND lower(submitted_by_email)=lower(?) ORDER BY id DESC LIMIT 50', params:[branch,userEmail]};
  }
  return {sql:sql+' ORDER BY id DESC LIMIT 50',params:[branch]};
}

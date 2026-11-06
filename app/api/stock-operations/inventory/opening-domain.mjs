/** Pure validation for verified stock opening imports. Never writes stock itself. */
export function validateOpeningRows(rows){
 if(!Array.isArray(rows)||rows.length===0||rows.length>100)throw Error('Paste 1 to 100 product lines per batch.');
 const seen=new Set();
 return rows.map((r)=>{
  const code=String(r?.code??'').trim();
  const qty=Number(r?.quantity);
  const milli=Math.round(qty*1000);
  if(!/^[\w/\-. ]{1,70}$/.test(code))throw Error('Every opening-stock row needs a valid product code.');
  if(seen.has(code.toLowerCase()))throw Error('Duplicate product code in opening stock batch.');
  if(r.quantity===''||r.quantity===null||r.quantity===undefined||!Number.isFinite(qty)||qty<0||qty>1000000||!Number.isSafeInteger(milli)||Math.abs(qty*1000-milli)>.00001)
   throw Error('Opening stock quantities must be nonnegative, to three decimals.');
  seen.add(code.toLowerCase());
  return {code,qty_milli:milli};
 });
}

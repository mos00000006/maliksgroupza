/** Pure domain logic; NO live-stock or accounting posting. */
export const STOCK_KINDS = Object.freeze(['GRV','ADJUSTMENT','COUNT','SUPPLIER_RETURN','TRANSFER']);
export const STOCK_DUTIES = Object.freeze(['Receiving / GRV','Stock Controller','DC / Transfers','Stock Manager']);
export const STOCK_MANAGERS = Object.freeze(['Owner / Admin','Developer / Technical Admin','Store Manager','Regional Manager','Department Manager']);
export function isFullAccess(member){return !!member && (['Owner / Admin','Developer / Technical Admin'].includes(member.role)||(member.role==='Executive / EXCO'&&member.access_scope==='Full company'));}
export function isStockManager(member,duty){return isFullAccess(member)||STOCK_MANAGERS.includes(member?.role)||duty==='Stock Manager';}
export function canCreate(kind,duty,manager){
 if(manager)return STOCK_KINDS.includes(kind);
 return kind==='GRV'||kind==='SUPPLIER_RETURN'?duty==='Receiving / GRV':kind==='ADJUSTMENT'||kind==='COUNT'?duty==='Stock Controller':kind==='TRANSFER'&&duty==='DC / Transfers';
}
export function canTransition(status,action,kind,creator,actor,reviewer){
 if(action==='submit')return status==='Draft'&&creator===actor;
 if(action==='approve'||action==='reject')return status==='Submitted'&&creator!==actor;
 if(action==='receive')return status==='Approved'&&kind==='TRANSFER'&&creator!==actor&&reviewer!==actor;
 return false;
}
export function validateStockLines(lines,kind){
 if(!STOCK_KINDS.includes(kind))throw new Error('Select a valid document type.');
 if(!Array.isArray(lines)||lines.length<1||lines.length>100)throw new Error('Select 1–100 catalogue items.');
 const seen=new Set();
 return lines.map((line)=>{
  const id=Number(line.catalogue_product_id),qty=Number(line.document_quantity),expected=Number(line.expected_quantity||0),rejected=Number(line.rejected_quantity||0);
  if(!Number.isSafeInteger(id)||id<1||seen.has(id))throw new Error('Each catalogue item must be unique.');
  seen.add(id);
  if(![qty,expected,rejected].every(n=>Number.isFinite(n)&&n>=0&&n<=1_000_000&&Math.round(n*1000)===n*1000))throw new Error('Quantities must be valid positive amounts, to 3 decimals.');
  if(rejected>qty)throw new Error('Rejected quantities cannot exceed received quantities.');
  if(rejected>0&&!String(line.reason||'').trim())throw new Error('Give a reason for rejected or damaged goods.');
  if(kind==='COUNT'||kind==='ADJUSTMENT'){
   if(rejected!==0)throw new Error('Damages belong in a separate rejected stock report.');
  } else if(qty<=0)throw new Error('Quantity must be greater than zero.');
  return {catalogue_product_id:id,document_quantity:qty,expected_quantity:expected,rejected_quantity:rejected,reason:String(line.reason||'').trim().slice(0,200)};
 });
}

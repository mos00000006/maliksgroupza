// Mobile quote uses exactly the same D1 product and quotation records as Maliks Sales.
// QR tokens are identifiers, never prices. Branch permissions and current prices are server-authoritative.
import { matchingBranch, limitSearch } from './policy.mjs';

const headers={'cache-control':'no-store','x-content-type-options':'nosniff'};
const ok=(value,status=200)=>Response.json(value,{status,headers});
const fail=(error,status=400)=>ok({error},status);
const TOKEN=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const tagTableForQuote=branch=>/buster\s*build/i.test(branch)?'busterbuild_price_tags':'powerbuild_price_tags';
export const tagBrandForQuote=branch=>/buster\s*build/i.test(branch)?'busterbuild':'powerbuild';
export function validateQuoteTagRequest(token,sourceBranch,branch){
  if(typeof token!=='string'||!TOKEN.test(token))throw Error('Scan an original Maliks price-card QR code.');
  if(sourceBranch!==null&&sourceBranch!==undefined&&String(sourceBranch).trim()){
    const fromTag=String(sourceBranch).trim();
    if(fromTag.length>120||fromTag.toLowerCase()!==branch.toLowerCase())throw Error('This price card belongs to another branch. Switch to the matching branch or scan the correct card.');
  }
  return token.toLowerCase();
}
export async function resolveMobilePriceTag(req,env,context){
  if(context.app!=='pos')return fail('Only Sales may scan price cards.',403);
  const params=new URL(req.url).searchParams;
  const branch=matchingBranch(context.branches,params.get('branch'));
  if(!branch)return fail('Select a branch assigned to your account.',403);
  let token;
  try{token=validateQuoteTagRequest(params.get('tag'),params.get('tag_branch'),branch);}
  catch(e){return fail(e.message,400);}
  const table=tagTableForQuote(branch),brand=tagBrandForQuote(branch);
  // Even when the printed URL has a price parameter, it is ignored.
  // The tag must still be published; prices are resolved per selected branch.
  const item=await env.DB.prepare(`SELECT p.id,p.code,p.name,p.category,
    COALESCE(bp.price_cents,t.price_cents,0) AS price_cents,
    COALESCE(t.unit,'EA') AS unit,t.coverage_per_box
    FROM ${table} t JOIN catalogue_products p ON p.id=t.product_id AND p.active=1
    LEFT JOIN price_tag_branch_prices bp ON bp.product_id=p.id AND bp.brand=? AND lower(bp.branch_name)=lower(?)
    WHERE lower(t.token)=? AND t.published=1 LIMIT 1`)
    .bind(brand,branch,token).first();
  if(!item)return fail('This QR code is not an active, published price card for the selected brand. A combo card needs separate product lines.',404);
  const price=Number(item.price_cents);
  if(!Number.isSafeInteger(price)||price<1)return fail('A valid selling price has not been set for this branch.',409);
  return ok({branch,product:{id:item.id,code:item.code,name:item.name,category:item.category,
    unit:item.unit||'EA',coverage_per_box:Number(item.coverage_per_box||0),price_cents:price},source:'CURRENT_BRANCH_PRICE'});
}
export async function listBranchSalesQuotes(req,env,context){
  if(context.app!=='pos')return fail('Only Sales may view branch quotations.',403);
  const params=new URL(req.url).searchParams;
  const branch=matchingBranch(context.branches,params.get('branch'));
  if(!branch)return fail('Branch access denied.',403);
  const filter=limitSearch(params.get('q')||'');
  if(filter===null)return fail('Search is too long.');
  const f=filter.toLowerCase();
  const sql=`SELECT * FROM till_quotation_submissions WHERE lower(branch)=lower(?)
     AND (?='' OR instr(lower(customer_name),?)>0 OR instr(lower(customer_contact),?)>0
       OR instr(lower(submitted_by_name),?)>0 OR instr(CAST(id AS TEXT),?)>0)
     ORDER BY id DESC LIMIT 75`;
  const {results}=await env.DB.prepare(sql).bind(branch,f,f,f,f,f).all();
  const map=row=>({number:'Q-'+String(row.id).padStart(8,'0'),id:row.id,branch:row.branch,
    customer_name:row.customer_name,customer_contact:row.customer_contact,status:row.status,
    submitted_by_name:row.submitted_by_name,created_at:row.created_at,notes:row.notes,
    net_cents:row.net_cents,vat_cents:row.vat_cents,total_cents:row.total_cents,
    lines:JSON.parse(row.lines_json)});
  return ok({branch,quotes:results.map(map)});
}

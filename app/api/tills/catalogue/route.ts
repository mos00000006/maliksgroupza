import { env } from "cloudflare:workers";
import { tillBranches, tillBrand, tillMember, permittedBranch, tillsNoStore } from "../shared";

/** Branch- and role-scoped read-only product lookup. All active products are browseable.
 * Unpublished / zero-priced rows are visible in the picker but cannot be added to a document.
 * No financial writes, stock edits or unrestricted public catalogue access.
 */
export async function GET(req: Request) {
  const member = await tillMember();
  if (!member) return Response.json({error:"Sales / Tills permission is required."}, {status:403});
  const assigned = await tillBranches(member);
  if (!assigned.length) return tillsNoStore();
  const query = new URL(req.url).searchParams;
  const branch = permittedBranch(assigned,query.get("branch"));
  if (!branch) return Response.json({error:"Select a retail branch assigned to this account."}, {status:403});
  const q = (query.get("q")||"").trim();
  const category=(query.get("category")||"").trim();
  const mode=query.get("mode")||"search";
  if (q.length>100 || category.length>100) return Response.json({error:"Search or category filter is too long (maximum 100 characters)."},{status:400});
  if (mode!=="browse"&&mode!=="categories"&&mode!=="search") return Response.json({error:"Unsupported catalogue mode."},{status:400});
  const brand = tillBrand(branch);
  const tagTable = brand === "busterbuild" ? "busterbuild_price_tags" : "powerbuild_price_tags";
  const match = `%${q.toLowerCase().replaceAll("%", "\\%").replaceAll("_", "\\_")}%`;
  const headers={"cache-control":"no-store"};
  try {
    if(mode==="categories") {
      const {results}=await env.DB.prepare(`
        SELECT DISTINCT COALESCE(NULLIF(trim(p.category),''),'Uncategorised') AS category
        FROM catalogue_products p WHERE p.active=1
        ORDER BY category COLLATE NOCASE LIMIT 150
      `).all<{category:string}>();
      return Response.json({branch,brand,categories:results.map(row=>row.category)}, {headers});
    }
    if(mode==="browse") {
      const rawPage=query.get("page")||"1";
      if(!/^[1-9]\d{0,3}$/.test(rawPage)||Number(rawPage)>500) return Response.json({error:"Invalid product page."},{status:400});
      const page=Number(rawPage),perPage=36;
      const {results}=await env.DB.prepare(`
        SELECT p.id,p.code,p.name,p.category,
               CASE WHEN t.product_id IS NOT NULL THEN COALESCE(b.price_cents,t.price_cents,0) ELSE 0 END AS price_cents,
               COALESCE(t.unit,'each') AS unit,COALESCE(t.coverage_per_box,0) AS coverage_per_box
        FROM catalogue_products p
        LEFT JOIN ${tagTable} t ON t.product_id=p.id AND t.published=1
        LEFT JOIN price_tag_branch_prices b ON b.product_id=p.id AND b.brand=? AND lower(b.branch_name)=lower(?)
        WHERE p.active=1
          AND (?='' OR lower(p.code)=lower(?) OR lower(p.code) LIKE ? ESCAPE '\\'
            OR lower(p.name) LIKE ? ESCAPE '\\')
          AND (?='' OR lower(COALESCE(NULLIF(trim(p.category),''),'Uncategorised'))=lower(?))
        ORDER BY CASE WHEN lower(p.code)=lower(?) THEN 0 ELSE 1 END, p.name COLLATE NOCASE,p.id
        LIMIT ? OFFSET ?
      `).bind(brand,branch,q,q,match,match,category,category,q,perPage+1,(page-1)*perPage).all<{
        id:number;code:string;name:string;category:string;price_cents:number;unit:string;coverage_per_box:number;
      }>();
      return Response.json({branch,brand,page,pageSize:perPage,hasMore:results.length>perPage,
        products:results.slice(0,perPage).map(row=>({id:row.id,code:row.code,name:row.name,
          category:row.category||"Uncategorised",price_cents:row.price_cents??0,
          unit:row.unit||"each",coverage_per_box:row.coverage_per_box??0}))}, {headers});
    }
    // Preserve the existing till barcode search contract (only positively priced published items).
    if (!q) return Response.json({error:"Search for a product code, barcode or name (maximum 100 characters)."},{status:400});
    const { results } = await env.DB.prepare(`
      SELECT p.id,p.code,p.name,p.category,
             COALESCE(b.price_cents,t.price_cents) AS price_cents,
             t.unit,t.coverage_per_box
      FROM catalogue_products p
      JOIN ${tagTable} t ON t.product_id=p.id
      LEFT JOIN price_tag_branch_prices b ON b.product_id=p.id AND b.brand=? AND lower(b.branch_name)=lower(?)
      WHERE p.active=1 AND t.published=1 AND COALESCE(b.price_cents,t.price_cents)>0
        AND (lower(p.code)=lower(?) OR lower(p.code) LIKE ? ESCAPE '\\'
          OR lower(p.name) LIKE ? ESCAPE '\\')
      ORDER BY CASE WHEN lower(p.code)=lower(?) THEN 0 ELSE 1 END, p.name
      LIMIT 30
    `).bind(brand,branch,q,match,match,q).all<{
      id:number;code:string;name:string;category:string;price_cents:number;unit:string;coverage_per_box:number;
    }>();
    return Response.json({branch,brand,products:results.map(row=>({
      id:row.id,code:row.code,name:row.name,category:row.category,
      price_cents:row.price_cents,unit:row.unit,coverage_per_box:row.coverage_per_box,
    }))},{headers});
  } catch {
    return Response.json({error:"Retail catalogue is unavailable. Please ask the administrator to verify the catalogue and price tables."},{status:503});
  }
}

import { env } from "cloudflare:workers";
import { tillBranches, tillBrand, tillMember, permittedBranch, tillsNoStore } from "../shared";

/** Read-only catalogue lookup: server enforces both store and cashier role.
 * Only published retail prices are exposed; no sale or stock mutation occurs.
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
  if (!q || q.length>100) return Response.json({error:"Search for a product code, barcode or name (maximum 100 characters)."},{status:400});
  const brand = tillBrand(branch);
  const tagTable = brand === "busterbuild" ? "busterbuild_price_tags" : "powerbuild_price_tags";
  const match = `%${q.toLowerCase().replaceAll("%", "\\%").replaceAll("_", "\\_")}%`;
  try {
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
    }))},{headers:{"cache-control":"no-store"}});
  } catch {
    return Response.json({error:"Retail price data is unavailable. Please ask the administrator to verify the price-tag tables."},{status:503});
  }
}

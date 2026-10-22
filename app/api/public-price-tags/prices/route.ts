import { env } from "cloudflare:workers";
const headers = { "access-control-allow-origin": "*", "cache-control": "no-store", "x-content-type-options": "nosniff" };
export async function GET() {
  try {
    const result = await env.DB.prepare(`SELECT p.code,t.price_cents,t.unit,t.is_tile,t.coverage_per_box,t.pieces_per_box,t.updated_at,t.token,'product' AS kind,p.name,'' AS includes_text,'' AS image_slot FROM busterbuild_price_tags t JOIN catalogue_products p ON p.id=t.product_id WHERE t.published=1 AND p.active=1 UNION ALL SELECT code,price_cents,'EA',0,0,0,updated_at,token,'combo',name,includes_text,json_extract(items_json,'$[0].id') FROM price_tag_combos WHERE brand='busterbuild' AND published=1 ORDER BY updated_at DESC`).all();
    return Response.json({ brand: "busterbuild", prices: result.results, checked_at: new Date().toISOString() }, { headers });
  } catch {
    return Response.json({ error: "Live BusterBuild prices are temporarily unavailable." }, { status: 503, headers });
  }
}

import { env } from "cloudflare:workers";
const headers = { "access-control-allow-origin": "*", "cache-control": "no-store", "x-content-type-options": "nosniff" };
export async function GET() {
  try {
    const result = await env.DB.prepare(`SELECT p.code,t.price_cents,t.unit,t.is_tile,t.coverage_per_box,t.pieces_per_box,t.updated_at,t.token,'product' AS kind,p.name,'' AS includes_text,'' AS image_slot,'[]' AS combo_items_json FROM busterbuild_price_tags t JOIN catalogue_products p ON p.id=t.product_id WHERE t.published=1 AND p.active=1 UNION ALL SELECT code,price_cents,'EA',0,0,0,updated_at,token,'combo',name,includes_text,json_extract(items_json,'$[0].id'),items_json FROM price_tag_combos WHERE brand='busterbuild' AND published=1 ORDER BY updated_at DESC`).all();
    return Response.json({ brand: "busterbuild", prices: result.results.map((row:Record<string,unknown>)=>{
      const {combo_items_json,...price}=row;
      const combo_items=row.kind==='combo'?(JSON.parse(String(combo_items_json||'[]')) as Record<string,unknown>[]).map(item=>({id:item.id,label:item.label,x:item.x,y:item.y,width:item.width,height:item.height,rotation:item.rotation,scale:item.scale,image_url:`/api/public-price-tags/${encodeURIComponent(String(row.token))}/image?slot=${encodeURIComponent(String(item.id))}`})):undefined;
      return {...price,combo_items};
    }), checked_at: new Date().toISOString() }, { headers });
  } catch {
    return Response.json({ error: "Live BusterBuild prices are temporarily unavailable." }, { status: 503, headers });
  }
}

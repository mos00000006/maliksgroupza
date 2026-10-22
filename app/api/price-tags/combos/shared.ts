import { env } from "cloudflare:workers";
import { getHubMember } from "../../access";
import { canManagePriceTags } from "../shared";
import { hasDesignerSession,designerRequired } from "../designer-auth";
import type { ComboItem, ComboTag } from "../../../lib/combo-tags";
export async function comboManager(req:Request) {
 const member=await getHubMember();if(!canManagePriceTags(member))return{member:null,response:Response.json({error:'Price tag manager access is required.'},{status:403})};
 if(!await hasDesignerSession(member,req.headers.get('cookie')))return{member:null,response:designerRequired()};
 return{member,response:null};
}
export function comboRecord(row:Record<string,unknown>,publicView=false):ComboTag {
 const items=JSON.parse(String(row.items_json)) as ComboItem[];
 return{token:String(row.token),brand:row.brand as ComboTag['brand'],code:String(row.code),name:String(row.name),price_cents:Number(row.price_cents),includes_title:String(row.includes_title),includes_text:String(row.includes_text),published:Boolean(row.published),updated_at:String(row.updated_at),items:items.map(item=>({...item,image_key:publicView?'':item.image_key,image_url:item.image_key?(publicView?`/api/public-price-tags/${row.token}/image?slot=${item.id}&v=${encodeURIComponent(String(row.updated_at))}`:`/api/price-tags/combos/picture?key=${encodeURIComponent(item.image_key)}`):''}))};
}
export async function publicCombo(token:string) {
 const row=await env.DB.prepare('SELECT * FROM price_tag_combos WHERE token=? AND published=1').bind(token).first<Record<string,unknown>>();
 if(!row)return null;const combo=comboRecord(row,true);
 return{...combo,kind:'combo' as const,combo_items:combo.items,items:undefined,product_id:0,description:'',unit:'EA' as const,is_tile:false,coverage_per_box:0,pieces_per_box:0,tile_width_mm:0,tile_length_mm:0,image_url:combo.items.find(item=>item.image_url)?.image_url||''};
}

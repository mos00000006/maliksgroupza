import type { TagBrand } from "./price-tags";
export type ComboItem = { id: string; label: string; code: string; product_id: number | null; image_key: string; image_url: string; x: number; y: number; width: number; height: number; rotation: number; scale: number };
export type ComboTag = { token: string; brand: TagBrand; code: string; name: string; price_cents: number; includes_title: string; includes_text: string; items: ComboItem[]; published: boolean; updated_at: string };
export const COMBO_IMAGE_KEY = /^combo-pictures\/[a-f0-9-]{36}\.png$/;
export const COMBO_SLOT = /^[a-z0-9-]{1,40}$/;
export function starterComboItems(): ComboItem[] {
 const names=[['tile','Tile',14,0,73,77],['grout','Grout',12,53,20,42],['adhesive','Cement / Adhesive',30,43,33,56],['bond','Bond',60,58,25,36],['cleaner','Cleaner',82,61,16,33],['spacers','Spacers',0,61,15,32],['sponge','Sponge',68,84,17,13]] as const;
 return names.map(([id,label,x,y,width,height])=>({id,label,x,y,width,height,code:'',product_id:null,image_key:'',image_url:'',rotation:0,scale:1}));
}
export function replaceComboProduct(items:ComboItem[],id:string,replacement:Pick<ComboItem,'product_id'|'code'|'image_key'|'image_url'>) {
 return items.map(item=>item.id===id?{...item,...replacement}:item);
}
export function rotationFit(item:Pick<ComboItem,'width'|'height'|'rotation'>) {
 const rad=item.rotation*Math.PI/180;const w=item.width*1.25,h=item.height;
 return Math.min(w/(Math.abs(Math.cos(rad))*w+Math.abs(Math.sin(rad))*h),h/(Math.abs(Math.sin(rad))*w+Math.abs(Math.cos(rad))*h));
}
export function parseComboInput(body:Record<string,unknown>) {
 const text=(key:string,max:number)=>{const value=String(body[key]??'').trim();if(!value||value.length>max)throw new Error(`Check ${key.replaceAll('_',' ')} (maximum ${max} characters).`);return value;};
 const brand=body.brand;if(brand!=='powerbuild'&&brand!=='busterbuild')throw new Error('Choose a brand.');
 const price=String(body.price??'').trim();if(!/^\d{1,7}(?:\.\d{1,2})?$/.test(price)||Number(price)<=0)throw new Error('Enter the total combo price including VAT.');
 const includes=text('includes_text',1000);if(includes.split('\n').length>12||includes.split('\n').some(line=>line.length>110))throw new Error('Use up to 12 short lines in This combo includes (110 characters per line).');
 if(typeof body.published!=='boolean')throw new Error('Choose whether the combo is published.');
 if(!Array.isArray(body.items)||!body.items.length||body.items.length>12)throw new Error('Use between 1 and 12 product slots.');
 const seen=new Set<string>();
 const items:ComboItem[]=body.items.map(raw=>{
  if(!raw||typeof raw!=='object')throw new Error('Check the product slots.');const row=raw as Record<string,unknown>;const id=String(row.id||'');
  if(!COMBO_SLOT.test(id)||seen.has(id))throw new Error('Each product slot needs a unique ID.');seen.add(id);
  const number=(key:string,min:number,max:number)=>{const n=Number(row[key]);if(!Number.isFinite(n)||n<min||n>max)throw new Error(`Check ${key} for ${id}.`);return n;};
  const image_key=String(row.image_key||'');if(image_key&&!COMBO_IMAGE_KEY.test(image_key))throw new Error('Use a product picture uploaded by the combo creator.');
  const label=String(row.label||'').trim(),code=String(row.code||'').trim();if(!label||label.length>50||code.length>100)throw new Error('Check the product label and code.');
  const product_id=row.product_id==null?null:Number(row.product_id);if(product_id!==null&&(!Number.isSafeInteger(product_id)||product_id<=0))throw new Error('Check the selected product.');
  const x=number('x',0,95),y=number('y',0,95),width=number('width',5,100),height=number('height',5,100);
  if(x+width>100.01||y+height>100.01)throw new Error(`Keep ${label} inside the picture area.`);
  return{id,label,code,product_id,image_key,image_url:'',x,y,width,height,rotation:number('rotation',0,359),scale:number('scale',.25,2)};
 });
 const missing=items.find(item=>!item.image_key);if(missing)throw new Error(`Add a picture for ${missing.label}, or remove that slot before saving.`);
 return{brand,code:text('code',80),name:text('name',160),price_cents:Math.round(Number(price)*100),includes_title:text('includes_title',60),includes_text:includes,items,published:body.published};
}

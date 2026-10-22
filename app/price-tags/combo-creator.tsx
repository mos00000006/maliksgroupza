"use client";
import {useEffect,useRef,useState} from "react";
import {flushSync} from "react-dom";
import type {TagBrand} from "../lib/price-tags";
import {tagCustomerUrl} from "../lib/price-tags";
import {starterComboItems,replaceComboProduct,type ComboItem,type ComboTag} from "../lib/combo-tags";
import {prepareProductPng} from "../lib/product-cutout";
import {exportProductPng} from "../lib/product-png-export";
import {priceTagResponse} from "../lib/price-tag-response";
import {toJpeg} from "../lib/vendor/html-to-image.mjs";
import ComboCard from "./combo-card";
import styles from "./combo-creator.module.css";
const fresh=(brand:TagBrand):ComboTag=>({token:'',brand,code:'COMBO-IVORY',name:'Plain Ivory Combo 600x600',price_cents:189999,includes_title:'This combo includes',includes_text:'7 boxes of tiles\n5 × Adhesive\n1 × Bond\n1 × Grout\n1 × Sponge\n1 × Spacers\n1 × Cleaner',items:starterComboItems(),published:true,updated_at:''});
type ListedCombo=Pick<ComboTag,'token'|'code'|'name'>;
export default function ComboCreator({brand,onBack}:{brand:TagBrand;onBack:()=>void}) {
 const [combo,setCombo]=useState(()=>fresh(brand));const [price,setPrice]=useState('1899.99');const [codes,setCodes]=useState<Record<string,string>>({});const [pictures,setPictures]=useState<Record<string,Blob>>({});
 const [savedList,setSavedList]=useState<ListedCombo[]>([]);const [busy,setBusy]=useState(false);const [message,setMessage]=useState('Choose the products once, save the combo, then replace any single product whenever needed.');const [dirty,setDirty]=useState(true);const [base,setBase]=useState('');const [exporting,setExporting]=useState(false);const exportRef=useRef<HTMLDivElement>(null);
 const brandName=brand==='busterbuild'?'BusterBuild':'PowerBuild';
 useEffect(()=>{let active=true;const timer=window.setTimeout(()=>setBase(window.location.origin),0);void fetch(`/api/price-tags/combos?brand=${brand}`,{cache:'no-store'}).then(r=>priceTagResponse(r,'Saved combos could not load.')).then(data=>{if(active)setSavedList(data.combos as ListedCombo[]);}).catch(e=>{if(active)setMessage(e.message);});return()=>{active=false;window.clearTimeout(timer);};},[brand]);
 const change=(patch:Partial<ComboTag>)=>{setCombo(prev=>({...prev,...patch}));setDirty(true);};
 const slotChange=(id:string,patch:Partial<ComboItem>)=>{setCombo(prev=>({...prev,items:prev.items.map(item=>item.id===id?{...item,...patch}:item)}));setDirty(true);};
 const applyPicture=(id:string,prepared:{blob:Blob;dataUrl:string},product:{id:number|null;code:string})=>{
  setCombo(prev=>({...prev,items:replaceComboProduct(prev.items,id,{product_id:product.id,code:product.code,image_key:'',image_url:prepared.dataUrl})}));setPictures(prev=>({...prev,[id]:prepared.blob}));setDirty(true);
 };
 const lookup=async(id:string)=>{setBusy(true);setMessage('Finding the product and preparing its transparent picture…');try{
  const result=await priceTagResponse(await fetch(`/api/price-tags?brand=${brand}&code=${encodeURIComponent(codes[id]||'')}`,{cache:'no-store'}),'The product could not load.');const product=result.product as {id:number;code:string;image_url:string};
  if(!product.image_url)throw new Error('This product has no picture. Upload its picture in this slot.');
  const prepared=await prepareProductPng(product.image_url,true);applyPicture(id,prepared,product);setMessage('Only this product was replaced. Other products, positions and your includes text were kept.');
 }catch(e){setMessage(e instanceof Error?e.message:'Could not replace the product.');}finally{setBusy(false);}};
 const load=async(token:string)=>{if(!token)return;setBusy(true);try{const result=await priceTagResponse(await fetch(`/api/price-tags/combos?brand=${brand}&token=${token}`,{cache:'no-store'}),'The combo could not load.');const loaded=result.combo as ComboTag;setCombo(loaded);setPrice((loaded.price_cents/100).toFixed(2));setCodes(Object.fromEntries(loaded.items.map(item=>[item.id,item.code])));setPictures({});setDirty(false);setMessage('Saved combo opened. Replace only the product you want to change.');}catch(e){setMessage(e instanceof Error?e.message:'Could not load combo.');}finally{setBusy(false);}};
 const save=async()=>{setBusy(true);setMessage('Saving the combo and its product pictures…');try{
  const missing=combo.items.find(item=>!item.image_key&&!pictures[item.id]);if(missing)throw new Error(`Add a picture for ${missing.label}, or remove that slot before saving.`);
  const items=combo.items.map(item=>({...item}));
  for(const item of items){const blob=pictures[item.id];if(!blob)continue;const form=new FormData();form.set('picture',blob,'product.png');let response=await fetch('/api/price-tags/combos/picture',{method:'POST',body:form});
   if(response.status===413){const bitmap=await createImageBitmap(blob);const canvas=document.createElement('canvas');canvas.width=bitmap.width;canvas.height=bitmap.height;canvas.getContext('2d')!.drawImage(bitmap,0,0);bitmap.close();const smaller=await exportProductPng(canvas,300*1024);form.set('picture',smaller.blob,'product.png');response=await fetch('/api/price-tags/combos/picture',{method:'POST',body:form});}
   const uploaded=await priceTagResponse(response,'Product picture upload failed. Please try saving again.');item.image_key=String(uploaded.image_key);
   slotChange(item.id,{image_key:item.image_key});setPictures(prev=>{const next={...prev};delete next[item.id];return next;});
  }
  const result=await priceTagResponse(await fetch('/api/price-tags/combos',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({...combo,token:combo.token||undefined,price,items})}),'The combo could not save.');
  const saved=result.combo as ComboTag;setCombo({...saved,items:saved.items.map(item=>({...item,image_url:items.find(old=>old.id===item.id)?.image_url||item.image_url}))});setDirty(false);setSavedList(prev=>[{token:saved.token,name:saved.name,code:saved.code},...prev.filter(row=>row.token!==saved.token)]);setMessage(saved.published?'Combo saved. Its customer QR page and printable tag are ready.':'Combo hidden. Its customer QR page is no longer available.');
 }catch(e){setMessage(e instanceof Error?e.message:'Could not save combo.');}finally{setBusy(false);}};
 const preview={...combo,price_cents:Math.max(0,Math.round(Number(price)*100)||0)};
 const publicUrl=base&&combo.token&&combo.published?tagCustomerUrl(base,combo):'';
 const ready=Boolean(publicUrl&&!dirty&&!busy);
 const download=async()=>{setBusy(true);try{flushSync(()=>setExporting(true));await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));const node=exportRef.current?.firstElementChild as HTMLElement;if(!node)throw new Error();await Promise.all(Array.from(node.querySelectorAll('img')).map(img=>img.decode()));
  const data=await toJpeg(node,{quality:.98,pixelRatio:3,backgroundColor:'#ffffff',width:900,height:600,skipFonts:true,style:{width:'900px',height:'600px',boxShadow:'none',margin:'0'}});const a=document.createElement('a');a.href=data;a.download=`${brandName}-${combo.code.replace(/[^a-z0-9._-]/gi,'-')}-Combo.jpg`;document.body.appendChild(a);a.click();a.remove();setMessage('Combo JPG downloaded (2700 × 1800 pixels).');
 }catch{setMessage('JPG download failed. Check that all product pictures are visible, then try again.');}finally{setExporting(false);setBusy(false);}};
 return <main className={styles.creator}>
  <section className={styles.controls}>
   <header className={styles.editorHeader}><div><small>{brandName.toUpperCase()} PRICE TAG STUDIO</small><h1>Combo creator</h1><p>Replace one product. Rotate long tiles. Keep your layout.</p></div><button type="button" onClick={onBack} disabled={busy}>Back to price tags</button></header>
   <fieldset disabled={busy} className={styles.editorFields}>
    <section className={styles.panel}><h2>Combo details</h2><label>Open a saved combo<select value={combo.token} onChange={e=>void load(e.target.value)}><option value="">New combo</option>{savedList.map(row=><option value={row.token} key={row.token}>{row.code} · {row.name}</option>)}</select></label>
     <button type="button" onClick={()=>{setCombo(fresh(brand));setPrice('1899.99');setCodes({});setPictures({});setDirty(true);setMessage('New combo started. Use a unique combo code.');}}>Start a new combo</button>
     <label>Combo code<input value={combo.code} maxLength={80} onChange={e=>change({code:e.target.value})}/></label><p className={styles.hint}>Use a separate combo code, not the tile code. An existing sales-app combo with this code can receive the saved price.</p>
     <label>Combo name and tile size<input value={combo.name} maxLength={160} onChange={e=>change({name:e.target.value})}/></label>
     <label>Total combo price including VAT (R)<input type="number" min=".01" step=".01" value={price} onChange={e=>{setPrice(e.target.value);setDirty(true);}}/></label>
     <label>Includes heading<input value={combo.includes_title} maxLength={60} onChange={e=>change({includes_title:e.target.value})}/></label>
     <label>This combo includes — edit any line<textarea rows={9} maxLength={1000} value={combo.includes_text} onChange={e=>change({includes_text:e.target.value})}/></label><p className={styles.hint}>Up to 12 short lines. Replacing a picture keeps this wording unchanged.</p>
     <label className={styles.check}><input type="checkbox" checked={combo.published} onChange={e=>change({published:e.target.checked})}/>Make this combo visible to customers who scan</label>
     <button type="button" className={styles.primary} onClick={()=>void save()}>Save combo &amp; generate QR</button>
    </section>
    <section className={styles.panel}><h2>Products in your combo</h2><p>Find by catalogue code or upload a picture. Each product has its own rotation and position.</p>
     <div className={styles.slots}>{combo.items.map((item,index)=><details key={item.id} open={index===0} className={styles.slotEditor}>
      <summary>{item.label}{item.code?` · ${item.code}`:''}</summary>
      <label>Slot label<input value={item.label} maxLength={50} onChange={e=>slotChange(item.id,{label:e.target.value})}/></label>
      <div className={styles.lookup}><label>Product code<input value={codes[item.id]??item.code} onChange={e=>setCodes(prev=>({...prev,[item.id]:e.target.value}))}/></label><button type="button" disabled={!(codes[item.id]??item.code).trim()} onClick={()=>void lookup(item.id)}>Replace this product</button></div>
      <label>Or upload this product picture<input type="file" accept="image/png,image/jpeg,image/webp" onChange={async e=>{const file=e.target.files?.[0];if(!file)return;if(file.size>30*1024*1024){setMessage('Choose a product picture smaller than 30 MB.');return;}setBusy(true);setMessage('Preparing this product picture…');try{const prepared=await prepareProductPng(file,true);applyPicture(item.id,prepared,{id:null,code:codes[item.id]??item.code});setMessage('Only this picture was replaced.');}catch(error){setMessage(error instanceof Error?error.message:'Picture could not load.');}finally{setBusy(false);e.target.value='';}}}/></label>
      <div className={styles.rotation}><button type="button" onClick={()=>slotChange(item.id,{rotation:(item.rotation+270)%360})}>↶ 90°</button><label>Rotation: {item.rotation}°<input type="range" min={0} max={359} value={item.rotation} onChange={e=>slotChange(item.id,{rotation:Number(e.target.value)})}/></label><button type="button" onClick={()=>slotChange(item.id,{rotation:(item.rotation+90)%360})}>↷ 90°</button></div>
      <div className={styles.positionFields}><label>Horizontal position<input type="range" min={0} max={100-item.width} value={item.x} onChange={e=>slotChange(item.id,{x:Number(e.target.value)})}/></label><label>Vertical position<input type="range" min={0} max={100-item.height} value={item.y} onChange={e=>slotChange(item.id,{y:Number(e.target.value)})}/></label><label>Picture width<input type="range" min={5} max={100-item.x} value={item.width} onChange={e=>slotChange(item.id,{width:Number(e.target.value)})}/></label><label>Picture height<input type="range" min={5} max={100-item.y} value={item.height} onChange={e=>slotChange(item.id,{height:Number(e.target.value)})}/></label><label>Zoom<input type="range" min={.25} max={2} step={.05} value={item.scale} onChange={e=>slotChange(item.id,{scale:Number(e.target.value)})}/></label></div>
      <div className={styles.slotButtons}><button type="button" onClick={()=>slotChange(item.id,{rotation:0,scale:1})}>Reset rotation &amp; zoom</button><button type="button" onClick={()=>change({items:combo.items.filter(row=>row.id!==item.id)})}>Remove this slot</button></div>
     </details>)}</div>
     <button type="button" disabled={combo.items.length>=12} onClick={()=>change({items:[...combo.items,{id:`item-${Date.now()}`,label:'Extra product',code:'',product_id:null,image_key:'',image_url:'',x:20,y:50,width:30,height:40,rotation:0,scale:1}]})}>+ Add another product</button>
     <details className={styles.reference}><summary>View your original combo template</summary><img src="/price-tag-assets/combo-reference.jpg" alt="Original BusterBuild Ivory combo template"/></details>
    </section>
   </fieldset>
   <div className={styles.actions}><button disabled={!ready} onClick={()=>void download()}>Download JPG</button><button disabled={!ready} onClick={async()=>{await Promise.all(Array.from(document.querySelectorAll<HTMLImageElement>('[data-combo-print] img')).map(img=>img.decode()));window.print();}}>Print / Save PDF</button>{publicUrl&&!dirty&&<a href={publicUrl} target="_blank" rel="noreferrer">Open customer combo page ↗</a>}</div>
   <p role="status" className={styles.message}>{busy?'Working… ':''}{message}</p>{dirty&&<p className={styles.hint}>Preview only. Save the combo before printing or downloading its QR tag.</p>}
  </section>
  <section className={styles.printArea} data-combo-print><ComboCard combo={preview} url={dirty?'':publicUrl}/></section>
  {exporting&&<div className={styles.exportStage} ref={exportRef} aria-hidden="true"><ComboCard combo={preview} url={publicUrl}/></div>}
 </main>;
}

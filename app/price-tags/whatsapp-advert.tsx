"use client";
import {useRef,useState} from "react";
import {toJpeg} from "../lib/vendor/html-to-image.mjs";
import {priceTagResponse} from "../lib/price-tag-response";
import {prepareProductPng} from "../lib/product-cutout";
import {tileDefaults,type TagBrand,type TagUnit} from "../lib/price-tags";
import styles from "./whatsapp-advert.module.css";

type Format="status"|"square";
type Product={id:string;code:string;name:string;price:string;unit:TagUnit;image:string};
type Campaign={headline:string;subtitle:string;validUntil:string;branch:string;phone:string;address:string;terms:string};
const blankProduct=(id:string):Product=>({id,code:'',name:'',price:'',unit:'EA',image:''});
const sizes={status:{width:1080,height:1920},square:{width:1080,height:1080}};
function Artwork({brand,format,products,campaign}:{brand:TagBrand;format:Format;products:Product[];campaign:Campaign}){
 const buster=brand==='busterbuild';
 const end=campaign.validUntil?new Date(campaign.validUntil+'T12:00:00').toLocaleDateString('en-ZA',{day:'numeric',month:'short',year:'numeric'}):'';
 return <article data-advert-artwork className={`${styles.artwork} ${buster?styles.buster:styles.power} ${format==='square'?styles.square:styles.status}`} aria-label={`${buster?'BusterBuild':'PowerBuild'} WhatsApp advert preview`}>
  <div className={styles.sweep}/><div className={styles.bottomSweep}/>
  <div className={styles.brandBar}><img className={styles.logo} src={buster?'/price-tag-assets/busterbuild-logo-white.png':'/powerbuild-logo-transparent.png'} alt={buster?'BusterBuild':'PowerBuild'}/><span>YOUR NEXT PROJECT<br/><b>STARTS HERE</b></span></div>
  <header className={styles.offerHeading}><span className={styles.eyebrow}>IN-STORE OFFERS</span><h2 style={{fontSize:`${Math.min(format==='square'?7.8:8.5,110/Math.max(campaign.headline.length,1))}cqw`}}>{campaign.headline||'SPECIAL OFFERS'}</h2>{campaign.subtitle&&<p>{campaign.subtitle}</p>}</header>
  <div className={`${styles.productGrid} ${products.length===1?styles.one:''} ${products.length===2?styles.two:''} ${products.length>2?styles.many:''}`}>
   {products.map(product=>{
    const amount=Number(product.price);const valid=/^\d+(?:\.\d{1,2})?$/.test(product.price)&&amount>0;const[whole,cents]=(valid?amount:0).toFixed(2).split('.');
    return <section className={styles.productCard} key={product.id} data-advert-product={product.id}>
     <div className={styles.productPicture}>{product.image?<img src={product.image} alt={product.name||'Product'}/>:<span>Add product picture</span>}</div>
     <div className={styles.productInfo}><h3 style={{fontSize:`${Math.min(format==='square'?(products.length===1?3.5:products.length>2?1.8:1.9):(products.length===1?4.5:2.55),(format==='square'?(products.length===1?200:products.length>2?135:140):(products.length===1?280:195))/Math.max(product.name.length,1))}cqw`}}>{product.name||'Your product name'}</h3>{product.code&&<small>Code: {product.code}</small>}</div>
     <div className={styles.price}>{valid?<><span>R</span><strong>{new Intl.NumberFormat('en-ZA').format(Number(whole))}</strong><sup>{cents}</sup></>:<strong className={styles.pricePlaceholder}>Your price</strong>}<small>{product.unit==='BOX'?'PER BOX':product.unit==='M2'?'PER m²':'EACH'} · INCL. VAT</small></div>
    </section>;
   })}
  </div>
  <footer className={styles.footer}>
   {end&&<div className={styles.date}>OFFERS VALID UNTIL {end.toUpperCase()}</div>}
   {campaign.branch&&<strong className={styles.branch} style={{fontSize:`${Math.min(format==='square'?2.4:3.5,125/Math.max(campaign.branch.length,1))}cqw`}}>{campaign.branch}</strong>}
   {campaign.phone&&<div className={styles.phone}>CALL / WHATSAPP <b>{campaign.phone}</b></div>}
   {campaign.address&&<p className={styles.address}>{campaign.address}</p>}
   {campaign.terms&&<p className={styles.terms}>{campaign.terms}</p>}
  </footer>
 </article>;
}
export default function WhatsAppAdvert({brand,onBack}:{brand:TagBrand;onBack:()=>void}){
 const[format,setFormat]=useState<Format>('status');const[products,setProducts]=useState<Product[]>([blankProduct('product-1')]);const[campaign,setCampaign]=useState<Campaign>({headline:'SPECIAL OFFERS',subtitle:'Great prices. Ready for your next project.',validUntil:'',branch:'',phone:'',address:'',terms:'While stocks last. Images for illustration. E.&O.E.'});
 const[busy,setBusy]=useState(false);const[message,setMessage]=useState('');const form=useRef<HTMLFormElement>(null);const exportRef=useRef<HTMLDivElement>(null);const sequence=useRef(1);
 const brandName=brand==='busterbuild'?'BusterBuild':'PowerBuild';
 const update=(id:string,patch:Partial<Product>)=>{setProducts(prev=>prev.map(p=>p.id===id?{...p,...patch}:p));setMessage('');};
 const change=(key:keyof Campaign,value:string)=>{setCampaign(prev=>({...prev,[key]:value}));setMessage('');};
 const lookup=async(product:Product)=>{
  if(!product.code.trim()){setMessage('Enter a product code first.');return;}setBusy(true);setMessage('Loading product and preparing its transparent picture…');
  try{
   const result=await priceTagResponse(await fetch(`/api/price-tags?brand=${brand}&code=${encodeURIComponent(product.code.trim())}`,{cache:'no-store'}),'The product could not load.');
   const item=result.product as {code:string;name:string;image_url:string;category:string;description:string};const tag=result.tag as {price_cents:number;unit:TagUnit}|null;
   // Replace only this slot. Advert edits never write product/tag prices.
   update(product.id,{code:item.code,name:item.name,price:tag?(tag.price_cents/100).toFixed(2):'',unit:tag?.unit||tileDefaults(item).unit,image:''});
   if(item.image_url){const prepared=await prepareProductPng(item.image_url,true);update(product.id,{image:prepared.dataUrl});setMessage('Product added. Check the picture and offer price before downloading.');}
   else setMessage('Product loaded without a picture. Upload its transparent PNG below.');
  }catch(e){setMessage(e instanceof Error?e.message:'Could not load product.');}finally{setBusy(false);}
 };
 const upload=async(id:string,file:File)=>{
  if(file.type!=='image/png'||file.size>30*1024*1024){setMessage('Choose a transparent PNG smaller than 30 MB.');return;}
  setBusy(true);setMessage('Preparing your product PNG…');try{const picture=await prepareProductPng(file,false);update(id,{image:picture.dataUrl});setMessage('PNG added.');}catch{setMessage('This PNG could not load. Please choose another picture.');}finally{setBusy(false);}
 };
 const download=async()=>{
  if(!form.current?.reportValidity())return;
  if(!campaign.headline.trim()){setMessage('Enter a headline for the advert.');return;}
  if(products.some(p=>!p.image)){setMessage('Add a picture for every product before downloading.');return;}
  if(products.some(p=>!p.name.trim()||!/^\d+(?:\.\d{1,2})?$/.test(p.price)||Number(p.price)<=0||Number(p.price)>9999999.99)){setMessage('Enter a product name and a positive price with no more than two decimal places for every product.');return;}
  setBusy(true);setMessage('Preparing your WhatsApp advert…');
  try{
   await document.fonts.ready;await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));
   const node=exportRef.current?.firstElementChild as HTMLElement|null;if(!node)throw new Error('Preview unavailable');
   await Promise.all(Array.from(node.querySelectorAll('img')).map(img=>img.decode()));
   const size=sizes[format];const data=await toJpeg(node,{...size,pixelRatio:1,quality:.98,skipFonts:true,backgroundColor:brand==='busterbuild'?'#171918':'#073d74',style:{width:`${size.width}px`,height:`${size.height}px`,margin:'0',boxShadow:'none'}});
   const link=document.createElement('a');link.href=data;link.download=`${brandName}-WhatsApp-${format}-${size.width}x${size.height}.jpg`;document.body.appendChild(link);link.click();link.remove();setMessage(`JPG downloaded (${size.width} × ${size.height} pixels). Ready to post on WhatsApp.`);
  }catch{setMessage('Could not download. Check that all product pictures and the logo load, then retry.');}finally{setBusy(false);}
 };
 return <main className={styles.studio}>
  <div className={styles.workspace}>
   <header className={styles.editorHeader}><div><small>{brandName.toUpperCase()} · ADVERT STUDIO</small><h1>WhatsApp advert generator</h1><p>Create a branded offer for Status or a square post.</p></div><button disabled={busy} onClick={onBack}>Back to price tag studio</button></header>
   <div className={styles.editor}>
    <form ref={form} className={styles.panel} onSubmit={e=>{e.preventDefault();void download();}}>
     <fieldset disabled={busy}>
      <h2>1. Your offer</h2>
      <label>Advert size<select value={format} onChange={e=>setFormat(e.target.value as Format)}><option value="status">WhatsApp Status — 1080 × 1920</option><option value="square">Square post — 1080 × 1080</option></select></label>
      <label>Headline<input required maxLength={40} value={campaign.headline} onChange={e=>change('headline',e.target.value)}/></label>
      <label>Supporting line (optional)<input maxLength={80} value={campaign.subtitle} onChange={e=>change('subtitle',e.target.value)}/></label>
      <label>Offer valid until (optional)<input type="date" value={campaign.validUntil} onChange={e=>change('validUntil',e.target.value)}/></label>
      <h2>2. Products ({products.length}/4)</h2>
      {products.map((product,index)=><section className={styles.productEditor} key={product.id} aria-label={`Product ${index+1}`}>
       <div className={styles.slotHeader}><b>Product {index+1}</b>{products.length>1&&<button type="button" onClick={()=>setProducts(prev=>prev.filter(p=>p.id!==product.id))}>Remove product {index+1}</button>}</div>
       <div className={styles.lookup}><label>Product code<input maxLength={80} value={product.code} onChange={e=>update(product.id,{code:e.target.value})}/></label><button type="button" onClick={()=>void lookup(product)}>Find product</button></div>
       <label>Product name<input required maxLength={100} value={product.name} onChange={e=>update(product.id,{name:e.target.value})}/></label>
       <div className={styles.row}><label>Offer price including VAT (R)<input required type="number" min="0.01" max="9999999.99" step="0.01" value={product.price} onChange={e=>update(product.id,{price:e.target.value})}/></label><label>Price basis<select value={product.unit} onChange={e=>update(product.id,{unit:e.target.value as TagUnit})}><option value="EA">Each</option><option value="BOX">Per box</option><option value="M2">Per m²</option></select></label></div>
       <label>Upload transparent product PNG<input type="file" accept="image/png" onChange={e=>{const file=e.target.files?.[0];if(file)void upload(product.id,file);e.target.value='';}}/></label>
       <span className={styles.pictureStatus}>{product.image?'✓ Product picture ready':'Add a product picture'}</span>
      </section>)}
      <button type="button" disabled={products.length>=4} onClick={()=>{sequence.current++;setProducts(prev=>[...prev,blankProduct('product-'+sequence.current)]);}}>+ Add product</button>
      <h2>3. Store details</h2>
      <label>Branch / store (optional)<input maxLength={60} value={campaign.branch} onChange={e=>change('branch',e.target.value)}/></label>
      <label>Phone / WhatsApp (optional)<input type="tel" maxLength={32} value={campaign.phone} onChange={e=>change('phone',e.target.value)}/></label>
      <label>Store address (optional)<input maxLength={120} value={campaign.address} onChange={e=>change('address',e.target.value)}/></label>
      <label>Terms / footer<input maxLength={140} value={campaign.terms} onChange={e=>change('terms',e.target.value)}/></label>
     </fieldset>
     <button className={styles.primary} disabled={busy} type="submit">{busy?'Preparing…':'Download WhatsApp JPG'}</button>
     <p className={styles.note}>Advert prices apply to this picture only. Save price tags separately to update the sales app. Your advert stays in this screen until you leave it.</p>
     {message&&<p role="status" className={styles.message}>{message}</p>}
    </form>
    <section className={`${styles.panel} ${styles.previewPanel}`}><div className={styles.previewHeading}><h2>Live preview</h2><span>{sizes[format].width} × {sizes[format].height} px</span></div><div className={`${styles.preview} ${format==='square'?styles.squarePreview:''}`}><Artwork brand={brand} format={format} products={products} campaign={campaign}/></div><p className={styles.note}>Download the JPG, then select it from your phone gallery in WhatsApp.</p></section>
   </div>
  </div>
  <div ref={exportRef} className={styles.exportStage} style={{width:sizes[format].width}} aria-hidden="true"><Artwork brand={brand} format={format} products={products} campaign={campaign}/></div>
 </main>;
}

"use client";
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { toJpeg } from "../lib/vendor/html-to-image.mjs";
import Link from "next/link";
import { priceTagResponse } from "../lib/price-tag-response";
import { exportProductPng } from "../lib/product-png-export";
import { prepareProductPng } from "../lib/product-cutout";
import { tagCustomerUrl, tileDefaults, type TagBrand, type PriceTag, type TagUnit } from "../lib/price-tags";
import StaffIdGenerator from "./staff-id-generator";
import OutdoorSignage from "./outdoor-signage";
import StoreSignage from "./store-signage";
import CertificateGenerator from "./certificate-generator";
import WhatsAppAdvert from "./whatsapp-advert";
import StaffCardStudio from "./staff-card-studio";
import ComboCreator from "./combo-creator";
import PriceTagCard from "./price-tag-card";
import styles from "./price-tags.module.css";
type Product = { id: number; code: string; name: string; category: string; description: string; image_url: string };
type Draft = { price: string; unit: TagUnit; is_tile: boolean; coverage_per_box: string; pieces_per_box: string; tile_width_mm: string; tile_length_mm: string; published: boolean };
const empty: Draft = { price: "", unit: "EA", is_tile: false, coverage_per_box: "", pieces_per_box: "", tile_width_mm: "", tile_length_mm: "", published: true };
export default function PriceTagGenerator() {
  const [mode,setMode]=useState<"single"|"combo"|"name-tag"|"business-card"|"whatsapp"|"certificate"|"signage"|"outdoor"|"staff-id">("single");
  const [brand,setBrand]=useState<TagBrand|null>(null);
  const brandName=brand === "busterbuild" ? "BusterBuild" : "PowerBuild";
  const exportRef=useRef<HTMLDivElement>(null);
  const [exportItem,setExportItem]=useState<{tag:PriceTag;url:string}|null>(null);
  const [jpgBusy,setJpgBusy]=useState(false);
  const [picture, setPicture] = useState<{blob:Blob;dataUrl:string}|null>(null);
  const [pictureMessage,setPictureMessage] = useState("");
  const [code, setCode] = useState(""); const [product, setProduct] = useState<Product | null>(null);
  const [draft, setDraft] = useState<Draft>(empty); const [saved, setSaved] = useState<PriceTag | null>(null);
  const [queue, setQueue] = useState<Array<{ tag: PriceTag; url: string }>>([]);
  const [base, setBase] = useState(""); const [busy, setBusy] = useState(false); const [message, setMessage] = useState(""); const [dirty, setDirty] = useState(false);
  useEffect(() => { const timer = window.setTimeout(() => setBase(window.location.origin), 0); return () => window.clearTimeout(timer); }, []);
  const change = (patch: Partial<Draft>) => { setDraft(prev => ({ ...prev, ...patch })); setDirty(true); };
  const origin = () => {
    const url = new URL(base);
    if ((url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname))) || url.username || url.password) throw new Error("Enter the public HTTPS address of this Hub.");
    return url.origin;
  };
  const lookup = async () => {
    setBusy(true); setMessage(""); setSaved(null); setProduct(null); setDirty(false); setPicture(null); setPictureMessage("");
    try {
      const res = await fetch(`/api/price-tags?brand=${brand}&code=${encodeURIComponent(code.trim())}`, { cache: "no-store" }); const json = await priceTagResponse(res,"The product could not load. Please refresh and try again.");
      const p = json.product as Product; const tag = json.tag as PriceTag | null; const defaults = tileDefaults(p);
      if(p.image_url){
        setMessage("Removing the product background… First use loads the background remover.");
        setPictureMessage("Removing the product background… First use loads the background remover.");
        try{const cutout=await prepareProductPng(p.image_url,true);setPicture(cutout);p.image_url=cutout.dataUrl;setPictureMessage("Product-only PNG prepared. Check the edges, then generate your tag. This picture is also used on the customer page.");}
        catch(e){setPictureMessage(e instanceof Error?e.message:"Upload a transparent product PNG.");}

      }
      setMessage("");setProduct(p); setDraft({ price: tag ? (Number(tag.price_cents) / 100).toFixed(2) : "", unit: tag?.unit || defaults.unit,
        is_tile: tag ? Boolean(tag.is_tile) : defaults.is_tile, published: tag ? Boolean(tag.published) : true,
        coverage_per_box: String(tag?.coverage_per_box || defaults.coverage_per_box || ""), pieces_per_box: String(tag?.pieces_per_box || defaults.pieces_per_box || ""),
        tile_width_mm: String(tag?.tile_width_mm || defaults.tile_width_mm || ""), tile_length_mm: String(tag?.tile_length_mm || defaults.tile_length_mm || "") });
      if (tag) setSaved({ ...tag, code: p.code, name: p.name, description: p.description, image_url: p.image_url, is_tile: Boolean(tag.is_tile), published: Boolean(tag.published) });
    } catch (e) { setMessage(e instanceof Error ? e.message : "Could not load product."); }
    finally { setBusy(false); }
  };
  const save = async () => {
    if (!product) return; setBusy(true); setMessage("");
    try {
      if(product.image_url&&!picture)throw new Error("Prepare the product picture before generating. Retry background removal or upload a transparent PNG.");
      const customerOrigin = origin();
      const res = await fetch("/api/price-tags", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ product_id: product.id, brand, ...draft }) }); const json = await priceTagResponse(res,"The tag could not save. Please try again.");
      if(picture){
        const upload=new FormData();upload.append("brand",brand!);upload.append("product_id",String(product.id));upload.append("picture",picture.blob,"product.png");
        let uploaded=await fetch("/api/price-tags/picture",{method:"POST",body:upload});
        if(uploaded.status===413){
          // One smaller retry for deployments with stricter request-size limits.
          const image=await createImageBitmap(picture.blob);const canvas=document.createElement("canvas");canvas.width=image.width;canvas.height=image.height;canvas.getContext("2d")!.drawImage(image,0,0);image.close();
          const smaller=await exportProductPng(canvas,300*1024);upload.set("picture",smaller.blob,"product.png");
          uploaded=await fetch("/api/price-tags/picture",{method:"POST",body:upload});
        }
        await priceTagResponse(uploaded,"The tag price was saved, but its picture could not upload. Please try Generate again.");
      }
      const tag: PriceTag = { ...(json.tag as PriceTag), name: product.name, code: product.code, description: product.description, image_url: product.image_url, is_tile: Boolean((json.tag as PriceTag).is_tile), published: Boolean((json.tag as PriceTag).published) };
      setSaved(tag); setDirty(false);
      setQueue(prev => prev.filter(item => item.tag.token !== tag.token).concat(tag.published ? [{ tag, url: tagCustomerUrl(customerOrigin, tag) }] : []));
      setMessage(tag.published ? "Tag saved and added to the print sheet. The QR page is ready." : "Tag hidden. Customers can no longer open this QR page.");
    } catch (e) { setMessage(e instanceof Error ? e.message : "Could not save tag."); }
    finally { setBusy(false); }
  };
  const downloadJpg=async(item:{tag:PriceTag;url:string})=>{
    setJpgBusy(true);setMessage("Preparing high-resolution JPG…");
    try{
      flushSync(()=>setExportItem(item));
      await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));
      const node=exportRef.current?.firstElementChild as HTMLElement|null;
      if(!node)throw new Error("The tag could not be prepared. Generate it again.");
      await Promise.all(Array.from(node.querySelectorAll("img")).map(image=>image.decode()));
      const data=await toJpeg(node,{quality:0.98,pixelRatio:3,backgroundColor:"#ffffff",width:900,height:600,skipFonts:true,cacheBust:false,style:{boxShadow:"none",margin:"0",width:"900px",height:"600px"}});
      const link=document.createElement("a");link.download=`${item.tag.brand === "busterbuild" ? "BusterBuild" : "PowerBuild"}-${item.tag.code.replace(/[^a-z0-9._-]/gi,"-")}-Price-Tag.jpg`;link.href=data;document.body.appendChild(link);link.click();link.remove();
      setMessage("JPG downloaded (2700 × 1800 pixels). Product cutouts remain transparent PNGs; the complete JPG tag has a white background.");
    }catch{setMessage("The JPG could not download. Check that the product picture loads, then try again.");}
    finally{setJpgBusy(false);setExportItem(null);}
  };
  const enteredCents = Math.round(Number(draft.price) * 100);
  const boxPriceCents = draft.is_tile && Number.isSafeInteger(enteredCents) && enteredCents > 0
    ? draft.unit === "BOX" ? enteredCents : Number(draft.coverage_per_box) > 0 ? Math.round(enteredCents * Number(draft.coverage_per_box)) : null
    : null;
  const money = (cents: number) => new Intl.NumberFormat("en-ZA", {style:"currency",currency:"ZAR"}).format(cents / 100);
  const nominalCoverage=draft.is_tile?Number(draft.pieces_per_box)*Number(draft.tile_width_mm)*Number(draft.tile_length_mm)/1000000:0;
  const coverageMismatch=nominalCoverage>0&&Number(draft.coverage_per_box)>0&&Math.abs(Number(draft.coverage_per_box)-nominalCoverage)/nominalCoverage>.15;
  const numberField = (label: string, key: "coverage_per_box" | "pieces_per_box" | "tile_width_mm" | "tile_length_mm", step: string) => <label>{label}<input type="number" min="0" step={step} value={draft[key]} onChange={e => change({ [key]: e.target.value })} /></label>;
  let publicUrl = ""; try { if (saved) publicUrl = tagCustomerUrl(origin(), saved); } catch { /* Validated on save. */ }
  const print = async () => {
    setMessage("Preparing pictures for print…");
    await Promise.all(Array.from(document.querySelectorAll<HTMLImageElement>("[data-print-sheet] img")).map(async img => { try { await img.decode(); } catch { /* Broken image remains visible for review. */ } }));
    setMessage(""); window.print();
  };
  if (brand && mode === "staff-id") return <StaffIdGenerator brand={brand} onBack={()=>setMode("single")} />;
  if (brand && mode === "outdoor") return <OutdoorSignage brand={brand} onBack={()=>setMode("single")} />;
  if (brand && mode === "signage") return <StoreSignage brand={brand} onBack={()=>setMode("single")} />;
  if (brand && mode === "certificate") return <CertificateGenerator brand={brand} onBack={()=>setMode("single")} />;
  if (brand && mode === "whatsapp") return <WhatsAppAdvert brand={brand} onBack={()=>setMode("single")} />;
  if (brand && (mode === "name-tag" || mode === "business-card")) return <StaffCardStudio brand={brand} kind={mode} onKindChange={setMode} onBack={()=>setMode("single")} />;
  if (brand && mode === "combo") return <ComboCreator brand={brand} onBack={()=>setMode("single")} />;
  if (!brand) return <main className={styles.generator}><section className={styles.controls}><header className={styles.header}><div><h1>Price tag generator</h1><p>Choose your store template.</p></div><Link href="/">Back to Hub</Link></header><div className={styles.brandChoices}>
    <button onClick={()=>setBrand("powerbuild")}><img src="/powerbuild-logo-transparent.png" alt=""/><strong>PowerBuild</strong><span>Blue &amp; yellow template</span></button>
    <button onClick={()=>setBrand("busterbuild")}><img src="/price-tag-assets/busterbuild-logo.png" alt=""/><strong>BusterBuild</strong><span>Black &amp; gold template</span></button>
  </div></section></main>;
  return <main className={styles.generator}>
    <section className={styles.controls}>
      <header className={styles.header}><img src={brand === "busterbuild" ? "/price-tag-assets/busterbuild-logo.png" : "/powerbuild-logo-transparent.png"} alt={brandName} /><div><small>{brandName.toUpperCase()} RETAIL</small><h1>Price tag studio</h1><p>Your design. Your products. Ready to print.</p></div><Link href="/">Back to Hub</Link></header>
      <button type="button" className={styles.switchBrand} onClick={()=>{setBrand(null);setCode("");setProduct(null);setSaved(null);setPicture(null);setQueue([]);setDraft(empty);setDirty(false);setMessage("");}}>Change brand</button>
      <div className={styles.buttons} style={{marginBottom:20}}><button type="button" aria-pressed={true}>Single product tag</button><button type="button" onClick={()=>setMode("combo")}>Create a combo</button><button type="button" onClick={()=>setMode("name-tag")}>Salesperson name tags</button><button type="button" onClick={()=>setMode("business-card")}>Business cards</button><button type="button" onClick={()=>setMode("whatsapp")}>WhatsApp adverts</button><button type="button" onClick={()=>setMode("certificate")}>Staff certificates</button><button type="button" onClick={()=>setMode("signage")}>Store signage</button><button type="button" onClick={()=>setMode("outdoor")}>Outdoor boards &amp; billboards</button><button type="button" onClick={()=>setMode("staff-id")}>Staff ID cards</button></div>
      <div className={styles.editor}>
        <section className={styles.panel}><h2>1. Choose a product</h2>
          <form onSubmit={e => { e.preventDefault(); void lookup(); }} className={styles.lookup}><label>Product code<input required autoFocus value={code} placeholder="e.g. A18167" onChange={e => { setCode(e.target.value); setProduct(null); setSaved(null); setPicture(null); setPictureMessage(""); }} /></label><button disabled={busy || !code.trim()}>Find product</button></form>
          {product && <div className={styles.chosen}>{product.image_url && <img src={product.image_url} alt="" />}<div><b>{product.name}</b><small>{product.code} · {product.category}</small></div></div>}
          {product && <div className={styles.pictureTools}><p role="status">{pictureMessage}</p><button type="button" disabled={busy} onClick={async()=>{
            setBusy(true);setPictureMessage("Removing the product background…");try{const cutout=await prepareProductPng(`/api/price-tags/image?product_id=${product.id}&brand=${brand}&original=1`,true);setPicture(cutout);setProduct(prev=>prev?{...prev,image_url:cutout.dataUrl}:prev);setPictureMessage("Product-only PNG prepared. Check the edges before generating.");setDirty(true);}catch(e){setPicture(null);setPictureMessage(e instanceof Error?e.message:"Background removal failed. Retry or upload a transparent PNG.");}finally{setBusy(false);}
          }}>Remove background again</button><label>Use your own transparent PNG<input type="file" accept="image/png" disabled={busy} onChange={async e=>{
            const file=e.target.files?.[0];if(!file)return;
            if(file.type!=="image/png"||file.size>30*1024*1024){setPictureMessage("Choose a PNG smaller than 30 MB. Large PNGs are resized automatically before upload.");return;}
            setBusy(true);
            try{const prepared=await prepareProductPng(file,false);setPicture(prepared);setProduct(prev=>prev?{...prev,image_url:prepared.dataUrl}:prev);setPictureMessage("Your PNG will be saved for both the printed tag and customer page.");setDirty(true);}
            catch{setPictureMessage("This PNG could not load. Choose another file.");}finally{setBusy(false);}
          }} /></label><p className={styles.hint}>Backgrounds are removed automatically for all product categories, including tiles. Review fine edges and white products; you can replace any cutout with your own PNG.</p></div>}
          {product && <><h2>2. Set the price</h2><div className={styles.fields}>
            <label>{draft.is_tile ? draft.unit === "BOX" ? "Price for ONE box including VAT (R)" : "Price per m² including VAT (R)" : "Price each including VAT (R)"}<input type="number" min="0.01" step="0.01" required value={draft.price} onChange={e => change({ price: e.target.value })} /></label>
            <label>Price basis<select value={draft.unit} onChange={e => change({ unit: e.target.value as TagUnit })}>{draft.is_tile ? <><option value="BOX">Per box (standard)</option><option value="M2">Per m² (only if priced by area)</option></> : <option value="EA">Each</option>}</select></label>
          </div><label className={styles.check}><input type="checkbox" checked={draft.is_tile} onChange={e => change({ is_tile: e.target.checked, unit: e.target.checked ? "BOX" : "EA" })} />Tile product — enable Smart Measure</label>
          {draft.is_tile && <fieldset><legend>Tile pack details</legend><p>Confirm the coverage printed on the box. Pack coverage is never guessed from the product photograph.</p><div className={styles.fields}>
            {numberField("m² per box (required)", "coverage_per_box", "0.0001")}{numberField("Tiles per box (optional)", "pieces_per_box", "1")}
            {numberField("Tile width in mm (optional)", "tile_width_mm", "1")}{numberField("Tile length in mm (optional)", "tile_length_mm", "1")}
          </div>{coverageMismatch&&<p role="alert" className={styles.notice}>Check box coverage: the entered {draft.coverage_per_box} m² differs from {nominalCoverage.toFixed(3)} m² calculated from the tile dimensions and count. Confirm the figure printed on the carton before generating.</p>}</fieldset>}
          {draft.is_tile && <p className={styles.notice} role="status">{draft.unit === "BOX" ? <>The entered amount is the price for one full box. Smart Measure total = full boxes needed × box price.{boxPriceCents !== null && <> 1 box: <b>{money(boxPriceCents)}</b> · 2 boxes: <b>{money(boxPriceCents * 2)}</b> · 3 boxes: <b>{money(boxPriceCents * 3)}</b>.</>}</> : <>You selected a price per m². Smart Measure will multiply this price by the full-box coverage.{boxPriceCents !== null && <> Equivalent price for one box: <b>{money(boxPriceCents)}</b>.</>}</>}</p>}
          <label className={styles.check}><input type="checkbox" checked={draft.published} onChange={e => change({ published: e.target.checked })} />Make this product and tag price visible to customers who scan</label>
          <button className={styles.primary} disabled={busy} onClick={() => void save()}>{busy ? "Saving…" : draft.published ? "Generate price tag" : "Save and hide QR page"}</button>
          <p className={styles.hint}>{brand === "busterbuild" && "Published BusterBuild prices also update the connected sales app, usually within one minute while online. "}The QR link stays the same when you update this tag. Reprint shelf tags after a price change. Tag prices are managed separately from the online shop.</p></>}
        </section>
        <section className={styles.panel}><h2>3. Print &amp; share</h2><p>Tags match your 3:2 template and print at 150 × 100 mm. Use A4, 100% scale, background graphics on and browser headers/footers off.</p>
          <label>Customer website address<input type="url" value={base} onChange={e => { setBase(e.target.value); setDirty(true); setQueue([]); }} /></label><p className={styles.hint}>Use the public HTTPS address where this Hub is deployed. Verify the first tag with your phone before printing a batch.</p>
          {saved && !dirty && saved.published && publicUrl && <a className={styles.customerLink} href={publicUrl} target="_blank" rel="noreferrer">Open customer page ↗</a>}
          {dirty && saved && <p className={styles.notice}>Save your changes to update the printable tag.</p>}
          <div className={styles.buttons}><button disabled={!queue.length || busy || jpgBusy || (dirty && Boolean(saved))} onClick={() => void downloadJpg(queue[queue.length-1])}>{jpgBusy?"Preparing JPG…":"Download latest JPG"}</button><button disabled={!queue.length || busy || jpgBusy || (dirty && Boolean(saved))} onClick={() => void print()}>Print / Save as PDF ({queue.length})</button><button disabled={!queue.length} onClick={() => setQueue([])}>Clear print sheet</button></div>
          <p className={styles.hint}>Add another product code to build a print sheet. The print sheet is kept for this session; saved prices and QR links stay in the Hub.</p>
          {message && <p role="status" className={styles.notice}>{message}</p>}
        </section>
      </div>
      {!queue.length && <div className={styles.empty}>Enter a code and price, then select Generate price tag to see your design.</div>}
    </section>
    <section className={styles.printSheet} data-print-sheet aria-label="Printable price tags">{queue.map(item => <div key={item.tag.token} className={styles.printItem}><div className={styles.remove}><span>{item.tag.code}</span><div><button disabled={jpgBusy || busy || (dirty && Boolean(saved))} onClick={()=>void downloadJpg(item)}>Download JPG</button><button onClick={() => setQueue(prev => prev.filter(p => p.tag.token !== item.tag.token))}>Remove from print sheet</button></div></div><PriceTagCard tag={item.tag} url={item.url} /></div>)}</section>
    {exportItem&&<div ref={exportRef} className={styles.exportStage} aria-hidden="true"><PriceTagCard tag={exportItem.tag} url={exportItem.url} /></div>}
  </main>;
}

"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { tileDefaults, type PriceTag, type TagUnit } from "../lib/price-tags";
import PriceTagCard from "./price-tag-card";
import styles from "./price-tags.module.css";
type Product = { id: number; code: string; name: string; category: string; description: string; image_url: string };
type Draft = { price: string; unit: TagUnit; is_tile: boolean; coverage_per_box: string; pieces_per_box: string; tile_width_mm: string; tile_length_mm: string; published: boolean };
const empty: Draft = { price: "", unit: "EA", is_tile: false, coverage_per_box: "", pieces_per_box: "", tile_width_mm: "", tile_length_mm: "", published: true };
export default function PriceTagGenerator() {
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
    setBusy(true); setMessage(""); setSaved(null); setProduct(null); setDirty(false);
    try {
      const res = await fetch(`/api/price-tags?code=${encodeURIComponent(code.trim())}`, { cache: "no-store" }); const json = await res.json();
      if (!res.ok) throw new Error(json.error || "The product could not load.");
      const p = json.product as Product; const tag = json.tag; const defaults = tileDefaults(p);
      setProduct(p); setDraft({ price: tag ? (Number(tag.price_cents) / 100).toFixed(2) : "", unit: tag?.unit || defaults.unit,
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
      const customerOrigin = origin();
      const res = await fetch("/api/price-tags", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ product_id: product.id, ...draft }) }); const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Tag could not save.");
      const tag: PriceTag = { ...json.tag, name: product.name, code: product.code, description: product.description, image_url: product.image_url, is_tile: Boolean(json.tag.is_tile), published: Boolean(json.tag.published) };
      setSaved(tag); setDirty(false);
      setQueue(prev => prev.filter(item => item.tag.token !== tag.token).concat(tag.published ? [{ tag, url: `${customerOrigin}/p/${tag.token}` }] : []));
      setMessage(tag.published ? "Tag saved and added to the print sheet. The QR page is ready." : "Tag hidden. Customers can no longer open this QR page.");
    } catch (e) { setMessage(e instanceof Error ? e.message : "Could not save tag."); }
    finally { setBusy(false); }
  };
  const numberField = (label: string, key: "coverage_per_box" | "pieces_per_box" | "tile_width_mm" | "tile_length_mm", step: string) => <label>{label}<input type="number" min="0" step={step} value={draft[key]} onChange={e => change({ [key]: e.target.value })} /></label>;
  let publicUrl = ""; try { if (saved) publicUrl = `${origin()}/p/${saved.token}`; } catch { /* Validated on save. */ }
  const print = async () => {
    setMessage("Preparing pictures for print…");
    await Promise.all(Array.from(document.querySelectorAll<HTMLImageElement>("[data-print-sheet] img")).map(async img => { try { await img.decode(); } catch { /* Broken image remains visible for review. */ } }));
    setMessage(""); window.print();
  };
  return <main className={styles.generator}>
    <section className={styles.controls}>
      <header className={styles.header}><img src="/powerbuild-logo-transparent.png" alt="PowerBuild" /><div><small>POWERBUILD RETAIL</small><h1>Price tag studio</h1><p>Your design. Your products. Ready to print.</p></div><Link href="/">Back to Hub</Link></header>
      <div className={styles.editor}>
        <section className={styles.panel}><h2>1. Choose a product</h2>
          <form onSubmit={e => { e.preventDefault(); void lookup(); }} className={styles.lookup}><label>Product code<input required autoFocus value={code} placeholder="e.g. A18167" onChange={e => { setCode(e.target.value); setProduct(null); setSaved(null); }} /></label><button disabled={busy || !code.trim()}>Find product</button></form>
          {product && <div className={styles.chosen}>{product.image_url && <img src={product.image_url} alt="" />}<div><b>{product.name}</b><small>{product.code} · {product.category}</small></div></div>}
          {product && <><h2>2. Set the price</h2><div className={styles.fields}>
            <label>Price including VAT (R)<input type="number" min="0.01" step="0.01" required value={draft.price} onChange={e => change({ price: e.target.value })} /></label>
            <label>Price basis<select value={draft.unit} onChange={e => change({ unit: e.target.value as TagUnit })}>{draft.is_tile ? <><option value="M2">Per m²</option><option value="BOX">Per box</option></> : <option value="EA">Each</option>}</select></label>
          </div><label className={styles.check}><input type="checkbox" checked={draft.is_tile} onChange={e => change({ is_tile: e.target.checked, unit: e.target.checked ? "M2" : "EA" })} />Tile product — enable Smart Measure</label>
          {draft.is_tile && <fieldset><legend>Tile pack details</legend><p>Confirm the coverage printed on the box. Pack coverage is never guessed from the product photograph.</p><div className={styles.fields}>
            {numberField("m² per box (required)", "coverage_per_box", "0.0001")}{numberField("Tiles per box (optional)", "pieces_per_box", "1")}
            {numberField("Tile width in mm (optional)", "tile_width_mm", "1")}{numberField("Tile length in mm (optional)", "tile_length_mm", "1")}
          </div></fieldset>}
          <label className={styles.check}><input type="checkbox" checked={draft.published} onChange={e => change({ published: e.target.checked })} />Make this product and tag price visible to customers who scan</label>
          <button className={styles.primary} disabled={busy} onClick={() => void save()}>{busy ? "Saving…" : draft.published ? "Generate price tag" : "Save and hide QR page"}</button>
          <p className={styles.hint}>The QR link stays the same when you update this tag. Reprint shelf tags after a price change. Tag prices are managed separately from the online shop.</p></>}
        </section>
        <section className={styles.panel}><h2>3. Print &amp; share</h2><p>Tags match your 3:2 template and print at 150 × 100 mm. Use A4, 100% scale, background graphics on and browser headers/footers off.</p>
          <label>Customer website address<input type="url" value={base} onChange={e => { setBase(e.target.value); setDirty(true); setQueue([]); }} /></label><p className={styles.hint}>Use the public HTTPS address where this Hub is deployed. Verify the first tag with your phone before printing a batch.</p>
          {saved && !dirty && saved.published && publicUrl && <a className={styles.customerLink} href={publicUrl} target="_blank" rel="noreferrer">Open customer page ↗</a>}
          {dirty && saved && <p className={styles.notice}>Save your changes to update the printable tag.</p>}
          <div className={styles.buttons}><button disabled={!queue.length || busy || (dirty && Boolean(saved))} onClick={() => void print()}>Print / Save as PDF ({queue.length})</button><button disabled={!queue.length} onClick={() => setQueue([])}>Clear print sheet</button></div>
          <p className={styles.hint}>Add another product code to build a print sheet. The print sheet is kept for this session; saved prices and QR links stay in the Hub.</p>
          {message && <p role="status" className={styles.notice}>{message}</p>}
        </section>
      </div>
      {!queue.length && <div className={styles.empty}>Enter a code and price, then select Generate price tag to see your design.</div>}
    </section>
    <section className={styles.printSheet} data-print-sheet aria-label="Printable price tags">{queue.map(item => <div key={item.tag.token} className={styles.printItem}><div className={styles.remove}><span>{item.tag.code}</span><button onClick={() => setQueue(prev => prev.filter(p => p.tag.token !== item.tag.token))}>Remove from print sheet</button></div><PriceTagCard tag={item.tag} url={item.url} /></div>)}</section>
  </main>;
}

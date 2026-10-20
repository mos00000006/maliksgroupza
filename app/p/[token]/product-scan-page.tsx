"use client";
import { useEffect, useState } from "react";
import { measureTiles, type PriceTag } from "../../lib/price-tags";
import styles from "./product-scan.module.css";
const money = (cents: number) => new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(cents / 100);
const decimal = (value: number) => value.toLocaleString("en-ZA", { maximumFractionDigits: 3 });
export default function ProductScanPage({ token }: { token: string }) {
  const [product, setProduct] = useState<PriceTag | null>(null); const [status, setStatus] = useState("Loading product…");
  const [rooms, setRooms] = useState([{ id: 1, length: "", width: "" }]); const [waste, setWaste] = useState("10");
  const [mode, setMode] = useState<"rooms" | "area">("rooms"); const [area, setArea] = useState(""); const [imageFailed, setImageFailed] = useState(false);
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await fetch(`/api/public-price-tags/${encodeURIComponent(token)}`, { cache: "no-store" }); const json = await res.json();
        if (active) { if (!res.ok) { setProduct(null); setStatus(json.error || "Product unavailable."); } else { setProduct(json.product); setStatus(""); } }
      } catch { if (active) setStatus("Could not load the current price. Check your connection and refresh."); }
    };
    void load(); const refresh = () => { if (!document.hidden) void load(); };
    document.addEventListener("visibilitychange", refresh); const timer = window.setInterval(refresh, 60000);
    return () => { active = false; document.removeEventListener("visibilitychange", refresh); window.clearInterval(timer); };
  }, [token]);
  const result = product?.is_tile ? measureTiles(mode === "area" ? [{ length: Number(area), width: 1 }] : rooms.map(r => ({ length: Number(r.length), width: Number(r.width) })), Number(waste), product.coverage_per_box, product.price_cents, product.unit) : null;
  return <main className={styles.page}>
    <header className={styles.header}><img src="/powerbuild-logo-transparent.png" alt="PowerBuild" /><span>BUILD WITH CONFIDENCE</span></header>
    <div className={styles.wrap}>{!product ? <section className={styles.unavailable}><h1>{status || "Product unavailable."}</h1><p>Ask a PowerBuild team member for help.</p><button onClick={() => window.location.reload()}>Refresh</button></section> : <>
      {status && <p role="status" className={styles.connection}>{status}</p>}
      <section className={styles.product}>
        <div className={styles.photo}>{!imageFailed ? <img src={product.image_url} alt={product.name} onError={() => setImageFailed(true)} /> : <span>Product picture unavailable</span>}</div>
        <div className={styles.productInfo}><div className={styles.code}>PRODUCT CODE · {product.code}</div><h1>{product.name}</h1><div className={styles.price}>{money(product.price_cents)}<span>{product.unit === "M2" ? "per m²" : product.unit === "BOX" ? "per box" : "each"}</span></div><p className={styles.vat}>Price includes VAT</p>
          {product.is_tile && <div className={styles.packs}><span><b>{product.coverage_per_box} m²</b>per box</span>{product.pieces_per_box > 0 && <span><b>{product.pieces_per_box} {Number(product.pieces_per_box) === 1 ? "tile" : "tiles"}</b>per box</span>}{product.tile_width_mm > 0 && product.tile_length_mm > 0 && <span><b>{product.tile_width_mm} × {product.tile_length_mm}</b>mm per tile</span>}</div>}
          <p className={styles.note}>While stocks last. Confirm availability with our team.</p></div>
      </section>
      {product.is_tile && <section className={styles.measure} aria-label="Tile smart measure"><header><div><span>LESS GUESSWORK. THE RIGHT QUANTITY.</span><h2>Smart Measure</h2><p>Plan your space and see how many full boxes you need.</p></div><div className={styles.measureMark}>m²</div></header>
        <div className={styles.measureBody}><div className={styles.inputs}><div className={styles.mode}><button className={mode === "rooms" ? styles.active : ""} onClick={() => setMode("rooms")}>Room dimensions</button><button className={mode === "area" ? styles.active : ""} onClick={() => setMode("area")}>I know my area</button></div>
          {mode === "rooms" ? <>{rooms.map((room, index) => <div className={styles.room} key={room.id}><b>Room {index + 1}</b><label>Length (m)<input type="number" min="0.001" max="10000" step="0.01" inputMode="decimal" value={room.length} placeholder="e.g. 4" onChange={e => setRooms(prev => prev.map(r => r.id === room.id ? { ...r, length: e.target.value } : r))} /></label><label>Width (m)<input type="number" min="0.001" max="10000" step="0.01" inputMode="decimal" value={room.width} placeholder="e.g. 3" onChange={e => setRooms(prev => prev.map(r => r.id === room.id ? { ...r, width: e.target.value } : r))} /></label>{rooms.length > 1 && <button aria-label={`Remove room ${index + 1}`} onClick={() => setRooms(prev => prev.filter(r => r.id !== room.id))}>×</button>}</div>)}<button className={styles.add} disabled={rooms.length >= 20} onClick={() => setRooms(prev => [...prev, { id: Math.max(...prev.map(r => r.id)) + 1, length: "", width: "" }])}>+ Add another room</button></> : <label className={styles.area}>Area to tile (m²)<input type="number" min="0.001" step="0.01" inputMode="decimal" value={area} onChange={e => setArea(e.target.value)} placeholder="e.g. 12" /></label>}
          <label className={styles.waste}>Allowance for cuts &amp; wastage<select value={waste} onChange={e => setWaste(e.target.value)}><option value="0">0%</option><option value="5">5%</option><option value="10">10% (standard allowance)</option><option value="15">15%</option><option value="20">20%</option><option value="30">30%</option></select></label>
        </div><div className={styles.results} aria-live="polite">{result ? <><small>YOUR PROJECT ESTIMATE</small><div className={styles.boxes}>{result.boxes}<span>full {result.boxes === 1 ? "box" : "boxes"}</span></div><dl><div><dt>Measured area</dt><dd>{decimal(result.area)} m²</dd></div><div><dt>With {waste}% allowance</dt><dd>{decimal(result.required)} m²</dd></div><div><dt>Coverage supplied</dt><dd>{decimal(result.supplied)} m²</dd></div></dl><div className={styles.total}><span>Estimated tile cost</span><strong>{money(result.totalCents)}</strong><small>Including VAT · {product.unit === "BOX" ? "charged per full box" : "price per m² × full-box coverage"}</small></div></> : <div className={styles.measureEmpty}><b>Let’s measure your space.</b><p>Enter positive dimensions or an area to calculate full boxes and tile cost.</p></div>}</div></div>
        <p className={styles.disclaimer}>Estimate only. Check your measurements, layout, cuts and box coverage with our team. Adhesive, grout and installation are extra.</p>
      </section>}
      <footer className={styles.footer}>POWERBUILD · Images for illustration purposes. E.&amp;O.E.</footer>
    </>}</div>
  </main>;
}

"use client";

import { flushSync } from "react-dom";
import { useMemo, useRef, useState, type FormEvent } from "react";
import { toJpeg } from "../lib/vendor/html-to-image.mjs";
import qrcode from "../lib/vendor/qrcode.mjs";
import { a4ShelfPricePdf } from "../lib/a4-shelf-price-pdf";
import { tagCustomerUrl, type TagBrand, type TagUnit } from "../lib/price-tags";
import styles from "./shelf-pricing-studio.module.css";

type Product = { id: number; code: string; name: string; category: string; description: string };
type Match = Pick<Product, "id" | "code" | "name" | "category">;
type TagRecord = {
  token: string;
  price_cents: number;
  unit: TagUnit;
  is_tile: number | boolean;
  coverage_per_box: number;
  pieces_per_box: number;
  tile_width_mm: number;
  tile_length_mm: number;
  colour?: string | null;
};
type Defaults = Partial<Pick<TagRecord, "unit" | "is_tile" | "coverage_per_box" | "pieces_per_box" | "tile_width_mm" | "tile_length_mm">>;
type Draft = {
  price: string;
  unit: TagUnit;
  is_tile: boolean;
  coverage_per_box: string;
  pieces_per_box: string;
  tile_width_mm: string;
  tile_length_mm: string;
  colour: string;
  copies: number;
};
type ShelfItem = {
  key: string;
  product_id: number;
  code: string;
  name: string;
  category: string;
  brand: TagBrand;
  token: string;
  url: string;
  price_cents: number;
  unit: TagUnit;
  colour: string;
  copies: number;
};

const LABELS_PER_PAGE = 12;
const blankDraft: Draft = {
  price: "",
  unit: "EA",
  is_tile: false,
  coverage_per_box: "",
  pieces_per_box: "",
  tile_width_mm: "",
  tile_length_mm: "",
  colour: "",
  copies: 1,
};

const responseJson = async <T,>(response: Response, fallback: string) => {
  const body = await response.json().catch(() => ({})) as T & { error?: string };
  if (!response.ok) throw new Error(body.error || fallback);
  return body;
};

const chunks = <T,>(items: T[], size: number) => {
  const pages: T[][] = [];
  for (let start = 0; start < items.length; start += size) pages.push(items.slice(start, start + size));
  return pages;
};

function ShelfLabel({ item }: { item: ShelfItem }) {
  const qr = qrcode(0, "M");
  qr.addData(item.url);
  qr.make();
  const qrImage = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(qr.createSvgTag({ cellSize: 3, margin: 4, scalable: true }))}`;
  const [whole, cents] = (item.price_cents / 100).toFixed(2).split(".");
  const buster = item.brand === "busterbuild";
  const unit = item.unit === "M2" ? "PER m²" : item.unit === "BOX" ? "PER BOX" : "EACH";
  const nameSize = item.name.length > 82 ? "4.1cqw" : item.name.length > 55 ? "4.7cqw" : "5.4cqw";
  return <article className={`${styles.label} ${buster ? styles.buster : styles.power}`}>
    <header className={styles.labelHeader}>
      <span className={styles.logoBox}><img src={buster ? "/price-tag-assets/busterbuild-logo-white.png" : "/powerbuild-logo-transparent.png"} alt="" /></span>
      <b>SHELF PRICE · VAT INCLUDED</b>
    </header>
    <div className={styles.labelBody}>
      <div className={styles.productCopy}>
        <h3 style={{ fontSize: nameSize }}>{item.name}</h3>
        {item.colour && <span className={styles.colour}>COLOUR: {item.colour}</span>}
        <strong>CODE: {item.code}</strong>
      </div>
      <div className={styles.price} data-digits={whole.length}>
        <span>R</span><strong>{whole}</strong><sup>{cents}</sup><small>{unit}</small>
      </div>
      <div className={styles.qr}><img src={qrImage} alt="" /><small>SCAN</small></div>
    </div>
  </article>;
}

function ShelfPage({ items, exportPage = false }: { items: ShelfItem[]; exportPage?: boolean }) {
  return <section className={`${styles.a4Page} ${exportPage ? styles.exportPage : ""}`} data-a4-shelf-page>
    {items.map((item, index) => <ShelfLabel key={`${item.key}-${index}`} item={item} />)}
  </section>;
}

export default function ShelfPricingStudio({ brand, onBack }: { brand: TagBrand; onBack: () => void }) {
  const brandName = brand === "busterbuild" ? "BusterBuild" : "PowerBuild";
  const formRef = useRef<HTMLFormElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<Match[]>([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [draft, setDraft] = useState<Draft>(blankDraft);
  const [queue, setQueue] = useState<ShelfItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [exportPages, setExportPages] = useState<ShelfItem[][]>([]);

  const labels = useMemo(() => queue.flatMap(item => Array.from({ length: item.copies }, () => item)), [queue]);
  const pages = useMemo(() => chunks(labels, LABELS_PER_PAGE), [labels]);

  const resetChoice = () => {
    setProduct(null);
    setDraft(blankDraft);
  };

  const loadProduct = async (code: string) => {
    setBusy(true);
    setMessage("");
    setMatches([]);
    resetChoice();
    try {
      const response = await fetch(`/api/price-tags?brand=${brand}&code=${encodeURIComponent(code.trim())}`, { cache: "no-store" });
      const body = await responseJson<{ product: Product; tag: TagRecord | null; defaults: Defaults }>(response, "The product could not load.");
      const tag = body.tag;
      const defaults = body.defaults || {};
      const isTile = tag ? Boolean(tag.is_tile) : Boolean(defaults.is_tile);
      setProduct(body.product);
      setQuery(body.product.code);
      setDraft({
        price: tag ? (Number(tag.price_cents) / 100).toFixed(2) : "",
        unit: tag?.unit || (isTile ? "BOX" : "EA"),
        is_tile: isTile,
        coverage_per_box: String(tag?.coverage_per_box || defaults.coverage_per_box || ""),
        pieces_per_box: String(tag?.pieces_per_box || defaults.pieces_per_box || ""),
        tile_width_mm: String(tag?.tile_width_mm || defaults.tile_width_mm || ""),
        tile_length_mm: String(tag?.tile_length_mm || defaults.tile_length_mm || ""),
        colour: String(tag?.colour || ""),
        copies: 1,
      });
      setMessage(tag ? "Saved price loaded. Adjust it if required, then add the label." : "Enter the shelf price and add the label.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The product could not load.");
    } finally {
      setBusy(false);
    }
  };

  const search = async (event: FormEvent) => {
    event.preventDefault();
    const value = query.trim();
    if (!value) return;
    setBusy(true);
    setMessage("");
    setMatches([]);
    resetChoice();
    try {
      const response = await fetch(`/api/price-tags?brand=${brand}&q=${encodeURIComponent(value)}`, { cache: "no-store" });
      const body = await responseJson<{ products?: Match[]; more?: boolean }>(response, "Product search could not load.");
      if (!Array.isArray(body.products)) {
        await loadProduct(value);
        return;
      }
      const exact = body.products.find(item => item.code.trim().toLowerCase() === value.toLowerCase());
      if (exact) {
        await loadProduct(exact.code);
        return;
      }
      setMatches(body.products);
      setMessage(!body.products.length ? "No matching active product was found." : body.more ? "Showing 30 matches. Add more words to narrow the search." : "Choose a product below.");
    } catch {
      // Older deployments may only support exact-code lookup. Keep that path usable.
      await loadProduct(value);
    } finally {
      setBusy(false);
    }
  };

  const addLabel = async () => {
    if (!product || !formRef.current?.reportValidity()) return;
    if (labels.length - (queue.find(item => item.product_id === product.id)?.copies || 0) + draft.copies > 240) {
      setMessage("Keep one download to 240 shelf labels or fewer.");
      return;
    }
    setBusy(true);
    setMessage("Saving the price and preparing its QR code…");
    try {
      const response = await fetch("/api/price-tags", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          product_id: product.id,
          brand,
          price: draft.price,
          unit: draft.unit,
          is_tile: draft.is_tile,
          coverage_per_box: draft.coverage_per_box,
          pieces_per_box: draft.pieces_per_box,
          tile_width_mm: draft.tile_width_mm,
          tile_length_mm: draft.tile_length_mm,
          colour: draft.colour,
          published: true,
        }),
      });
      const body = await responseJson<{ tag: TagRecord }>(response, "The shelf price could not save.");
      const cents = Number(body.tag.price_cents) || Math.round(Number(draft.price) * 100);
      const item: ShelfItem = {
        key: `${brand}-${product.id}`,
        product_id: product.id,
        code: product.code,
        name: product.name,
        category: product.category,
        brand,
        token: body.tag.token,
        url: tagCustomerUrl(window.location.origin, { token: body.tag.token, code: product.code, brand }),
        price_cents: cents,
        unit: body.tag.unit || draft.unit,
        colour: draft.colour.trim(),
        copies: draft.copies,
      };
      setQueue(previous => previous.filter(entry => entry.product_id !== product.id).concat(item));
      setMessage(`${draft.copies} ${draft.copies === 1 ? "label" : "labels"} added. The saved price and customer QR page are updated.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The shelf label could not be added.");
    } finally {
      setBusy(false);
    }
  };

  const setCopies = (key: string, copies: number) => {
    const safe = Math.max(1, Math.min(24, Math.floor(copies) || 1));
    const current = queue.find(item => item.key === key)?.copies || 0;
    if (labels.length - current + safe > 240) {
      setMessage("Keep one download to 240 shelf labels or fewer.");
      return;
    }
    setQueue(previous => previous.map(item => item.key === key ? { ...item, copies: safe } : item));
  };

  const download = async () => {
    if (!pages.length) return;
    setBusy(true);
    setMessage(`Preparing ${pages.length} high-resolution A4 ${pages.length === 1 ? "page" : "pages"}…`);
    try {
      flushSync(() => setExportPages(pages));
      await document.fonts.ready;
      await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      const nodes = Array.from(exportRef.current?.querySelectorAll<HTMLElement>("[data-a4-shelf-page]") || []);
      if (nodes.length !== pages.length) throw new Error("The A4 pages could not be prepared.");
      const rendered: string[] = [];
      for (const node of nodes) {
        await Promise.all(Array.from(node.querySelectorAll("img")).map(image => image.decode()));
        rendered.push(await toJpeg(node, {
          quality: 0.98,
          pixelRatio: 2,
          width: 1240,
          height: 1754,
          skipFonts: true,
          backgroundColor: "#ffffff",
          style: { width: "1240px", height: "1754px", margin: "0", boxShadow: "none" },
        }));
      }
      const url = URL.createObjectURL(a4ShelfPricePdf(rendered));
      const link = document.createElement("a");
      link.href = url;
      link.download = `${brandName}-Shelf-Prices-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
      setMessage(`A4 PDF downloaded: ${labels.length} labels across ${pages.length} ${pages.length === 1 ? "page" : "pages"}. Print at Actual size / 100%, then cut on the dotted lines.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The A4 PDF could not download.");
    } finally {
      setExportPages([]);
      setBusy(false);
    }
  };

  const field = (label: string, key: "coverage_per_box" | "pieces_per_box" | "tile_width_mm" | "tile_length_mm", step: string) => <label>{label}<input type="number" min="0" step={step} value={draft[key]} onChange={event => setDraft(previous => ({ ...previous, [key]: event.target.value }))} /></label>;

  return <main className={styles.studio}>
    <div className={styles.workspace}>
      <header className={styles.header}>
        <div><small>{brandName.toUpperCase()} · PRICE TAG STUDIO</small><h1>Shelf pricing A4</h1><p>90 × 40 mm labels · 12 per A4 page · automatic extra pages</p></div>
        <button disabled={busy} onClick={onBack}>Back to price tag studio</button>
      </header>
      <div className={styles.editor}>
        <section className={styles.panel}>
          <h2>1. Find and add products</h2>
          <form className={styles.search} onSubmit={search}>
            <label>Product name or code<input type="search" maxLength={150} required value={query} placeholder="e.g. TorkCraft holesaw or TC0047" onChange={event => { setQuery(event.target.value); setMatches([]); resetChoice(); setMessage(""); }} /></label>
            <button disabled={busy || !query.trim()}>{busy ? "Loading…" : "Find product"}</button>
          </form>
          {matches.length > 0 && <div className={styles.results}>{matches.map(match => <button key={match.id} disabled={busy} onClick={() => void loadProduct(match.code)}><span><b>{match.name}</b><small>{match.category}</small></span><strong>{match.code}</strong></button>)}</div>}
          {product && <form ref={formRef} className={styles.productEditor} onSubmit={event => { event.preventDefault(); void addLabel(); }}>
            <div className={styles.chosen}><b>{product.name}</b><span>{product.code} · {product.category}</span></div>
            <div className={styles.fields}>
              <label>Price including VAT (R)<input type="number" min="0.01" max="9999999.99" step="0.01" required value={draft.price} onChange={event => setDraft(previous => ({ ...previous, price: event.target.value }))} /></label>
              <label>Number of labels<input type="number" min="1" max="24" step="1" required value={draft.copies} onChange={event => setDraft(previous => ({ ...previous, copies: Math.max(1, Math.min(24, Number(event.target.value) || 1)) }))} /></label>
              <label>Price unit<select value={draft.unit} onChange={event => setDraft(previous => ({ ...previous, unit: event.target.value as TagUnit }))}>{draft.is_tile ? <><option value="BOX">Per box</option><option value="M2">Per m²</option></> : <option value="EA">Each</option>}</select></label>
              {!draft.is_tile && <label>Colour (optional)<input type="text" maxLength={80} value={draft.colour} placeholder="e.g. White" onChange={event => setDraft(previous => ({ ...previous, colour: event.target.value }))} /></label>}
            </div>
            <label className={styles.check}><input type="checkbox" checked={draft.is_tile} onChange={event => setDraft(previous => ({ ...previous, is_tile: event.target.checked, unit: event.target.checked ? "BOX" : "EA" }))} />Tile product — keep Smart Measure on the QR page</label>
            {draft.is_tile && <fieldset><legend>Tile pack details</legend><div className={styles.fields}>{field("m² per box", "coverage_per_box", "0.0001")}{field("Tiles per box", "pieces_per_box", "1")}{field("Tile width (mm)", "tile_width_mm", "1")}{field("Tile length (mm)", "tile_length_mm", "1")}</div></fieldset>}
            <button className={styles.primary} disabled={busy}>{busy ? "Saving…" : "Save price & add to A4"}</button>
          </form>}
          {message && <p role="status" className={styles.message}>{message}</p>}
        </section>
        <section className={styles.panel}>
          <div className={styles.queueHeading}><div><h2>2. A4 label list</h2><p>{labels.length} labels · {pages.length} A4 {pages.length === 1 ? "page" : "pages"}</p></div>{queue.length > 0 && <button disabled={busy} onClick={() => setQueue([])}>Clear all</button>}</div>
          {!queue.length && <div className={styles.empty}>Find a product, enter its price and add it to this A4 sheet.</div>}
          <div className={styles.queue}>{queue.map(item => <div className={styles.queueItem} key={item.key}><div><b>{item.name}</b><span>{item.code} · R{(item.price_cents / 100).toFixed(2)}</span></div><label>Copies<input type="number" min="1" max="24" value={item.copies} onChange={event => setCopies(item.key, Number(event.target.value))} /></label><button disabled={busy} onClick={() => setQueue(previous => previous.filter(entry => entry.key !== item.key))}>Remove</button></div>)}</div>
          <button className={styles.download} disabled={busy || !queue.length} onClick={() => void download()}>{busy ? "Preparing A4…" : `Download A4 PDF (${pages.length || 0})`}</button>
          <p className={styles.note}>Print the PDF at <b>Actual size / 100%</b> with scaling off. Cut around each dotted 90 × 40 mm label using scissors or a paper cutter.</p>
        </section>
      </div>
      {pages.length > 0 && <section className={styles.previewSection}><div><h2>A4 preview</h2><span>{pages.length} {pages.length === 1 ? "page" : "pages"}</span></div>{pages.map((page, index) => <div className={styles.pageWrap} key={index}><b>Page {index + 1}</b><div className={styles.pageCanvas}><ShelfPage items={page} /></div></div>)}</section>}
    </div>
    <div ref={exportRef} className={styles.exportStage} aria-hidden="true">{exportPages.map((page, index) => <ShelfPage key={index} items={page} exportPage />)}</div>
  </main>;
}

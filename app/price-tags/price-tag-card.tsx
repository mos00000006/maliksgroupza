"use client";
import ProductPicture from "./product-picture";
import qrcode from "../lib/vendor/qrcode.mjs";
import type { PriceTag } from "../lib/price-tags";
import styles from "./price-tags.module.css";
export default function PriceTagCard({ tag, url }: { tag: PriceTag; url: string }) {
  const qr = qrcode(0, "M"); qr.addData(url); qr.make();
  const qrImage = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(qr.createSvgTag({ cellSize: 4, margin: 16, scalable: true }))}`;
  const [whole, cents] = (tag.price_cents / 100).toFixed(2).split(".");
  return <article className={`${styles.tag} ${tag.brand === "busterbuild" ? styles.busterTag : ""}`} aria-label={`Price tag for ${tag.name}`}>
    <img className={styles.rail} src={tag.brand === "busterbuild" ? "/price-tag-assets/busterbuild-template.jpg" : "/price-tag-assets/powerbuild-rail.png"} alt={tag.brand === "busterbuild" ? "BusterBuild" : "PowerBuild"} />
    <div className={styles.tagMain}>
      {tag.brand !== "busterbuild" && <img className={styles.watermark} src="/powerbuild-logo-transparent.png" alt="" />}
      <div className={styles.productPicture}><ProductPicture src={tag.image_url} alt={tag.name} removeBackground={!tag.is_tile} /></div>
      <h2 className={styles.tagName} style={{ fontSize: tag.name.length > 100 ? "2.1cqw" : tag.name.length > 64 ? "2.6cqw" : undefined }}>{tag.name}</h2>
      <div className={styles.qrBlock}><img src={qrImage} alt="Scan to view product, price and tile smart measure" /><b>Code: {tag.code}</b></div>
      <div className={styles.packDetails}>{tag.is_tile ? <>{tag.pieces_per_box > 0 && <span>{tag.pieces_per_box} {Number(tag.pieces_per_box) === 1 ? "Tile" : "Tiles"} Per Box</span>}<span>{tag.coverage_per_box}m² Per Box</span></> : <><span>Scan for product</span><span>Price includes VAT</span></>}</div>
      <div className={styles.tagPrice} style={{ fontSize: whole.length > 5 ? "7cqw" : undefined }}><span>R</span><strong>{whole}</strong><sup>{cents}</sup><small>{tag.unit === "M2" ? "per m²" : tag.unit === "BOX" ? "per box" : "each"} · incl. VAT</small></div>
      <footer>While stocks last. Images for illustration purposes. We reserve the right to limit quantities. E.&amp;O.E.</footer>
    </div>
  </article>;
}

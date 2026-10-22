"use client";
import type { ComboTag } from "../lib/combo-tags";
import ComboComposition from "./combo-composition";
import qrcode from "../lib/vendor/qrcode.mjs";
import styles from "./combo-creator.module.css";
export default function ComboCard({combo,url}:{combo:ComboTag;url:string}) {
 const qr=qrcode(0,'M');qr.addData(url);qr.make();const image=`data:image/svg+xml;charset=utf-8,${encodeURIComponent(qr.createSvgTag({cellSize:4,margin:16,scalable:true}))}`;
 const [whole,cents]=(combo.price_cents/100).toFixed(2).split('.');const lines=combo.includes_text.split('\n').filter(line=>line.trim());const includesFont=Math.min(1.75,10.8/(Math.max(lines.length,1)*1.12),30/Math.max(1,...lines.map(line=>line.length)));const nameFont=Math.min(3.25,150/Math.max(combo.name.length,1));
 return <article className={`${styles.comboTag} ${combo.brand==='powerbuild'?styles.powerTag:''}`} aria-label={`Combo price tag for ${combo.name}`}>
  <img className={styles.rail} src={combo.brand==='busterbuild'?'/price-tag-assets/busterbuild-template.jpg':'/price-tag-assets/powerbuild-rail.png'} alt={combo.brand==='busterbuild'?'BusterBuild':'PowerBuild'}/>
  <div className={styles.main}><div className={styles.circle}/><div className={styles.comboPicture}><ComboComposition items={combo.items} showEmpty={!url} /></div>
   <h2 className={styles.comboName} style={{fontSize:`${nameFont}cqw`}}>{combo.name}</h2>
   <div className={styles.includes}><h3>{combo.includes_title}</h3><div style={{fontSize:`${includesFont}cqw`}}>{lines.map((line,index)=><p key={index}>{line}</p>)}</div></div>
   <div className={styles.qr}>{url ? <img src={image} alt="Scan for this combo and its total price"/> : <span>Save combo to create QR</span>}<b>Code: {combo.code}</b></div>
   <div className={styles.price} style={{fontSize:whole.length>5?'7cqw':undefined}}><span>R</span><strong>{whole}</strong><sup>{cents}</sup><small>Complete combo · incl. VAT</small></div>
   <footer>While stocks last. Images for illustration purposes. We reserve the right to limit quantities. E.&amp;O.E.</footer>
  </div>
 </article>;
}

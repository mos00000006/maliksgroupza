"use client";
import type { ComboItem } from "../lib/combo-tags";
import { rotationFit } from "../lib/combo-tags";
import styles from "./combo-creator.module.css";
export default function ComboComposition({items,showEmpty=false}:{items:ComboItem[];showEmpty?:boolean}) {
 return <div className={styles.composition} aria-label="Combo products">{items.map(item=><div key={item.id} className={styles.productSlot} data-combo-slot={item.id} style={{left:`${item.x}%`,top:`${item.y}%`,width:`${item.width}%`,height:`${item.height}%`}}>
  {item.image_url ? <div className={styles.rotatedProduct} style={{transform:`rotate(${item.rotation}deg) scale(${rotationFit(item)*item.scale})`}}><img src={item.image_url} alt={item.label}/></div> : showEmpty ? <span>{item.label}</span> : null}
 </div>)}</div>;
}

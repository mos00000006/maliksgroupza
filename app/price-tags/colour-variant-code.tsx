'use client';
import {sameProductCode} from '../lib/colour-product-code';
import styles from './colour-variant-code.module.css';
export default function ColourVariantCode({value,loadedCode,disabled,onChange,onApply}:{value:string;loadedCode:string;disabled:boolean;onChange:(value:string)=>void;onApply:()=>void}){
 const matches=sameProductCode(value,loadedCode);
 return <div className={styles.box}><label>Product code for this colour<input type="text" maxLength={150} value={value} disabled={disabled} placeholder="Enter this colour’s stock code" onChange={e=>onChange(e.target.value)}/></label><button type="button" disabled={disabled||!value.trim()||matches} onClick={onApply}>Use code for this colour</button><p role="status">{matches?<>Loaded product code: <b>{loadedCode}</b>. This is the code printed on the tag and used by its QR.</>:<>Code changed. Select <b>Use code for this colour</b> to load that product. Your entered price and colour carry over; review them before generating.</>}</p></div>;
}

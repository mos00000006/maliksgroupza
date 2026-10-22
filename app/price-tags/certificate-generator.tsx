"use client";
import {useRef,useState} from "react";
import {toJpeg} from "../lib/vendor/html-to-image.mjs";
import {certificatePdf} from "../lib/certificate-export";
import type {TagBrand} from "../lib/price-tags";
import styles from "./certificate-generator.module.css";

type Preset="appreciation"|"employee"|"sales"|"training"|"custom";
type Details={name:string;award:string;wording:string;period:string;branch:string;date:string;issuer:string;issuerRole:string;secondIssuer:string;secondRole:string;reference:string};
function localToday(){const now=new Date();return [now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-');}
const presets:Record<Exclude<Preset,'custom'>,{label:string;award:string;wording:string}>={
 appreciation:{label:'Staff appreciation',award:'Of Appreciation',wording:'In recognition of your dedication, teamwork and valuable contribution to our store. Thank you for making a difference every day.'},
 employee:{label:'Employee of the Month',award:'Employee of the Month',wording:'In recognition of your outstanding commitment, positive attitude and consistent contribution to our team and customers.'},
 sales:{label:'Sales Achievement',award:'Outstanding Sales Achievement',wording:'In recognition of your exceptional sales performance, dedication to customer service and contribution to our shared success.'},
 training:{label:'Training Completion',award:'Of Completion',wording:'For successfully completing the training programme below and demonstrating a commitment to learning and professional development.'}
};
function Artwork({brand,details,second}:{brand:TagBrand;details:Details;second:boolean}){
 const buster=brand==='busterbuild';const brandName=buster?'BusterBuild':'PowerBuild';
 const date=details.date?new Date(details.date+'T12:00:00').toLocaleDateString('en-ZA',{day:'numeric',month:'long',year:'numeric'}):'';
 const name=details.name.trim()||'Staff Member Name';
 return <article data-certificate-artwork className={`${styles.certificate} ${buster?styles.buster:styles.power}`} aria-label={`${brandName} staff certificate preview`}>
  <div className={styles.outerBorder}/><div className={styles.innerBorder}/><div className={styles.sideBand}/><div className={styles.cornerTop}/><div className={styles.cornerBottom}/>
  <div className={styles.brandHeader}><img src={buster?'/price-tag-assets/busterbuild-logo-white.png':'/powerbuild-logo-transparent.png'} alt={brandName}/></div>
  <div className={styles.values}>EXCELLENCE <span>·</span> COMMITMENT <span>·</span> GROWTH</div>
  <div className={styles.content}>
   <header className={styles.heading}><span>CELEBRATING OUR PEOPLE</span><h2>CERTIFICATE</h2></header>
   <h3 className={styles.award} style={{fontSize:`${Math.min(2.6,110/Math.max(details.award.length,1))}cqw`}}>{details.award||'Certificate of Appreciation'}</h3>
   <p className={styles.presented}>PROUDLY PRESENTED TO</p>
   <strong className={styles.recipient} style={{fontSize:`${Math.min(5.4,140/Math.max(name.length,1))}cqw`}}>{name}</strong>
   {details.branch.trim()&&<p className={styles.branch}>{details.branch}</p>}
   <p className={styles.wording} style={{fontSize:`${Math.min(1.6,400/Math.max(details.wording.length,1))}cqw`}}>{details.wording}</p>
   {details.period.trim()&&<strong className={styles.period}>{details.period}</strong>}
   {date&&<p className={styles.date}>AWARDED ON <b>{date}</b></p>}
   <div className={`${styles.signatures} ${second?styles.twoSignatures:''}`}>
    <div><strong>{details.issuer}</strong><span>{details.issuerRole||'Authorised signatory'}</span></div>
    {second&&<div><strong>{details.secondIssuer}</strong><span>{details.secondRole||'Authorised signatory'}</span></div>}
   </div>
   <div className={styles.footer}><span>{brandName.toUpperCase()} · PEOPLE MAKE THE DIFFERENCE</span>{details.reference.trim()&&<span>REF: {details.reference}</span>}</div>
  </div>
 </article>;
}
export default function CertificateGenerator({brand,onBack}:{brand:TagBrand;onBack:()=>void}){
 const[preset,setPreset]=useState<Preset>('appreciation');const[details,setDetails]=useState<Details>(()=>({name:'',award:presets.appreciation.award,wording:presets.appreciation.wording,period:'',branch:'',date:localToday(),issuer:'',issuerRole:'Branch Manager',secondIssuer:'',secondRole:'Operations Manager',reference:''}));
 const[second,setSecond]=useState(false);const[busy,setBusy]=useState(false);const[message,setMessage]=useState('');const form=useRef<HTMLFormElement>(null);const exportRef=useRef<HTMLDivElement>(null);
 const brandName=brand==='busterbuild'?'BusterBuild':'PowerBuild';
 const change=(key:keyof Details,value:string)=>{setDetails(prev=>({...prev,[key]:value}));setMessage('');};
 const choose=(value:Preset)=>{setPreset(value);if(value!=='custom')setDetails(prev=>({...prev,award:presets[value].award,wording:presets[value].wording}));setMessage('');};
 const download=async(format:'pdf'|'jpg')=>{
  if(!form.current?.reportValidity())return;
  if(!details.name.trim()||!details.award.trim()||!details.wording.trim()){setMessage('Enter the staff name, award title and certificate wording.');return;}
  setBusy(true);setMessage('Preparing your certificate…');
  try{
   await document.fonts.ready;await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));
   const node=exportRef.current?.firstElementChild as HTMLElement|null;if(!node)throw new Error('Preview unavailable.');
   await Promise.all(Array.from(node.querySelectorAll('img')).map(img=>img.decode()));
   const jpg=await toJpeg(node,{width:1754,height:1240,pixelRatio:2,quality:.98,skipFonts:true,backgroundColor:brand==='busterbuild'?'#fcfaf5':'#ffffff',style:{width:'1754px',height:'1240px',margin:'0',boxShadow:'none'}});
   let url='';const link=document.createElement('a');link.href=format==='pdf'?(url=URL.createObjectURL(certificatePdf(jpg))):jpg;link.download=`${brandName}-${details.name.trim().replace(/[^a-z0-9._-]/gi,'-')}-Certificate-A4.${format}`;
   document.body.appendChild(link);link.click();link.remove();if(url)window.setTimeout(()=>URL.revokeObjectURL(url),60000);
   setMessage(format==='pdf'?'PDF downloaded. A4 landscape: 297 × 210 mm. Print at Actual size / 100%.':'JPG downloaded (3508 × 2480 pixels), ready for sharing or A4 landscape printing.');
  }catch{setMessage('Could not download. Check the logo is visible, then try again.');}finally{setBusy(false);}
 };
 const field=(label:string,key:keyof Details,max:number,required=false)=><label>{label}<input required={required} maxLength={max} value={details[key]} onChange={e=>change(key,e.target.value)}/></label>;
 return <main className={styles.studio}><div className={styles.workspace}>
  <header className={styles.editorHeader}><div><small>{brandName.toUpperCase()} · STAFF STUDIO</small><h1>Staff Certificate Generator</h1><p>Recognise achievement. Celebrate your people.</p></div><button disabled={busy} onClick={onBack}>Back to price tag studio</button></header>
  <div className={styles.editor}>
   <form ref={form} className={styles.panel} onSubmit={e=>{e.preventDefault();void download('pdf');}}>
    <fieldset disabled={busy}>
     <h2>1. Choose an award</h2><label>Certificate type<select value={preset} onChange={e=>choose(e.target.value as Preset)}>{Object.entries(presets).map(([value,item])=><option key={value} value={value}>{item.label}</option>)}<option value="custom">Custom award</option></select></label>
     {field('Award title','award',80,true)}
     <h2>2. Staff member &amp; wording</h2>
     {field('Staff member full name','name',70,true)}{field('Branch / department (optional)','branch',80)}
     <label>Certificate wording<textarea required rows={5} maxLength={360} value={details.wording} onChange={e=>change('wording',e.target.value)}/></label>
     {field('Award period / training course (optional)','period',80)}
     <label>Award date<input type="date" required value={details.date} onChange={e=>change('date',e.target.value)}/></label>
     <h2>3. Signatories</h2>{field('Presented by (name, optional)','issuer',60)}{field('Presenter job title','issuerRole',60)}
     <label className={styles.check}><input type="checkbox" checked={second} onChange={e=>setSecond(e.target.checked)}/>Show a second signatory</label>
     {second&&<>{field('Second signatory name','secondIssuer',60)}{field('Second signatory job title','secondRole',60)}</>}
     {field('Certificate reference (optional)','reference',32)}
    </fieldset>
    <div className={styles.actions}><button type="submit" disabled={busy}>{busy?'Preparing…':'Download PDF'}</button><button type="button" disabled={busy} onClick={()=>void download('jpg')}>Download JPG</button></div>
    <p className={styles.note}>A4 landscape · 297 × 210 mm. PDF prints at Actual size / 100%. Signature lines are provided for signing after printing. Details stay in this screen until you leave it.</p>
    {message&&<p role="status" className={styles.message}>{message}</p>}
   </form>
   <section className={`${styles.panel} ${styles.previewPanel}`}><div className={styles.previewHeading}><h2>Live preview</h2><span>A4 · Landscape</span></div><div className={styles.preview}><Artwork brand={brand} details={details} second={second}/></div><p className={styles.note}>All award wording is editable. Choosing a preset replaces the award title and wording; the staff details stay in place.</p></section>
  </div>
 </div><div ref={exportRef} className={styles.exportStage} aria-hidden="true"><Artwork brand={brand} details={details} second={second}/></div></main>;
}

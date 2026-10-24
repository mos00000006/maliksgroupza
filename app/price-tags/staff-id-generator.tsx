"use client";
import {useRef,useState} from "react";
import {toJpeg} from "../lib/vendor/html-to-image.mjs";
import {staffIdPdf,staffIdSize,type IdOrientation} from "../lib/staff-id-export";
import type {TagBrand} from "../lib/price-tags";
import styles from "./staff-id-generator.module.css";
type Details={name:string;role:string;department:string;employeeId:string;branch:string;expiry:string};
function Artwork({brand,orientation,details,photo,zoom,position}:{brand:TagBrand;orientation:IdOrientation;details:Details;photo:string;zoom:number;position:number}){
 const buster=brand==='busterbuild',landscape=orientation==='landscape';const name=details.name.trim()||'Staff Member Name';
 const expiry=details.expiry?new Date(details.expiry+'T12:00:00').toLocaleDateString('en-ZA',{day:'numeric',month:'short',year:'numeric'}):'';
 return <article data-staff-id className={`${styles.idCard} ${buster?styles.buster:styles.power} ${landscape?styles.landscape:styles.portrait}`} aria-label={`${buster?'BusterBuild':'PowerBuild'} staff ID card preview`}>
  <div className={styles.brandPanel}/><div className={styles.accent}/>
  <div className={styles.logoFrame}>{buster?<svg viewBox="20 70 270 135" role="img" aria-label="BusterBuild"><image href="/price-tag-assets/busterbuild-logo-white.png" width="300" height="300"/></svg>:<img src="/powerbuild-logo-transparent.png" alt="PowerBuild"/>}</div>
  {details.branch.trim()&&<div className={styles.branch} data-id-fit style={{fontSize:`${Math.min(landscape?1.7:2.8,100/Math.max(details.branch.length,1))}cqw`}}>{details.branch}</div>}
  <span className={styles.badge}>STAFF</span>
  <div className={styles.photo}>{photo?<img src={photo} alt={`Photo of ${details.name.trim()||'staff member'}`} style={{objectPosition:`50% ${position}%`,transform:`scale(${zoom/100})`}}/>:<div className={styles.placeholder}><svg viewBox="0 0 100 120" aria-hidden="true"><circle cx="50" cy="34" r="23"/><path d="M8 116v-12c0-31 18-43 42-43s42 12 42 43v12Z"/></svg><span>Add staff photo</span></div>}</div>
  <strong className={styles.name} data-id-fit style={{fontSize:`${Math.min(landscape?4.8:6.5,(landscape?160:200)/Math.max(name.length,1))}cqw`}}>{name}</strong>
  {details.role.trim()&&<div className={styles.role} data-id-fit style={{fontSize:`${Math.min(landscape?2.5:3.6,140/Math.max(details.role.length,1))}cqw`}}>{details.role}</div>}
  {details.department.trim()&&<div className={styles.department} data-id-fit style={{fontSize:`${Math.min(landscape?1.9:2.9,125/Math.max(details.department.length,1))}cqw`}}>{details.department}</div>}
  <div className={styles.employee} data-id-fit><small>EMPLOYEE ID</small><b style={{fontSize:`${Math.min(landscape?2.6:4,100/Math.max(details.employeeId.length,1))}cqw`}}>{details.employeeId.trim()||'Your employee number'}</b></div>
  {expiry&&<p className={styles.expiry}>VALID UNTIL <b>{expiry}</b></p>}
  <footer>{buster?'BUSTERBUILD':'POWERBUILD'} · STAFF IDENTIFICATION</footer>
 </article>;
}
export default function StaffIdGenerator({brand,onBack}:{brand:TagBrand;onBack:()=>void}){
 const[details,setDetails]=useState<Details>({name:'',role:'Sales Consultant',department:'',employeeId:'',branch:'',expiry:''});const[orientation,setOrientation]=useState<IdOrientation>('portrait');const[photo,setPhoto]=useState('');const[zoom,setZoom]=useState(100),[position,setPosition]=useState(50);const[busy,setBusy]=useState(false),[message,setMessage]=useState('');const form=useRef<HTMLFormElement>(null),exportRef=useRef<HTMLDivElement>(null);
 const size=staffIdSize(orientation),brandName=brand==='busterbuild'?'BusterBuild':'PowerBuild';
 const change=(key:keyof Details,value:string)=>{setDetails(prev=>({...prev,[key]:value}));setMessage('');};
 const upload=async(file:File)=>{
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>20*1024*1024){setMessage('Choose a JPG, PNG or WebP photo smaller than 20 MB.');return;}
  setBusy(true);setMessage('Preparing staff photo…');
  try{const image=await createImageBitmap(file);const scale=Math.min(1,1600/Math.max(image.width,image.height));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.width*scale));canvas.height=Math.max(1,Math.round(image.height*scale));const ctx=canvas.getContext('2d');if(!ctx){image.close();throw new Error();}ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0,canvas.width,canvas.height);image.close();setPhoto(canvas.toDataURL('image/jpeg',.96));setZoom(100);setPosition(50);setMessage('Photo ready. Adjust the crop to frame the face.');}catch{setMessage('This photo could not load. Choose another picture.');}finally{setBusy(false);}
 };
 const download=async(format:'pdf'|'jpg')=>{
  if(!form.current?.reportValidity())return;
  if(!details.name.trim()||!details.employeeId.trim()){setMessage('Enter the staff name and employee number.');return;}
  if(!photo){setMessage('Add the staff photo before downloading.');return;}
  setBusy(true);setMessage('Preparing staff ID card…');
  try{
   await document.fonts.ready;await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));
   const node=exportRef.current?.firstElementChild as HTMLElement|null;if(!node)throw new Error();
   if(Array.from(node.querySelectorAll<HTMLElement>('[data-id-fit]')).some(el=>el.scrollHeight>el.clientHeight+2||el.scrollWidth>el.clientWidth+2)){setMessage('Some wording does not fit. Shorten the name, job title, department or employee number, then retry.');return;}
   await Promise.all(Array.from(node.querySelectorAll('img')).map(img=>img.decode()));
   // Inline SVG logos also have external image references; embed before export.
   const logo=node.querySelector('svg image');let previous:string|null=null;
   if(logo){previous=logo.getAttribute('href');const response=await fetch(previous!);if(!response.ok)throw new Error();const blob=await response.blob();const data=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=reject;reader.readAsDataURL(blob);});logo.setAttribute('href',data);}
   let jpeg:string;
   try{jpeg=await toJpeg(node,{width:size.pixelsWide/2,height:size.pixelsHigh/2,pixelRatio:2,quality:.98,skipFonts:true,backgroundColor:'#ffffff',style:{width:`${size.pixelsWide/2}px`,height:`${size.pixelsHigh/2}px`,margin:'0',boxShadow:'none'}});}finally{if(logo&&previous)logo.setAttribute('href',previous);}
   let url='';const link=document.createElement('a');link.href=format==='pdf'?(url=URL.createObjectURL(staffIdPdf(jpeg,orientation))):jpeg;link.download=`${brandName}-${details.employeeId.trim().replace(/[^a-z0-9._-]/gi,'-')}-Staff-ID-${orientation}.${format}`;document.body.appendChild(link);link.click();link.remove();if(url)window.setTimeout(()=>URL.revokeObjectURL(url),60000);
   setMessage(format==='pdf'?`PDF downloaded at ${size.width} × ${size.height} mm. Print at Actual size / 100%.`:`JPG downloaded (${size.pixelsWide} × ${size.pixelsHigh} pixels). Set printed size to ${size.width} × ${size.height} mm.`);
  }catch{setMessage('Could not download. Check the logo and staff photo are visible, then try again.');}finally{setBusy(false);}
 };
 const field=(label:string,key:keyof Details,max:number,required=false)=><label>{label}<input value={details[key]} maxLength={max} required={required} onChange={e=>change(key,e.target.value)}/></label>;
 return <main className={styles.studio}><div className={styles.workspace}>
  <header className={styles.header}><div><small>{brandName.toUpperCase()} · STAFF STUDIO</small><h1>Staff ID Card Generator</h1><p>Photo identification in your store’s colours.</p></div><button disabled={busy} onClick={onBack}>Back to price tag studio</button></header>
  <div className={styles.editor}>
   <form ref={form} className={styles.panel} onSubmit={e=>{e.preventDefault();void download('pdf');}}><fieldset disabled={busy}>
    <h2>1. Layout &amp; staff details</h2><label>Card layout<select value={orientation} onChange={e=>{setOrientation(e.target.value as IdOrientation);setMessage('');}}><option value="portrait">Portrait — 54 × 86 mm</option><option value="landscape">Landscape — 86 × 54 mm</option></select></label>
    {field('Staff member full name','name',70,true)}{field('Employee number','employeeId',32,true)}{field('Job title (optional)','role',60)}{field('Department (optional)','department',60)}{field('Branch / store (optional)','branch',60)}
    <label>Expiry date (optional)<input type="date" value={details.expiry} onChange={e=>change('expiry',e.target.value)}/></label>
    <h2>2. Staff photo</h2><label>Upload staff photo<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>{const file=e.target.files?.[0];if(file)void upload(file);e.target.value='';}}/></label><p className={styles.note}>Use a clear head-and-shoulders photo. JPG, PNG or WebP, up to 20 MB.</p>
    {photo&&<><label>Photo zoom — {zoom}%<input type="range" min="100" max="200" step="5" value={zoom} onChange={e=>setZoom(Number(e.target.value))}/></label><label>Photo vertical position<input type="range" min="0" max="100" step="1" value={position} onChange={e=>setPosition(Number(e.target.value))}/></label><div className={styles.photoActions}><button type="button" onClick={()=>{setZoom(100);setPosition(50);}}>Reset crop</button><button type="button" onClick={()=>{setPhoto('');setMessage('Photo removed. Add a photo before downloading.');}}>Remove photo</button></div></>}
   </fieldset><div className={styles.actions}><button type="submit" disabled={busy}>{busy?'Preparing…':'Download PDF'}</button><button type="button" disabled={busy} onClick={()=>void download('jpg')}>Download JPG</button></div>
    <p className={styles.note}>PDF uses the exact card size shown. Print at Actual size / 100%. Staff details and photos stay in this screen; download before leaving.</p>{message&&<p role="status" className={styles.message}>{message}</p>}
   </form>
   <section className={`${styles.panel} ${styles.previewPanel}`}><div className={styles.previewHeader}><h2>Live preview</h2><span>{size.width} × {size.height} mm</span></div><div className={`${styles.preview} ${orientation==='landscape'?styles.widePreview:''}`}><Artwork brand={brand} orientation={orientation} details={details} photo={photo} zoom={zoom} position={position}/></div><p className={styles.note}>Preview is enlarged for editing. Switch layouts without losing the staff details or photo.</p></section>
  </div>
 </div><div ref={exportRef} className={styles.exportStage} style={{width:size.pixelsWide/2,height:size.pixelsHigh/2}} aria-hidden="true"><Artwork brand={brand} orientation={orientation} details={details} photo={photo} zoom={zoom} position={position}/></div></main>;
}

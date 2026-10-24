"use client";
import {useEffect,useRef,useState} from "react";
import {toJpeg} from "../lib/vendor/html-to-image.mjs";
import {staffIdPdf,staffIdSize,type IdOrientation} from "../lib/staff-id-export";
import qrcode from "../lib/vendor/qrcode.mjs";
import {priceTagResponse} from "../lib/price-tag-response";
import type {StaffIdDetails,StaffIdRecord} from "../lib/staff-id-verification";
import type {TagBrand} from "../lib/price-tags";
import styles from "./staff-id-generator.module.css";
type Details=StaffIdDetails;
type StaffSummary={token:string;employee_id:string;name:string;active:number};
const initial:Details={name:"",role:"Sales Consultant",department:"",employeeId:"",branch:"",expiry:"",startDate:""};
function Artwork({brand,orientation,details,photo,zoom,position,verificationUrl}:{brand:TagBrand;orientation:IdOrientation;details:Details;photo:string;zoom:number;position:number;verificationUrl:string}){
 const buster=brand==='busterbuild',landscape=orientation==='landscape';const name=details.name.trim()||'Staff Member Name';
 let qrImage='';if(verificationUrl){const qr=qrcode(0,'M');qr.addData(verificationUrl);qr.make();qrImage='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(qr.createSvgTag({cellSize:4,margin:16,scalable:true}));}
 const expiry=details.expiry?new Date(details.expiry+'T12:00:00').toLocaleDateString('en-ZA',{day:'numeric',month:'short',year:'numeric'}):'';
 return <article data-staff-id className={`${styles.idCard} ${buster?styles.buster:styles.power} ${landscape?styles.landscape:styles.portrait}`} aria-label={`${buster?'BusterBuild':'PowerBuild'} staff ID card preview`}>
  <div className={styles.brandPanel}/><div className={styles.accent}/>
  <div className={styles.logoFrame}>{buster?<svg viewBox="20 70 270 135" role="img" aria-label="BusterBuild"><image href="/price-tag-assets/busterbuild-logo-white.png" width="300" height="300"/></svg>:<img src="/powerbuild-logo-transparent.png" alt="PowerBuild"/>}</div>
  {details.branch.trim()&&<div className={styles.branch} data-id-fit style={{fontSize:`${Math.min(landscape?1.7:2.8,100/Math.max(details.branch.length,1))}cqw`}}>{details.branch}</div>}
  <span className={styles.badge}>STAFF</span>
  <div className={styles.photo}>{photo?<img src={photo} alt={`Photo of ${details.name.trim()||'staff member'}`} style={{objectPosition:`50% ${position}%`,transform:`scale(${zoom/100})`}}/>:<div className={styles.placeholder}><svg viewBox="0 0 100 120" aria-hidden="true"><circle cx="50" cy="34" r="23"/><path d="M8 116v-12c0-31 18-43 42-43s42 12 42 43v12Z"/></svg><span>Add staff photo</span></div>}</div>
  <div className={styles.verificationQr}>{qrImage?<><img src={qrImage} alt="Staff verification QR code"/><small>SCAN TO VERIFY</small></>:<span>Save staff record to add QR</span>}</div>
  <strong className={styles.name} data-id-fit style={{fontSize:`${Math.min(landscape?4.8:6.5,(landscape?160:200)/Math.max(name.length,1))}cqw`}}>{name}</strong>
  {details.role.trim()&&<div className={styles.role} data-id-fit style={{fontSize:`${Math.min(landscape?2.2:3.6,(landscape?100:140)/Math.max(details.role.length,1))}cqw`}}>{details.role}</div>}
  {details.department.trim()&&<div className={styles.department} data-id-fit style={{fontSize:`${Math.min(landscape?1.9:2.9,125/Math.max(details.department.length,1))}cqw`}}>{details.department}</div>}
  <div className={styles.employee} data-id-fit><small>EMPLOYEE ID</small><b style={{fontSize:`${Math.min(landscape?2.6:4,(landscape?55:100)/Math.max(details.employeeId.length,1))}cqw`}}>{details.employeeId.trim()||'Your employee number'}</b></div>
  {expiry&&<p className={styles.expiry}>VALID UNTIL <b>{expiry}</b></p>}
  <footer>{buster?'BUSTERBUILD':'POWERBUILD'} · STAFF IDENTIFICATION</footer>
 </article>;
}
export default function StaffIdGenerator({brand,onBack}:{brand:TagBrand;onBack:()=>void}){
 const[details,setDetails]=useState<Details>(initial);const[orientation,setOrientation]=useState<IdOrientation>('portrait');const[photo,setPhoto]=useState('');const[zoom,setZoom]=useState(100),[position,setPosition]=useState(50);const[busy,setBusy]=useState(false),[message,setMessage]=useState('');const form=useRef<HTMLFormElement>(null),exportRef=useRef<HTMLDivElement>(null);
 const[saved,setSaved]=useState<StaffIdRecord|null>(null),[dirty,setDirty]=useState(true),[active,setActive]=useState(true),[photoChanged,setPhotoChanged]=useState(false),[staffList,setStaffList]=useState<StaffSummary[]>([]),[search,setSearch]=useState(''),[listMessage,setListMessage]=useState('');
 useEffect(()=>{const controller=new AbortController();fetch(`/api/price-tags/staff-ids?brand=${brand}`,{cache:'no-store',signal:controller.signal}).then(response=>priceTagResponse(response,'Saved staff cards could not load.')).then(json=>setStaffList(json.staff as StaffSummary[])).catch(error=>{if(!controller.signal.aborted)setListMessage(error instanceof Error?error.message:'Could not load saved cards.');});return()=>controller.abort();},[brand]);
 const verificationUrl=saved?`${window.location.origin}/p/staff/${saved.token}`:'';
 const refreshList=async()=>{try{const result=await priceTagResponse(await fetch(`/api/price-tags/staff-ids?brand=${brand}&q=${encodeURIComponent(search)}`,{cache:'no-store'}),'Saved cards could not load.');setStaffList(result.staff as StaffSummary[]);setListMessage('');}catch(error){setListMessage(error instanceof Error?error.message:'Could not load saved cards.');}};
 const loadStaff=async(token:string)=>{setBusy(true);setMessage('Loading saved staff card…');try{const result=await priceTagResponse(await fetch(`/api/price-tags/staff-ids?brand=${brand}&token=${token}`,{cache:'no-store'}),'Staff card could not load.');const row=result.staff as StaffIdRecord;setDetails({name:row.name,employeeId:row.employeeId,role:row.role,department:row.department,branch:row.branch,expiry:row.expiry,startDate:row.startDate});setSaved(row);setActive(row.active);setPhoto(row.photoUrl);setZoom(row.photoZoom);setPosition(row.photoPosition);setPhotoChanged(false);setDirty(false);setMessage(row.active?'Saved staff card loaded.':'Verification is deactivated for this staff card.');}catch(error){setMessage(error instanceof Error?error.message:'Staff card could not load.');}finally{setBusy(false);}};
 const newStaff=()=>{setDetails(initial);setSaved(null);setPhoto('');setZoom(100);setPosition(50);setActive(true);setDirty(true);setPhotoChanged(false);setMessage('Enter the new employee details and photo.');};
 const saveStaff=async()=>{
  if(!form.current?.reportValidity())return;if(!details.name.trim()||!details.employeeId.trim()||!photo){setMessage('Enter the staff name, employee number and photo.');return;}
  setBusy(true);setMessage('Saving staff verification…');try{
   const body=new FormData();body.append('details',JSON.stringify({...details,brand,active,photoZoom:zoom,photoPosition:position,token:saved?.token,version:saved?.version}));
   if(photoChanged){let image=await(await fetch(photo)).blob();if(image.size>1500000){const bitmap=await createImageBitmap(image);const factor=Math.min(1,1200/Math.max(bitmap.width,bitmap.height));const canvas=document.createElement('canvas');canvas.width=Math.round(bitmap.width*factor);canvas.height=Math.round(bitmap.height*factor);canvas.getContext('2d')!.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();image=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('Photo could not be prepared.')),'image/jpeg',.85));}body.append('photo',image,'staff.jpg');}
   const result=await priceTagResponse(await fetch('/api/price-tags/staff-ids',{method:'POST',body}),'Staff verification could not save.');const row=result.staff as StaffIdRecord;setSaved(row);setDetails({name:row.name,employeeId:row.employeeId,role:row.role,department:row.department,branch:row.branch,expiry:row.expiry,startDate:row.startDate});setActive(row.active);setPhoto(row.photoUrl);setZoom(row.photoZoom);setPosition(row.photoPosition);setDirty(false);setPhotoChanged(false);setMessage(row.active?'Verification saved. The QR page is ready. Download a new card to include its QR.':'Verification deactivated. Anyone scanning this QR will no longer receive employment confirmation.');void refreshList();
  }catch(error){setMessage(error instanceof Error?error.message:'Staff verification could not save.');}finally{setBusy(false);}
 };
 const size=staffIdSize(orientation),brandName=brand==='busterbuild'?'BusterBuild':'PowerBuild';
 const change=(key:keyof Details,value:string)=>{setDetails(prev=>({...prev,[key]:value}));setDirty(true);setMessage('');};
 const upload=async(file:File)=>{
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>20*1024*1024){setMessage('Choose a JPG, PNG or WebP photo smaller than 20 MB.');return;}
  setBusy(true);setMessage('Preparing staff photo…');
  try{const image=await createImageBitmap(file);const scale=Math.min(1,1600/Math.max(image.width,image.height));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.width*scale));canvas.height=Math.max(1,Math.round(image.height*scale));const ctx=canvas.getContext('2d');if(!ctx){image.close();throw new Error();}ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0,canvas.width,canvas.height);image.close();setPhoto(canvas.toDataURL('image/jpeg',.96));setPhotoChanged(true);setDirty(true);setZoom(100);setPosition(50);setMessage('Photo ready. Adjust the crop to frame the face.');}catch{setMessage('This photo could not load. Choose another picture.');}finally{setBusy(false);}
 };
 const download=async(format:'pdf'|'jpg')=>{
  if(!form.current?.reportValidity())return;
  if(!details.name.trim()||!details.employeeId.trim()){setMessage('Enter the staff name and employee number.');return;}
  if(!photo){setMessage('Add the staff photo before downloading.');return;}
  if(!saved||dirty){setMessage('Save staff verification before downloading so the QR matches the saved employment record.');return;}
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
   <form ref={form} className={styles.panel} onSubmit={e=>{e.preventDefault();void saveStaff();}}><fieldset disabled={busy}>
    <h2>Saved staff cards</h2><div className={styles.savedSearch}><label>Find employee number or name<input value={search} onChange={e=>setSearch(e.target.value)} maxLength={100}/></label><button type="button" onClick={()=>void refreshList()}>Search saved cards</button></div>
    {listMessage&&<p className={styles.note}>{listMessage}</p>}<div className={styles.savedList}>{staffList.map(row=><button type="button" key={row.token} onClick={()=>void loadStaff(row.token)}>{row.employee_id} · {row.name}{!row.active?' — verification disabled':''}</button>)}</div><button type="button" onClick={newStaff}>+ New staff card</button>
    <h2>1. Layout &amp; staff details</h2><label>Card layout<select value={orientation} onChange={e=>{setOrientation(e.target.value as IdOrientation);setMessage('');}}><option value="portrait">Portrait — 54 × 86 mm</option><option value="landscape">Landscape — 86 × 54 mm</option></select></label>
    {field('Staff member full name','name',70,true)}{field('Employee number','employeeId',32,true)}{field('Job title (optional)','role',60)}{field('Department (optional)','department',60)}{field('Branch / store (optional)','branch',60)}
    <label>Employment start date (optional)<input type="date" value={details.startDate} onChange={e=>change('startDate',e.target.value)}/></label>
    <label>Expiry date (optional)<input type="date" value={details.expiry} onChange={e=>change('expiry',e.target.value)}/></label>
    <h2>2. Staff photo</h2><label>Upload staff photo<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>{const file=e.target.files?.[0];if(file)void upload(file);e.target.value='';}}/></label><p className={styles.note}>Use a clear head-and-shoulders photo. JPG, PNG or WebP, up to 20 MB.</p>
    {photo&&<><label>Photo zoom — {zoom}%<input type="range" min="100" max="200" step="5" value={zoom} onChange={e=>{setZoom(Number(e.target.value));setDirty(true);}}/></label><label>Photo vertical position<input type="range" min="0" max="100" step="1" value={position} onChange={e=>{setPosition(Number(e.target.value));setDirty(true);}}/></label><div className={styles.photoActions}><button type="button" onClick={()=>{setZoom(100);setPosition(50);setDirty(true);}}>Reset crop</button><button type="button" onClick={()=>{setPhoto('');setDirty(true);setMessage('Photo removed. Add a photo before downloading.');}}>Remove photo</button></div></>}
    <h2>3. Employment verification</h2><label className={styles.check}><input type="checkbox" checked={active} onChange={e=>{setActive(e.target.checked);setDirty(true);}}/>Currently employed — enable public verification</label><p className={styles.note}>Saving an enabled record makes this photo and work details visible to anyone scanning its QR. Disable verification when the employee leaves. Expired cards do not confirm employment.</p>
   </fieldset><div className={styles.actions}><button type="submit" disabled={busy}>{busy?'Saving…':active?'Save staff verification & generate QR':'Save & deactivate verification'}</button><button type="button" disabled={busy} onClick={()=>void download('pdf')}>Download PDF</button><button type="button" disabled={busy} onClick={()=>void download('jpg')}>Download JPG</button></div>
    <p className={styles.note}>PDF uses the exact card size shown. Print at Actual size / 100%. Saved staff records and QR links remain in the Hub. Save changes before downloading; the QR stays the same when you update or deactivate this record.</p>{verificationUrl&&<a className={styles.verifyLink} href={verificationUrl} target="_blank" rel="noreferrer">Open staff verification page ↗</a>}{dirty&&saved&&<p className={styles.note}>Unsaved changes. Save before downloading this card.</p>}{message&&<p role="status" className={styles.message}>{message}</p>}
   </form>
   <section className={`${styles.panel} ${styles.previewPanel}`}><div className={styles.previewHeader}><h2>Live preview</h2><span>{size.width} × {size.height} mm</span></div><div className={`${styles.preview} ${orientation==='landscape'?styles.widePreview:''}`}><Artwork brand={brand} orientation={orientation} details={details} photo={photo} zoom={zoom} position={position} verificationUrl={dirty?'':verificationUrl}/></div><p className={styles.note}>Preview is enlarged for editing. Switch layouts without losing the staff details or photo.</p></section>
  </div>
 </div><div ref={exportRef} className={styles.exportStage} style={{width:size.pixelsWide/2,height:size.pixelsHigh/2}} aria-hidden="true"><Artwork brand={brand} orientation={orientation} details={details} photo={photo} zoom={zoom} position={position} verificationUrl={dirty?'':verificationUrl}/></div></main>;
}

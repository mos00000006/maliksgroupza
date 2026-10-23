"use client";
import {useRef,useState} from "react";
import {toJpeg} from "../lib/vendor/html-to-image.mjs";
import {signageSize,signagePdf,type Paper,type Orientation} from "../lib/signage-export";
import type {TagBrand} from "../lib/price-tags";
import styles from "./store-signage.module.css";
type Template='hours'|'department'|'direction'|'delivery'|'notice'|'custom';
type Arrow='none'|'left'|'right'|'up'|'down';
type Details={title:string;subtitle:string;body:string;branch:string;phone:string;address:string;footer:string};
const days=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday','Public holidays'];
const templates:Record<Template,{label:string;title:string;subtitle:string;body:string}>={
 hours:{label:'Opening hours',title:'OPENING HOURS',subtitle:'We look forward to welcoming you.',body:''},
 department:{label:'Department sign',title:'TILES & SANWARE',subtitle:'Explore our range in store.',body:''},
 direction:{label:'Collection / direction sign',title:'COLLECTION POINT',subtitle:'Please have your invoice ready.',body:''},
 delivery:{label:'Delivery information',title:'DELIVERY AVAILABLE',subtitle:'Ask our team for a delivery quote.',body:'Speak to a salesperson about delivery areas, charges and booking times.'},
 notice:{label:'Customer notice',title:'CUSTOMER NOTICE',subtitle:'',body:'Please speak to our team if you need assistance.'},
 custom:{label:'Custom sign',title:'',subtitle:'',body:''}
};
function DirectionArrow({direction}:{direction:Exclude<Arrow,'none'>}){
 const angle={left:0,right:180,up:90,down:270}[direction];
 return <svg className={styles.arrow} viewBox="0 0 160 160" role="img" aria-label={`${direction} arrow`}><path transform={`rotate(${angle} 80 80)`} fill="currentColor" d="M12 80 68 24v34h80v44H68v34Z"/></svg>;
}
function Artwork({brand,orientation,template,arrow,details,hours,scale}:{brand:TagBrand;orientation:Orientation;template:Template;arrow:Arrow;details:Details;hours:string[];scale:number}){
 const buster=brand==='busterbuild',landscape=orientation==='landscape';const factor=scale/100;
 return <article data-signage-artwork className={`${styles.artwork} ${buster?styles.buster:styles.power} ${landscape?styles.landscape:styles.portrait}`} aria-label={`${buster?'BusterBuild':'PowerBuild'} store sign preview`}>
  <div className={styles.corner}/><div className={styles.accent}/><div className={styles.mainPanel}/>
  <header className={styles.brandHeader}><div className={styles.logoFrame}><img src={buster?'/price-tag-assets/busterbuild-logo-white.png':'/powerbuild-logo-transparent.png'} alt={buster?'BusterBuild':'PowerBuild'}/></div><strong data-sign-fit style={{fontSize:`${Math.min(landscape?2.2:3.4,100/Math.max(details.branch.length,1))}cqw`}}>{details.branch||'IN-STORE INFORMATION'}</strong></header>
  <section className={styles.content} data-sign-fit>
   <h2 data-sign-fit style={{fontSize:`${Math.min(landscape?6.5:8,200/Math.max(details.title.length,1))*factor}cqw`}}>{details.title||'YOUR SIGN TITLE'}</h2>
   {details.subtitle.trim()&&<p className={styles.subtitle} data-sign-fit style={{fontSize:`${Math.min(landscape?2.2:3.2,220/Math.max(details.subtitle.length,1))*factor}cqw`}}>{details.subtitle}</p>}
   {template==='hours'?<div className={styles.hours} data-sign-fit>{days.map((day,index)=>(index<7||hours[index].trim())&&<div key={day} className={styles.hoursRow} data-sign-fit style={{fontSize:`${(landscape?1.9:3.3)*factor}cqw`}}><b>{day}</b><span>{hours[index]||'Add hours'}</span></div>)}</div>:<>
    {arrow!=='none'&&<div className={styles.arrowFrame}><DirectionArrow direction={arrow}/></div>}
    {details.body.trim()&&<p className={styles.body} data-sign-fit style={{fontSize:`${Math.min(landscape?3:4.2,(landscape?700:1200)/Math.max(details.body.length,1))*factor}cqw`}}>{details.body}</p>}
   </>}
  </section>
  <footer className={styles.footer} data-sign-fit>{details.phone.trim()&&<strong>{details.phone}</strong>}{details.address.trim()&&<p style={{fontSize:`${Math.min(landscape?1.4:2,140/Math.max(details.address.length,1))}cqw`}}>{details.address}</p>}{details.footer.trim()&&<small>{details.footer}</small>}</footer>
 </article>;
}
export default function StoreSignage({brand,onBack}:{brand:TagBrand;onBack:()=>void}){
 const[template,setTemplate]=useState<Template>('department');const[details,setDetails]=useState<Details>({...templates.department,branch:'',phone:'',address:'',footer:'Thank you for shopping with us.'});
 const[hours,setHours]=useState<string[]>(()=>days.map(()=>''));const[arrow,setArrow]=useState<Arrow>('none');const[paper,setPaper]=useState<Paper>('A4');const[orientation,setOrientation]=useState<Orientation>('portrait');const[scale,setScale]=useState(100);const[busy,setBusy]=useState(false);const[message,setMessage]=useState('');
 const form=useRef<HTMLFormElement>(null),exportRef=useRef<HTMLDivElement>(null);const brandName=brand==='busterbuild'?'BusterBuild':'PowerBuild';const size=signageSize(paper,orientation);
 const change=(key:keyof Details,value:string)=>{setDetails(prev=>({...prev,[key]:value}));setMessage('');};
 const choose=(value:Template)=>{setTemplate(value);setDetails(prev=>({...prev,title:templates[value].title,subtitle:templates[value].subtitle,body:templates[value].body}));setArrow(value==='direction'?'right':'none');setMessage('');};
 const download=async(format:'pdf'|'jpg')=>{
  if(!form.current?.reportValidity())return;
  if(!details.title.trim()){setMessage('Enter a heading for your sign.');return;}
  if(template==='hours'&&hours.slice(0,7).some(value=>!value.trim())){setMessage('Enter trading hours or Closed for every day.');return;}
  setBusy(true);setMessage('Preparing your store sign…');
  try{
   await document.fonts.ready;await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));
   const node=exportRef.current?.firstElementChild as HTMLElement|null;if(!node)throw new Error('The sign could not load.');
   if(Array.from(node.querySelectorAll<HTMLElement>('[data-sign-fit]')).some(el=>el.scrollHeight>el.clientHeight+2||el.scrollWidth>el.clientWidth+2)){setMessage('Some wording does not fit. Shorten the text, reduce Text size or choose portrait, then try again.');return;}
   await Promise.all(Array.from(node.querySelectorAll('img')).map(img=>img.decode()));
   const width=size.pixelsWide/2,height=size.pixelsHigh/2;
   const jpeg=await toJpeg(node,{width,height,pixelRatio:2,quality:.98,skipFonts:true,backgroundColor:brand==='busterbuild'?'#171918':'#073d74',style:{width:`${width}px`,height:`${height}px`,margin:'0',boxShadow:'none'}});
   let url='';const link=document.createElement('a');link.href=format==='pdf'?(url=URL.createObjectURL(signagePdf(jpeg,size))):jpeg;link.download=`${brandName}-${template}-Sign-${paper}-${orientation}.${format}`;document.body.appendChild(link);link.click();link.remove();if(url)window.setTimeout(()=>URL.revokeObjectURL(url),60000);
   setMessage(format==='pdf'?`PDF downloaded: ${paper} ${orientation}, ${size.width} × ${size.height} mm. Print at Actual size / 100%.`:`JPG downloaded: ${size.pixelsWide} × ${size.pixelsHigh} pixels. Set the printed size to ${size.width} × ${size.height} mm.`);
  }catch{setMessage('Could not download. Check the logo is visible, then try again.');}finally{setBusy(false);}
 };
 const field=(label:string,key:keyof Details,max:number,required=false)=><label>{label}<input maxLength={max} required={required} value={details[key]} onChange={e=>change(key,e.target.value)}/></label>;
 return <main className={styles.studio}><div className={styles.workspace}>
  <header className={styles.editorHeader}><div><small>{brandName.toUpperCase()} · STORE STUDIO</small><h1>Store Signage Generator</h1><p>Clear directions. Useful notices. Your store identity.</p></div><button disabled={busy} onClick={onBack}>Back to price tag studio</button></header>
  <div className={styles.editor}>
   <form className={styles.panel} ref={form} onSubmit={e=>{e.preventDefault();void download('pdf');}}>
    <fieldset disabled={busy}>
     <h2>1. Choose your sign</h2>
     <label>Sign type<select value={template} onChange={e=>choose(e.target.value as Template)}>{Object.entries(templates).map(([value,item])=><option key={value} value={value}>{item.label}</option>)}</select></label>
     <div className={styles.row}><label>Paper size<select value={paper} onChange={e=>setPaper(e.target.value as Paper)}><option value="A4">A4</option><option value="A3">A3</option></select></label><label>Orientation<select value={orientation} onChange={e=>setOrientation(e.target.value as Orientation)}><option value="portrait">Portrait</option><option value="landscape">Landscape</option></select></label></div>
     <h2>2. Wording &amp; directions</h2>{field('Heading','title',80,true)}{field('Supporting line (optional)','subtitle',120)}
     {template==='hours'?<><p className={styles.note}>Enter your store’s actual hours. You can type Closed for any day.</p>{days.map((day,index)=><label key={day}>{day} hours{index===7?' (optional)':''}<input maxLength={32} required={index<7} placeholder="08:00 – 17:00 or Closed" value={hours[index]} onChange={e=>{setHours(prev=>prev.map((value,i)=>i===index?e.target.value:value));setMessage('');}}/></label>)}<button type="button" onClick={()=>{if(!hours[0].trim()){setMessage('Enter Monday hours first.');return;}setHours(prev=>prev.map((value,index)=>index>0&&index<5?prev[0]:value));}}>Copy Monday hours to Tue–Fri</button></>:<>
      <label>Notice text (optional)<textarea maxLength={480} rows={5} value={details.body} onChange={e=>change('body',e.target.value)}/></label>
      <label>Direction arrow<select value={arrow} onChange={e=>setArrow(e.target.value as Arrow)}><option value="none">No arrow</option><option value="left">Left</option><option value="right">Right</option><option value="up">Straight ahead / up</option><option value="down">Down</option></select></label>
     </>}
     <label>Text size — {scale}%<input type="range" min="70" max="120" step="5" value={scale} onChange={e=>setScale(Number(e.target.value))}/></label>
     <h2>3. Store details</h2>{field('Branch / store (optional)','branch',60)}{field('Contact number (optional)','phone',32)}{field('Store address (optional)','address',120)}{field('Footer message (optional)','footer',100)}
    </fieldset>
    <div className={styles.actions}><button disabled={busy} type="submit">{busy?'Preparing…':'Download PDF'}</button><button disabled={busy} type="button" onClick={()=>void download('jpg')}>Download JPG</button></div>
    <p className={styles.note}>Print the PDF at Actual size / 100%. Choose A3 paper when printing A3 signs. Your sign stays in this screen until you leave it.</p>{message&&<p role="status" className={styles.message}>{message}</p>}
   </form>
   <section className={`${styles.panel} ${styles.previewPanel}`}><div className={styles.previewHeading}><h2>Live preview</h2><span>{paper} · {size.width} × {size.height} mm</span></div><div className={`${styles.preview} ${orientation==='landscape'?styles.widePreview:''}`}><Artwork brand={brand} orientation={orientation} template={template} arrow={arrow} details={details} hours={hours} scale={scale}/></div><p className={styles.note}>Choose a template, then edit it for your store. Switching templates replaces the heading and notice wording; store details and entered opening hours stay in place.</p></section>
  </div>
 </div><div ref={exportRef} className={styles.exportStage} style={{width:size.pixelsWide/2,height:size.pixelsHigh/2}} aria-hidden="true"><Artwork brand={brand} orientation={orientation} template={template} arrow={arrow} details={details} hours={hours} scale={scale}/></div></main>;
}

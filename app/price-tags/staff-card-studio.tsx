"use client";
import {useRef,useState} from "react";
import {toJpeg} from "../lib/vendor/html-to-image.mjs";
import {staffCardPdf,staffCardSize,type StaffCardKind} from "../lib/staff-card-export";
import type {TagBrand} from "../lib/price-tags";
import styles from "./staff-card-studio.module.css";

type Details={name:string;role:string;branch:string;phone:string;email:string;website:string;address:string};
const initial:Details={name:"",role:"Sales Consultant",branch:"",phone:"",email:"",website:"",address:""};
function Artwork({brand,kind,details}:{brand:TagBrand;kind:StaffCardKind;details:Details}) {
  const business=kind==='business-card';const buster=brand==='busterbuild';
  const name=details.name.trim()||'YOUR NAME';const role=details.role.trim();
  return <article data-staff-artwork className={`${styles.artwork} ${buster?styles.buster:styles.power} ${business?styles.business:styles.nameTag}`} aria-label={`${buster?'BusterBuild':'PowerBuild'} ${business?'business card':'name tag'} preview`}>
    <div className={styles.brandPanel}><img className={styles.logo} src={buster?'/price-tag-assets/busterbuild-logo-white.png':'/powerbuild-logo-transparent.png'} alt={buster?'BusterBuild':'PowerBuild'}/></div>
    <div className={styles.accent}/><div className={styles.corner}/>
    <div className={styles.identity}>
      <strong className={styles.personName} style={{fontSize:`${Math.min(business?4.6:7.2,(business?160:230)/Math.max(name.length,1))}cqw`}}>{name}</strong>
      {role&&<span className={styles.role}>{role}</span>}
      {details.branch.trim()&&<span className={styles.branch}>{details.branch}</span>}
    </div>
    {business&&<div className={styles.contacts}>
      {details.phone.trim()&&<div><b>CALL</b><span>{details.phone}</span></div>}
      {details.email.trim()&&<div><b>EMAIL</b><span>{details.email}</span></div>}
      {details.website.trim()&&<div><b>WEB</b><span>{details.website}</span></div>}
      {details.address.trim()&&<div className={styles.address}><b>VISIT</b><span>{details.address}</span></div>}
    </div>}
    <span className={styles.brandWord}>{buster?'BUSTERBUILD':'POWERBUILD'}</span>
  </article>;
}
export default function StaffCardStudio({brand,kind,onKindChange,onBack}:{brand:TagBrand;kind:StaffCardKind;onKindChange:(kind:StaffCardKind)=>void;onBack:()=>void}) {
  const [details,setDetails]=useState<Details>(initial);const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');
  const formRef=useRef<HTMLFormElement>(null);const exportRef=useRef<HTMLDivElement>(null);
  const size=staffCardSize(kind);const brandName=brand==='busterbuild'?'BusterBuild':'PowerBuild';const title=kind==='name-tag'?'Salesperson name tag':'Business card';
  const change=(field:keyof Details,value:string)=>{setDetails(prev=>({...prev,[field]:value}));setMessage('');};
  const download=async(format:'jpg'|'pdf')=>{
    if(!formRef.current?.reportValidity())return;setBusy(true);setMessage('Preparing your '+format.toUpperCase()+'…');
    try{
      await document.fonts.ready;await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));
      const node=exportRef.current?.firstElementChild as HTMLElement|null;if(!node)throw new Error('Preview unavailable.');
      await Promise.all(Array.from(node.querySelectorAll('img')).map(img=>img.decode()));
      const height=kind==='name-tag'?480:500;
      const jpeg=await toJpeg(node,{quality:.98,pixelRatio:2,width:900,height,skipFonts:true,backgroundColor:brand==='busterbuild'?'#171918':'#ffffff',style:{width:'900px',height:`${height}px`,margin:'0',boxShadow:'none'}});
      const link=document.createElement('a');let blobUrl='';
      link.href=format==='pdf'?(blobUrl=URL.createObjectURL(staffCardPdf(jpeg,kind))):jpeg;
      link.download=`${brandName}-${details.name.trim().replace(/[^a-z0-9._-]/gi,'-')}-${kind}-${size.width}x${size.height}mm.${format}`;
      document.body.appendChild(link);link.click();link.remove();if(blobUrl)window.setTimeout(()=>URL.revokeObjectURL(blobUrl),60000);
      setMessage(format==='pdf'?`PDF downloaded at exactly ${size.width} × ${size.height} mm. Print at Actual size / 100%.`:`JPG downloaded (${size.pixelsWide} × ${size.pixelsHigh} pixels). Set its printed size to ${size.width} × ${size.height} mm.`);
    }catch{setMessage('Could not download. Check the logo is visible, then try again.');}finally{setBusy(false);}
  };
  const field=(label:string,key:keyof Details,max:number,type='text')=><label>{label}<input type={type} maxLength={max} value={details[key]} onChange={e=>change(key,e.target.value)} required={key==='name'} pattern={key==='name'?'.*\\S.*':undefined} autoComplete={key==='name'?'name':key==='email'?'email':key==='phone'?'tel':'off'}/></label>;
  return <main className={styles.studio}>
    <div className={styles.workspace}>
      <header className={styles.header}><div><small>{brandName.toUpperCase()} · STAFF STUDIO</small><h1>{title} generator</h1><p>{size.width} × {size.height} mm · {brandName} design</p></div><button disabled={busy} onClick={onBack}>Back to price tag studio</button></header>
      <nav className={styles.tabs} aria-label="Staff stationery"><button disabled={busy} aria-pressed={kind==='name-tag'} onClick={()=>onKindChange('name-tag')}>Salesperson name tags</button><button disabled={busy} aria-pressed={kind==='business-card'} onClick={()=>onKindChange('business-card')}>Business cards</button></nav>
      <div className={styles.editor}>
        <form ref={formRef} className={styles.panel} onSubmit={e=>{e.preventDefault();void download('pdf');}}>
          <h2>Staff details</h2><p>Enter the details you want on the {kind==='name-tag'?'name tag':'card'}. The preview updates as you type.</p>
          <fieldset disabled={busy}>
            {field('Full name','name',60)}{field('Job title / department','role',50)}{field('Branch / store (optional)','branch',60)}
            {kind==='business-card'&&<>{field('Phone / WhatsApp (optional)','phone',32,'tel')}{field('Email (optional)','email',90,'email')}{field('Website (optional)','website',90)}<label>Store address (optional)<textarea maxLength={140} rows={3} value={details.address} onChange={e=>change('address',e.target.value)}/></label></>}
          </fieldset>
          <div className={styles.actions}><button type="submit" disabled={busy}>{busy?'Preparing…':'Download PDF'}</button><button type="button" disabled={busy} onClick={()=>void download('jpg')}>Download JPG</button></div>
          <p className={styles.note}>PDF: exact finished size. Print at 100% / Actual size. JPG: high resolution. Details stay in this screen until you leave it.</p>
          {message&&<p role="status" className={styles.message}>{message}</p>}
        </form>
        <section className={`${styles.panel} ${styles.previewPanel}`}><div className={styles.previewHeading}><h2>Live preview</h2><span>{size.width} × {size.height} mm</span></div><div className={styles.preview}><Artwork brand={brand} kind={kind} details={details}/></div><p className={styles.note}>Preview is enlarged for editing. The downloaded PDF uses the exact size shown above.</p></section>
      </div>
    </div>
    <div ref={exportRef} className={styles.exportStage} aria-hidden="true"><Artwork brand={brand} kind={kind} details={details}/></div>
  </main>;
}

"use client";
import {useMemo,useRef,useState} from "react";
import {toJpeg} from "../lib/vendor/html-to-image.mjs";
import {jpegPagePdf,staffCardPdf,staffCardSize,type StaffCardKind} from "../lib/staff-card-export";
import type {TagBrand} from "../lib/price-tags";
import styles from "./staff-card-studio.module.css";

type Details={name:string;role:string;branch:string;phone:string;email:string;website:string;address:string};
type NameTagSheetLayout=6|8;
const initial:Details={name:"",role:"Sales Consultant",branch:"",phone:"",email:"",website:"",address:""};
const A4_NAME_TAG_SHEET = { widthMm:210, heightMm:297, widthPx:1240, heightPx:1754 } as const;

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

function NameTagA4Sheet({brand,items,layout}:{brand:TagBrand;items:Details[];layout:NameTagSheetLayout}) {
  return <div className={`${styles.a4Sheet} ${layout===8?styles.a4SheetEight:styles.a4SheetSix}`} aria-label={`A4 name tag sheet with up to ${layout} tags`}>
    {Array.from({length:layout},(_,index)=><div className={styles.a4Slot} key={index}>{items[index]&&<Artwork brand={brand} kind="name-tag" details={items[index]}/>}</div>)}
  </div>;
}

function paginateSheetItems(items:Details[],perPage:number){
  const pages:Details[][]=[];
  for(let index=0;index<items.length;index+=perPage)pages.push(items.slice(index,index+perPage));
  return pages;
}

export default function StaffCardStudio({brand,kind,onKindChange,onBack}:{brand:TagBrand;kind:StaffCardKind;onKindChange:(kind:StaffCardKind)=>void;onBack:()=>void}) {
  const [details,setDetails]=useState<Details>(initial);const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');
  const [sheetItems,setSheetItems]=useState<Details[]>([]);const [sheetLayout,setSheetLayout]=useState<NameTagSheetLayout>(8);const [sheetPage,setSheetPage]=useState(0);
  const formRef=useRef<HTMLFormElement>(null);const exportRef=useRef<HTMLDivElement>(null);const a4ExportRef=useRef<HTMLDivElement>(null);
  const size=staffCardSize(kind);const brandName=brand==='busterbuild'?'BusterBuild':'PowerBuild';const title=kind==='name-tag'?'Salesperson name tag':'Business card';
  const change=(field:keyof Details,value:string)=>{setDetails(prev=>({...prev,[field]:value}));setMessage('');};
  const field=(label:string,key:keyof Details,max:number,type='text')=><label>{label}<input type={type} maxLength={max} value={details[key]} onChange={e=>change(key,e.target.value)} required={key==='name'} pattern={key==='name'?'.*\\S.*':undefined} autoComplete={key==='name'?'name':key==='email'?'email':key==='phone'?'tel':'off'}/></label>;
  const sheetPages=useMemo(()=>paginateSheetItems(sheetItems,sheetLayout),[sheetItems,sheetLayout]);
  const displayedSheetPage=Math.min(sheetPage,Math.max(0,sheetPages.length-1));

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

  const addCurrentToSheet=()=>{
    if(kind!=='name-tag') return;
    if(!formRef.current?.reportValidity())return;
    setSheetItems(prev=>prev.concat([{...details}]));
    setSheetPage(Math.floor(sheetItems.length/sheetLayout));
    setMessage(`Added ${details.name.trim()} to the A4 sheet queue.`);
  };

  const removeSheetItem=(index:number)=>{
    setSheetItems(prev=>prev.filter((_,itemIndex)=>itemIndex!==index));
    setMessage('Name tag removed from the A4 sheet queue.');
  };

  const downloadSheet=async(format:'jpg'|'pdf')=>{
    const page=sheetPages[displayedSheetPage];
    if(kind!=='name-tag'||!page?.length)return;
    setBusy(true);setMessage(`Preparing A4 ${format.toUpperCase()} sheet ${displayedSheetPage+1}…`);
    try{
      await document.fonts.ready;await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));
      const node=a4ExportRef.current?.firstElementChild as HTMLElement|null;if(!node)throw new Error('A4 preview unavailable.');
      await Promise.all(Array.from(node.querySelectorAll('img')).map(img=>img.decode()));
      const jpeg=await toJpeg(node,{quality:.98,pixelRatio:2,width:A4_NAME_TAG_SHEET.widthPx,height:A4_NAME_TAG_SHEET.heightPx,skipFonts:true,backgroundColor:'#ffffff',style:{width:`${A4_NAME_TAG_SHEET.widthPx}px`,height:`${A4_NAME_TAG_SHEET.heightPx}px`,margin:'0',boxShadow:'none'}});
      const link=document.createElement('a');let blobUrl='';
      link.href=format==='pdf'?(blobUrl=URL.createObjectURL(jpegPagePdf(jpeg,A4_NAME_TAG_SHEET.widthMm,A4_NAME_TAG_SHEET.heightMm,A4_NAME_TAG_SHEET.widthPx*2,A4_NAME_TAG_SHEET.heightPx*2))):jpeg;
      link.download=`${brandName}-Name-Tags-A4-${sheetLayout}-up-page-${displayedSheetPage+1}.${format}`;
      document.body.appendChild(link);link.click();link.remove();if(blobUrl)window.setTimeout(()=>URL.revokeObjectURL(blobUrl),60000);
      setMessage(`A4 ${format.toUpperCase()} downloaded with ${page.length} name tag${page.length===1?'':'s'} in the ${sheetLayout}-up layout.`);
    }catch(error){setMessage(error instanceof Error?error.message:'Could not prepare the A4 sheet.');}finally{setBusy(false);}
  };

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
          <div className={styles.actions}><button type="submit" disabled={busy}>{busy?'Preparing…':'Download PDF'}</button><button type="button" disabled={busy} onClick={()=>void download('jpg')}>Download JPG</button>{kind==='name-tag'&&<button type="button" disabled={busy} onClick={addCurrentToSheet}>Add to A4 sheet</button>}</div>
          {kind==='name-tag'&&<div className={styles.sheetBuilder}><div className={styles.sheetBuilderRow}><strong>A4 name tag sheet</strong><label className={styles.inlineLabel}>Layout<select value={sheetLayout} disabled={busy} onChange={e=>{setSheetLayout(Number(e.target.value) as NameTagSheetLayout);setSheetPage(0);}}><option value={6}>6 tags per A4</option><option value={8}>8 tags per A4</option></select></label></div><p className={styles.note}>Add staff one by one, then download one A4 page instead of printing single tags individually.</p><div className={styles.sheetActions}><button type="button" disabled={busy||!sheetPages.length} onClick={()=>void downloadSheet('pdf')}>{busy?'Preparing…':'Download A4 PDF'}</button><button type="button" disabled={busy||!sheetPages.length} onClick={()=>void downloadSheet('jpg')}>Download A4 JPG</button><button type="button" disabled={busy||!sheetItems.length} onClick={()=>{setSheetItems([]);setSheetPage(0);setMessage('A4 name tag queue cleared.');}}>Clear queue</button></div><div className={styles.sheetStatus}><strong>{sheetPages.length?`Page ${displayedSheetPage+1} of ${sheetPages.length} · ${sheetPages[displayedSheetPage]?.length || 0}/${sheetLayout} tags`:`0/${sheetLayout} tags on A4`}</strong>{sheetPages.length>1&&<div className={styles.sheetPager}><button type="button" disabled={busy||displayedSheetPage===0} onClick={()=>setSheetPage(displayedSheetPage-1)}>Previous</button><button type="button" disabled={busy||displayedSheetPage===sheetPages.length-1} onClick={()=>setSheetPage(displayedSheetPage+1)}>Next</button></div>}</div>{!!sheetItems.length&&<div className={styles.sheetQueue}>{sheetItems.map((item,index)=><div className={styles.sheetQueueItem} key={`${item.name}-${index}`}><span><b>{item.name || 'Unnamed staff'}</b><small>{item.role || 'No title'}{item.branch?` · ${item.branch}`:''}</small></span><button type="button" disabled={busy} onClick={()=>removeSheetItem(index)}>Remove</button></div>)}</div>}</div>}
          <p className={styles.note}>PDF: exact finished size. Print at 100% / Actual size. JPG: high resolution. Details stay in this screen until you leave it.</p>
          {message&&<p role="status" className={styles.message}>{message}</p>}
        </form>
        <section className={`${styles.panel} ${styles.previewPanel}`}><div className={styles.previewHeading}><h2>Live preview</h2><span>{size.width} × {size.height} mm</span></div><div className={styles.preview}><Artwork brand={brand} kind={kind} details={details}/></div><p className={styles.note}>Preview is enlarged for editing. The downloaded PDF uses the exact size shown above.</p>{kind==='name-tag'&&!!sheetPages.length&&<><div className={styles.previewHeading}><h2>A4 preview</h2><span>{sheetLayout}-up</span></div><div className={styles.a4Preview}><NameTagA4Sheet brand={brand} items={sheetPages[displayedSheetPage]} layout={sheetLayout}/></div><p className={styles.note}>This preview shows the A4 page that will download. Name tags are kept at a practical print size for one-sheet printing.</p></>}</section>
      </div>
    </div>
    <div ref={exportRef} className={styles.exportStage} aria-hidden="true"><Artwork brand={brand} kind={kind} details={details}/></div>
    {kind==='name-tag'&&!!sheetPages.length&&<div ref={a4ExportRef} className={styles.a4ExportStage} aria-hidden="true"><NameTagA4Sheet brand={brand} items={sheetPages[displayedSheetPage]} layout={sheetLayout}/></div>}
  </main>;
}

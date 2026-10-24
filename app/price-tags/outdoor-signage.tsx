"use client";
import {useRef,useState} from "react";
import {outdoorPdf,outdoorSize} from "../lib/outdoor-export";
import type {TagBrand} from "../lib/price-tags";
import styles from "./outdoor-signage.module.css";
type Kind='opening'|'billboard'|'wayfinding';type Arrow='none'|'left'|'right'|'up'|'down';
type Details={headline:string;message:string;branch:string;address:string;phone:string;date:string;distance:string;unit:string;distanceLabel:string};
const templates:Record<Kind,{label:string;headline:string;message:string}>={opening:{label:'New store opening',headline:'OPENING SOON',message:'PAINT · HARDWARE · TILES · SANWARE'},billboard:{label:'Street billboard',headline:'BIG IDEAS.\nBUILT HERE.',message:'PAINT · HARDWARE · TILES · SANWARE'},wayfinding:{label:'Distance / direction board',headline:'YOUR HARDWARE STORE',message:'PAINT · HARDWARE · TILES'}};
const formats={opening:{label:'Opening board — 2400 × 1200 mm',width:2400,height:1200},roadside:{label:'Roadside board — 3000 × 1500 mm',width:3000,height:1500},billboard:{label:'Billboard — 6000 × 3000 mm',width:6000,height:3000}};
function measured(text:string,size:number,weight:number){
 if(typeof document==='undefined')return text.length*size*.62;
 const ctx=document.createElement('canvas').getContext('2d');if(!ctx)return text.length*size*.62;ctx.font=`${weight} ${size}px Arial`;return ctx.measureText(text).width;
}
function fitText(text:string,width:number,height:number,preferred:number,maxLines:number,weight:number){
 let lines:string[]=[];let size=preferred;
 for(;size>=8;size-=1){lines=[];for(const paragraph of text.split('\n')){let line='';for(const word of paragraph.trim().split(/\s+/)){const next=line?line+' '+word:word;if(line&&measured(next,size,weight)>width){lines.push(line);line=word;}else line=next;}if(line)lines.push(line);}
  if(lines.length<=maxLines&&lines.length*size*1.12<=height&&lines.every(line=>measured(line,size,weight)<=width))break;
 }
 return {lines,size:Math.max(8,size),fits:size>=8};
}
function TextBlock({text,x,y,width,height,font=32,weight=700,fill='#143b5c',align='left',lines=2}:{text:string;x:number;y:number;width:number;height:number;font?:number;weight?:number;fill?:string;align?:'left'|'center';lines?:number}){
 const fit=fitText(text,width,height,font,lines,weight);const start=y+(height-fit.lines.length*fit.size*1.12)/2+fit.size;
 return <text data-outdoor-text data-fit={fit.fits?'yes':'no'} x={align==='center'?x+width/2:x} y={start} fill={fill} fontFamily="Arial, sans-serif" fontSize={fit.size} fontWeight={weight} textAnchor={align==='center'?'middle':'start'}>{fit.lines.map((line,i)=><tspan key={i} x={align==='center'?x+width/2:x} dy={i?fit.size*1.12:0}>{line}</tspan>)}</text>;
}
function Artwork({brand,kind,details,arrow,ratio}:{brand:TagBrand;kind:Kind;details:Details;arrow:Arrow;ratio:number}){
 const w=1200,h=w/ratio,buster=brand==='busterbuild',blue=buster?'#171918':'#073d74',gold=buster?'#d0aa54':'#ffda00',ink=buster?'#202622':'#073d74';const hasArrow=arrow!=='none',mainX=w*.33,mainWidth=w*(hasArrow?.45:.61);
 const openingDate=details.date?new Date(details.date+'T12:00:00').toLocaleDateString('en-ZA',{day:'numeric',month:'long',year:'numeric'}).toUpperCase():'';
 return <svg data-outdoor-artwork xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${w} ${h}`} width="100%" height="100%" role="img" aria-label={`${buster?'BusterBuild':'PowerBuild'} outdoor sign preview`}>
  <rect width={w} height={h} fill={buster?'#fcfaf5':'#ffffff'}/><rect width={w*.28} height={h*.84} fill={blue}/><rect x={w*.28} width={w*.012} height={h*.84} fill={gold}/>
  {buster?<svg x={w*.035} y={h*.19} width={w*.21} height={h*.3} viewBox="20 70 270 135"><image href="/price-tag-assets/busterbuild-logo-white.png" width="300" height="300"/></svg>:<image href="/powerbuild-logo-transparent.png" x={w*.035} y={h*.12} width={w*.21} height={h*.46} preserveAspectRatio="xMidYMid meet"/>}
  <TextBlock text={details.branch||(buster?'BUSTERBUILD':'POWERBUILD')} x={w*.035} y={h*.62} width={w*.21} height={h*.12} font={26} fill="#ffffff" align="center"/>
  <TextBlock text="YOUR LOCAL HARDWARE STORE" x={w*.035} y={h*.755} width={w*.21} height={h*.045} font={12} fill={gold} align="center" lines={1}/>
  {kind==='wayfinding'?<>
   <TextBlock text={details.headline} x={mainX} y={h*.09} width={mainWidth} height={h*.13} font={31} fill={ink}/>
   <TextBlock text={`${details.distance} ${details.unit}`} x={mainX} y={h*.245} width={mainWidth} height={h*.30} font={170} weight={900} fill={ink} lines={1}/>
   <TextBlock text={details.distanceLabel} x={mainX} y={h*.56} width={mainWidth} height={h*.12} font={45} weight={900} fill={buster?'#aa822c':ink}/>
   <TextBlock text={details.message} x={mainX} y={h*.715} width={mainWidth} height={h*.075} font={23} fill={ink}/>
  </>:<>
   <TextBlock text={details.headline} x={mainX} y={h*.10} width={mainWidth} height={h*.40} font={96} weight={900} fill={ink}/>
   <TextBlock text={details.message} x={mainX} y={h*.53} width={mainWidth} height={h*.13} font={29} fill={ink}/>
   {kind==='opening'&&openingDate&&<><rect x={mainX} y={h*.69} width={mainWidth} height={h*.105} rx="3" fill={gold}/><TextBlock text={'OPENING '+openingDate} x={mainX+12} y={h*.69} width={mainWidth-24} height={h*.105} font={28} fill={buster?'#171918':'#073d74'} lines={1}/></>}
  </>}
  {hasArrow&&<svg x={w*.81} y={h*.27} width={w*.15} height={h*.36} viewBox="0 0 160 160" role="img" aria-label={`${arrow} arrow`}><path transform={`rotate(${{left:0,right:180,up:90,down:270}[arrow as Exclude<Arrow,'none'>]} 80 80)`} fill={buster?'#b58e37':'#073d74'} d="M12 80 68 24v34h80v44H68v34Z"/></svg>}
  <rect y={h*.84} width={w} height={h*.015} fill={gold}/><rect y={h*.855} width={w} height={h*.145} fill={blue}/>
  <TextBlock text={[details.address,details.phone].filter(value=>value.trim()).join('  |  ')} x={w*.04} y={h*.87} width={w*.92} height={h*.105} font={29} weight={700} fill="#ffffff" align="center"/>
 </svg>;
}
async function inlineLogo(svg:SVGSVGElement){
 const clone=svg.cloneNode(true) as SVGSVGElement;
 for(const image of Array.from(clone.querySelectorAll('image'))){const response=await fetch(image.getAttribute('href')!,{cache:'force-cache'});if(!response.ok)throw new Error('Logo unavailable.');const blob=await response.blob();const data=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=reject;reader.readAsDataURL(blob);});image.setAttribute('href',data);}
 return clone;
}
export default function OutdoorSignage({brand,onBack}:{brand:TagBrand;onBack:()=>void}){
 const[kind,setKind]=useState<Kind>('opening');const[format,setFormat]=useState('opening');const[width,setWidth]=useState('2400'),[height,setHeight]=useState('1200');const[arrow,setArrow]=useState<Arrow>('none');const[details,setDetails]=useState<Details>({...templates.opening,branch:'',address:'',phone:'',date:'',distance:'5',unit:'km',distanceLabel:'AHEAD'});const[busy,setBusy]=useState(false),[message,setMessage]=useState('');const art=useRef<HTMLDivElement>(null),form=useRef<HTMLFormElement>(null);const brandName=brand==='busterbuild'?'BusterBuild':'PowerBuild';
 const ratio=Math.max(1,Math.min(4,(Number(width)||2400)/(Number(height)||1200)));
 const change=(key:keyof Details,value:string)=>{setDetails(prev=>({...prev,[key]:value}));setMessage('');};
 const choose=(value:Kind)=>{setKind(value);setDetails(prev=>({...prev,headline:templates[value].headline,message:templates[value].message}));setArrow(value==='wayfinding'?'right':'none');setMessage('');};
 const download=async(type:'svg'|'jpg'|'pdf')=>{
  if(!form.current?.reportValidity())return;setBusy(true);setMessage('Preparing outdoor artwork…');
  try{
   const size=outdoorSize(Number(width),Number(height));if(!details.headline.trim()||(kind==='wayfinding'&&!details.distanceLabel.trim()))throw new Error('Enter the heading and direction wording.');
   await document.fonts.ready;const svg=art.current?.querySelector('svg');if(!svg)throw new Error('Preview unavailable.');if(svg.querySelector('[data-fit="no"]'))throw new Error('Some text is too long. Shorten the wording or choose a taller board.');
   const clone=await inlineLogo(svg);let blob:Blob;
   if(type==='svg'){clone.setAttribute('width',`${size.width}mm`);clone.setAttribute('height',`${size.height}mm`);blob=new Blob([new XMLSerializer().serializeToString(clone)],{type:'image/svg+xml'});}
   else{
    clone.setAttribute('width',String(size.pixelsWide));clone.setAttribute('height',String(size.pixelsHigh));const src=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)],{type:'image/svg+xml'}));
    let jpeg:string;
    try{const image=new Image();image.src=src;await image.decode();const canvas=document.createElement('canvas');canvas.width=size.pixelsWide;canvas.height=size.pixelsHigh;const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Canvas unavailable.');ctx.drawImage(image,0,0);jpeg=canvas.toDataURL('image/jpeg',.98);}finally{URL.revokeObjectURL(src);}
    blob=type==='pdf'?outdoorPdf(jpeg,size):await(await fetch(jpeg)).blob();
   }
   const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=`${brandName}-${kind}-${size.width}x${size.height}mm.${type}`;document.body.appendChild(link);link.click();link.remove();window.setTimeout(()=>URL.revokeObjectURL(url),60000);
   setMessage(type==='svg'?'SVG downloaded at your chosen size. Text and shapes stay scalable; the supplied logo is embedded.':`${type.toUpperCase()} downloaded: ${size.width} × ${size.height} mm; artwork ${size.pixelsWide} × ${size.pixelsHigh} pixels. Use SVG when your printer needs scalable lettering.`);
  }catch(e){setMessage(e instanceof Error?e.message:'Could not download. Please retry.');}finally{setBusy(false);}
 };
 const field=(label:string,key:keyof Details,max:number)=><label>{label}<input value={details[key]} maxLength={max} onChange={e=>change(key,e.target.value)}/></label>;
 return <main className={styles.studio}><div className={styles.workspace}>
  <header className={styles.header}><div><small>{brandName.toUpperCase()} · OUTDOOR STUDIO</small><h1>Outdoor boards &amp; billboards</h1><p>New store openings, street adverts and directions to your shop.</p></div><button disabled={busy} onClick={onBack}>Back to price tag studio</button></header>
  <div className={styles.editor}>
   <form ref={form} className={styles.panel} onSubmit={e=>{e.preventDefault();void download('svg');}}><fieldset disabled={busy}>
    <h2>1. Board design &amp; dimensions</h2><label>Design<select value={kind} onChange={e=>choose(e.target.value as Kind)}>{Object.entries(templates).map(([value,item])=><option key={value} value={value}>{item.label}</option>)}</select></label>
    <label>Starting size<select value={format} onChange={e=>{setFormat(e.target.value);if(e.target.value!=='custom'){const size=formats[e.target.value as keyof typeof formats];setWidth(String(size.width));setHeight(String(size.height));}}}>{Object.entries(formats).map(([value,item])=><option key={value} value={value}>{item.label}</option>)}<option value="custom">Custom dimensions</option></select></label>
    <div className={styles.row}><label>Width (mm)<input required type="number" min="200" max="12000" step="1" value={width} onChange={e=>{setWidth(e.target.value);setFormat('custom');}}/></label><label>Height (mm)<input required type="number" min="200" max="12000" step="1" value={height} onChange={e=>{setHeight(e.target.value);setFormat('custom');}}/></label></div>
    <p className={styles.note}>These are editable starting sizes. Confirm final dimensions and bleed with your sign maker. Landscape boards from 1:1 to 4:1 are supported.</p>
    <h2>2. Message &amp; direction</h2><label>Heading<textarea rows={2} required maxLength={70} value={details.headline} onChange={e=>change('headline',e.target.value)}/></label>{field('Products / supporting message','message',100)}
    {kind==='opening'&&<label>Opening date (optional)<input type="date" value={details.date} onChange={e=>change('date',e.target.value)}/></label>}
    {kind==='wayfinding'&&<><div className={styles.row}><label>Distance<input type="number" required min="0.1" max="999" step="0.1" value={details.distance} onChange={e=>change('distance',e.target.value)}/></label><label>Distance unit<select value={details.unit} onChange={e=>change('unit',e.target.value)}><option value="km">km</option><option value="m">m</option></select></label></div>{field('Distance wording','distanceLabel',24)}</>}
    <label>Direction arrow<select value={arrow} onChange={e=>setArrow(e.target.value as Arrow)}><option value="none">No arrow</option><option value="left">Left</option><option value="right">Right</option><option value="up">Straight ahead / up</option><option value="down">Down</option></select></label>
    <h2>3. Your store</h2>{field('Branch / store (optional)','branch',60)}{field('Store address / landmark (optional)','address',120)}{field('Contact number (optional)','phone',32)}
   </fieldset><div className={styles.actions}><button disabled={busy} type="submit">{busy?'Preparing…':'Download SVG'}</button><button disabled={busy} type="button" onClick={()=>void download('pdf')}>Download PDF</button><button disabled={busy} type="button" onClick={()=>void download('jpg')}>Download JPG</button></div>
    <p className={styles.note}>SVG keeps text and shapes scalable. PDF/JPG use raster artwork up to 6000 px on the long edge. Logos use the supplied PNGs. Downloads use your chosen finished size, without added bleed. Details stay in this screen until you leave it.</p>{message&&<p className={styles.message} role="status">{message}</p>}
   </form>
   <section className={`${styles.panel} ${styles.previewPanel}`}><div className={styles.previewHeader}><h2>Live preview</h2><span>{width||'—'} × {height||'—'} mm</span></div><div ref={art} className={styles.preview} style={{aspectRatio:ratio}}><Artwork brand={brand} kind={kind} details={details} arrow={arrow} ratio={ratio}/></div><p className={styles.note}>{brand==='powerbuild'?'PowerBuild: white message area, blue logo panel and yellow accents.':'BusterBuild: cream message area, charcoal logo panel and gold accents.'}</p></section>
  </div>
 </div></main>;
}

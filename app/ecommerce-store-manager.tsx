"use client";
import { useEffect, useState } from "react";
type Branch = { name:string; region:string; address:string; suburb:string; city:string; province:string; phone:string; weekdays:string; saturday:string; sunday:string; public_notes:string; published:number };
const fields: Array<{key:keyof Branch; label:string; placeholder?:string}> = [
  {key:"address",label:"Street address"},{key:"suburb",label:"Suburb"},{key:"city",label:"City / town"},
  {key:"province",label:"Province"},{key:"phone",label:"Telephone"},
  {key:"weekdays",label:"Monday to Friday",placeholder:"07:00–17:00"},
  {key:"saturday",label:"Saturday",placeholder:"07:00–14:00 or Closed"},
  {key:"sunday",label:"Sunday",placeholder:"Closed or hours"},
  {key:"public_notes",label:"Public holiday / customer notes"}
];
export default function EcommerceStoreManager(){
 const [stores,setStores]=useState<Branch[]>([]);const [busy,setBusy]=useState("");const [message,setMessage]=useState("");const [canEdit,setCanEdit]=useState(false);
 useEffect(() => {
  let active = true;
  const loadStores = async () => {
   try {
    const response = await fetch("/api/ecommerce/control?view=stores", {cache:"no-store"});
    const data = await response.json();
    if (!active) return;
    if (response.ok) {
     setStores(data.stores || []);
     setCanEdit(Boolean(data.can_edit));
    } else {
     setMessage(data.error || "Store directory unavailable");
    }
   } catch {
    if (active) setMessage("Could not connect to the Hub.");
   }
  };
  void loadStores();
  return () => { active = false; };
 }, []);
 const update=(name:string,key:keyof Branch,value:string|number)=>setStores(previous=>previous.map(store=>store.name===name?{...store,[key]:value}:store));
 const save=async(store:Branch)=>{setBusy(store.name);setMessage("");try{const r=await fetch("/api/ecommerce/control",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"save_store",...store,published:Boolean(store.published)})});const data=await r.json();setMessage(r.ok?`${store.name} saved.`:data.error||"Save failed.");}catch{setMessage("Could not connect to the Hub.");}finally{setBusy("");}};
 return <div style={{padding:22,display:"grid",gap:18}}><div><h3 style={{margin:"0 0 7px"}}>Find Our Stores — Branch Directory</h3><p style={{color:"#65788c"}}>All active store workspaces appear here. Enter verified addresses and trading hours, then publish each branch to the public PowerBuild website. Unpublished branches are displayed without invented location details.</p><a href="/shop/find-us" target="_blank" rel="noreferrer">Preview store locator ↗</a></div>{message&&<p role="status">{message}</p>}{stores.map(store=><article key={store.name} style={{border:"1px solid #dce6ef",borderRadius:12,padding:18,background:"#fff"}}><div style={{display:"flex",justifyContent:"space-between",gap:12,flexWrap:"wrap",alignItems:"center"}}><h4 style={{margin:0}}>{store.name}</h4><label><input type="checkbox" disabled={!canEdit} checked={Boolean(store.published)} onChange={e=>update(store.name,"published",e.target.checked?1:0)}/> Publish verified details</label></div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:12,marginTop:16}}>{fields.map(field=><label key={field.key} style={{display:"grid",gap:5,fontSize:12,fontWeight:800}}>{field.label}<input disabled={!canEdit} placeholder={field.placeholder||field.label} value={String(store[field.key]||"")} onChange={e=>update(store.name,field.key,e.target.value)} style={{border:"1px solid #cbd9e6",borderRadius:6,padding:10}}/></label>)}</div><button disabled={!canEdit||busy===store.name} onClick={()=>void save(store)} style={{marginTop:14,background:"#ffd12f",padding:"10px 18px",border:0,borderRadius:7,fontWeight:900,cursor:"pointer"}}>{busy===store.name?"Saving…":"Save branch"}</button></article>)}{!stores.length&&<p>No active stores are currently in the Hub workspaces directory.</p>}</div>;
}

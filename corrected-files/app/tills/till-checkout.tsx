"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import styles from "./tills.module.css";

type Product={id:number;code:string;name:string;category:string;price_cents:number;unit:string;coverage_per_box:number};
type Line={product:Product;quantity:number};
const zMoney = (cents:number)=>new Intl.NumberFormat("en-ZA",{style:"currency",currency:"ZAR"}).format(cents/100);
const normalizeQty=(value:number)=>Number.isSafeInteger(value)&&value>0&&value<=999?value:1;
export default function TillCheckout({username,role,stores}:{username:string;role:string;stores:string[]}) {
  const [branch,setBranch]=useState(stores[0]);
  const [search,setSearch]=useState("");
  const [products,setProducts]=useState<Product[]>([]);
  const [lines,setLines]=useState<Line[]>([]);
  const [working,setWorking]=useState(false);
  const [error,setError]=useState("");
  const [cash,setCash]=useState("");
  const field=useRef<HTMLInputElement>(null);
  const request=useRef<AbortController | null>(null);
  const [message,setMessage]=useState("");

  useEffect(()=>{const params=new URLSearchParams(window.location.search);const invite=params.get("invite");
    if(!invite)return;
    void fetch("/api/team/accept",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({token:invite})}).finally(()=>{
      window.history.replaceState(null,"",window.location.pathname);
    });
  },[]);
  const changeBranch=(nextBranch:string)=>{
    if(nextBranch===branch)return;
    // Changing store is an explicit user action. Discard the preview basket and
    // cancel its previous-branch lookup before switching the price book.
    request.current?.abort();
    request.current=null;
    setWorking(false);
    setLines([]);
    setProducts([]);
    setCash("");
    setSearch("");
    setError("");
    setMessage("");
    setBranch(nextBranch);
    field.current?.focus();
  };
  const add=(product:Product)=>{
    setLines(current=>{const existing=current.find(line=>line.product.id===product.id);
      return existing?current.map(line=>line.product.id===product.id?{...line,quantity:normalizeQty(line.quantity+1)}:line):[...current,{product,quantity:1}];
    });
    setSearch("");setProducts([]);setError("");field.current?.focus();
  };
  const searchProducts=async(q=search)=>{
    const term=q.trim();if(!term){setProducts([]);return;}
    request.current?.abort();const controller=new AbortController();request.current=controller;
    setWorking(true);setError("");
    try {
      const r=await fetch(`/api/tills/catalogue?branch=${encodeURIComponent(branch)}&q=${encodeURIComponent(term)}`,{cache:"no-store",signal:controller.signal});
      const data=await r.json();if(controller.signal.aborted)return;
      if(!r.ok)throw new Error(data.error || "Product lookup failed.");
      const found=(data.products||[]) as Product[];
      // Enter/scan adds a unique exact-code match directly to the current basket.
      const exact=found.find(p=>p.code.toLowerCase()===term.toLowerCase());
      if(exact)add(exact);else{setProducts(found);if(!found.length)setError("No published retail price found. Ask a manager to check the product.");}
    } catch(e) { if(!controller.signal.aborted)setError(e instanceof Error?e.message:"Could not search products."); }
    finally{if(!controller.signal.aborted)setWorking(false);}
  };
  const total=useMemo(()=>lines.reduce((sum,line)=>sum + line.product.price_cents*line.quantity,0),[lines]);
  const vat=Math.round(total*15/115), net=total-vat;
  const given=/^\d+(?:\.\d{1,2})?$/.test(cash.trim())?Math.round(Number(cash)*100):0;
  const difference=given-total;
  return <main className={styles.page}>
    <header className={styles.header}>
      <div><small>MALIKS GROUP HUB · RETAILOS</small><h1>Sales / Tills</h1><p>Cashier: <strong>{username}</strong> · {role}</p></div>
      <div className={styles.right}><span className={styles.demo}>DEMO — NO LIVE SALES</span>{role!=="Sales / Tills"&&<Link href="/">Back to Hub</Link>}<a href="/cdn-cgi/access/logout">Sign out</a></div>
    </header>
    <div className={styles.notice}><strong>Pilot checkout preview only.</strong> Products and VAT amounts are visible, but no sale can be posted, paid, printed or deducted from inventory. RetailOS offline synchronisation is not yet connected to this Hub screen.</div>
    <section className={styles.content}>
      <div className={styles.left}>
        <div className={styles.panel}>
          <label className={styles.label} htmlFor="tillBranch">Store / branch</label>
          <select id="tillBranch" value={branch} onChange={e=>changeBranch(e.target.value)}>{stores.map(s=><option key={s}>{s}</option>)}</select>
          <div className={styles.scanHeader}><h2>Scan or search product</h2><span>Barcode / code / name</span></div>
          <form className={styles.scanForm} onSubmit={e=>{e.preventDefault();void searchProducts();}}>
            <input ref={field} autoFocus aria-label="Product code, barcode or name" autoComplete="off" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Scan product code or type its name" maxLength={100}/>
            <button type="submit" disabled={working||!search.trim()}>{working?"Searching…":"Find product"}</button>
          </form>
          {error&&<p role="alert" className={styles.error}>{error}</p>}
          {!!products.length&&<div className={styles.results} aria-label="Product search results">{products.map(p=><button type="button" key={p.id} onClick={()=>add(p)}><span><strong>{p.name}</strong><small>{p.code} · {p.category}</small></span><b>{zMoney(p.price_cents)} <small>/{p.unit}</small></b></button>)}</div>}
        </div>
        <div className={styles.panel}>
          <div className={styles.heading}><h2>Current basket</h2><button type="button" className={styles.clear} onClick={()=>{setLines([]);setCash("");setMessage("Basket cleared; no transaction was created.");}} disabled={!lines.length}>Clear basket</button></div>
          {lines.length===0?<p className={styles.empty}>Search or scan a product to build a demonstration basket.</p>:<div className={styles.basket}>{lines.map(line=><div className={styles.item} key={line.product.id}><div className={styles.itemName}><strong>{line.product.name}</strong><span>{line.product.code} · {zMoney(line.product.price_cents)} /{line.product.unit}</span></div><div className={styles.qty}><button type="button" aria-label={`Decrease ${line.product.name}`} onClick={()=>setLines(prev=>prev.map(x=>x.product.id===line.product.id?{...x,quantity:Math.max(1,x.quantity-1)}:x))}>−</button><span>{line.quantity}</span><button type="button" aria-label={`Increase ${line.product.name}`} onClick={()=>setLines(prev=>prev.map(x=>x.product.id===line.product.id?{...x,quantity:normalizeQty(x.quantity+1)}:x))}>+</button></div><strong>{zMoney(line.product.price_cents*line.quantity)}</strong><button type="button" className={styles.remove} aria-label={`Remove ${line.product.name}`} onClick={()=>setLines(prev=>prev.filter(x=>x.product.id!==line.product.id))}>×</button></div>)}</div>}
          {message&&<p role="status" className={styles.message}>{message}</p>}
        </div>
      </div>
      <aside className={styles.panel}>
        <h2>Sale summary</h2>
        <p className={styles.muted}>VAT-inclusive · South Africa 15%</p>
        <div className={styles.summaryRow}><span>Net excl. VAT</span><b>{zMoney(net)}</b></div>
        <div className={styles.summaryRow}><span>VAT (15%)</span><b>{zMoney(vat)}</b></div>
        <div className={styles.summaryTotal}><span>Total incl. VAT</span><b>{zMoney(total)}</b></div>
        <label className={styles.label} htmlFor="tender">Cash received (simulation)</label>
        <input id="tender" type="text" inputMode="decimal" placeholder="0.00" value={cash} onChange={e=>setCash(e.target.value)} />
        <div className={styles.summaryRow}><span>{difference>=0?"Change":"Amount still due"}</span><b>{zMoney(Math.abs(difference))}</b></div>
        <button className={styles.disabledPay} type="button" disabled>Complete sale — not enabled</button>
        <p className={styles.muted}>Real checkout requires approved payment handling, receipt issuing, stock posting, offline outbox and balanced journal integration.</p>
      </aside>
    </section>
  </main>;
}

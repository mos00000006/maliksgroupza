"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import styles from "./find-us.module.css";

type Branch = { name: string; region?: string; address?: string; suburb?: string; city?: string; province?: string; phone?: string; weekdays?: string; saturday?: string; sunday?: string; public_notes?: string; published?: boolean };
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
function readableHours(raw?: string) { return raw?.trim() || "Please contact branch"; }
export default function FindUs() {
  const [stores, setStores] = useState<Branch[]>([]);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Record<string,boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/ecommerce/public?channel=B2C&pageSize=8", {cache:"no-store",signal:controller.signal})
      .then(async res => { if(!res.ok) throw new Error("The store directory is temporarily unavailable."); return res.json(); })
      .then(data => setStores(Array.isArray(data.stores)? data.stores : []))
      .catch(err => { if(err?.name !== "AbortError") setError("The store directory is temporarily unavailable."); })
      .finally(() => { if(!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);
  const visible = useMemo(() => stores.filter(store => [store.name,store.region,store.suburb,store.city,store.province,store.address].filter(Boolean).join(" ").toLowerCase().includes(query.toLowerCase().trim())), [stores,query]);
  return <main className={styles.page}>
    <div className={styles.topbar}><span>POWERBUILD • BUILD WITH CONFIDENCE</span><Link href="/shop">Continue shopping →</Link></div>
    <header className={styles.header}><Link href="/shop" className={styles.brand}><span className={styles.brandMark}>PB<span>+</span></span><span>POWERBUILD<small>Building better, together</small></span></Link><nav><Link href="/shop">Shop products</Link><Link href="/shop/find-us" aria-current="page">Find our stores</Link></nav></header>
    <section className={styles.hero}><div className={styles.wrap}><p className={styles.eyebrow}>VISIT US IN STORE</p><h1>Find our stores</h1><p>Find your nearest PowerBuild branch, see verified opening hours and get directions.</p></div></section>
    <section className={styles.wrap} aria-label="PowerBuild store locator">
      <div className={styles.controls}><div><h2>Shops & Stores</h2><p>{loading?"Loading branches…":`${visible.length} branch${visible.length===1?"":"es"} shown`}</p></div><label className={styles.search}><span>Search by branch, town or area</span><input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search e.g. Chamdor, Kagiso or Midway" /></label></div>
      {error && <p role="alert" className={styles.notice}>{error}</p>}
      {!loading && !error && visible.length === 0 && <p className={styles.notice}>No branches match your search.</p>}
      <div className={styles.grid}>{visible.map(store => {
        const verified = Boolean(store.published && store.address && store.city && store.weekdays);
        const address = [store.address,store.suburb,store.city,store.province].filter(Boolean).join(", ");
        const open = Boolean(expanded[store.name]);
        const weekday = readableHours(store.weekdays);
        const saturday = readableHours(store.saturday);
        const sunday = readableHours(store.sunday);
        return <article className={styles.card} key={store.name}>
          <div className={styles.cardInner}><p className={styles.cardKicker}>POWERBUILD BRANCH</p><h3>{store.name}</h3><p className={styles.location}>{verified ? address : "Address to be confirmed"}</p>
            {verified ? <><a className={styles.directions} href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`} target="_blank" rel="noopener noreferrer">Get directions ↗</a><button className={styles.expand} type="button" aria-expanded={open} onClick={()=>setExpanded(current=>({...current,[store.name]:!open}))}>Opening hours <span>{open?"−":"+"}</span></button>
            {open && <div className={styles.hours}><table><tbody>{days.map((day,i)=><tr key={day}><th scope="row">{day}</th><td>{i<5?weekday:i===5?saturday:sunday}</td></tr>)}</tbody></table>{store.public_notes && <p>{store.public_notes}</p>}</div>}
            {store.phone && <p className={styles.contact}>Call branch: <a href={`tel:${store.phone.replace(/[^+0-9]/g,"")}`}>{store.phone}</a></p>}</> : <p className={styles.pending}>Address and trading hours will appear once confirmed by management.</p>}
          </div>
        </article>;
      })}</div>
    </section>
    <footer className={styles.footer}><strong>POWERBUILD</strong><span>Find the right materials, at the right branch.</span><Link href="/shop">Back to online store →</Link></footer>
  </main>;
}

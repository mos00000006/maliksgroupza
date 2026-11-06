"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import styles from "./tills.module.css";
import { basketTotals, parseZarCents, quoteDeposit, safeQty, tenderPreview } from "./pos-preview-domain.mjs";

type Product={id:number;code:string;name:string;category:string;price_cents:number;unit:string;coverage_per_box:number};
type Line={product:Product;quantity:number};
type Draft={id:string;kind:"Parked sale"|"Quotation"|"Sales order";branch:string;created:string;lines:Line[]};
type Section="checkout"|"documents"|"customers"|"inventory"|"dispatch"|"cashoffice"|"reports"|"settings";
type Dialog="tender"|"quote"|"order"|"layby"|"delivery"|"return"|"discount"|"drawer"|"receipt"|null;
const money=(cents:number)=>new Intl.NumberFormat("en-ZA",{style:"currency",currency:"ZAR"}).format(cents/100);
const when=()=>new Date().toLocaleTimeString("en-ZA",{hour:"2-digit",minute:"2-digit"});
const menus: {id:Section;icon:string;name:string;subtitle:string}[]=[
  {id:"checkout",icon:"checkout",name:"Sales / Checkout",subtitle:"Scan and basket"},
  {id:"documents",icon:"documents",name:"Documents & parked",subtitle:"Quotes, orders, lay-bys"},
  {id:"customers",icon:"customers",name:"Customers & accounts",subtitle:"Trade and loyalty"},
  {id:"inventory",icon:"inventory",name:"Stock enquiry",subtitle:"Product lookup"},
  {id:"dispatch",icon:"dispatch",name:"Dispatch & deliveries",subtitle:"Collections and POD"},
  {id:"cashoffice",icon:"cashoffice",name:"Till & cash office",subtitle:"Shifts and cash-up"},
  {id:"reports",icon:"reports",name:"Sales intelligence",subtitle:"Reports and audit"},
  {id:"settings",icon:"settings",name:"Workstation guide",subtitle:"Permissions & shortcuts"},
];
const featureGroups:Record<Exclude<Section,"checkout"|"documents"|"inventory">, {title:string;description:string;icon:string}[]>={
  customers:[
    {title:"Customer & trade-account lookup",description:"Customer profiles, negotiated prices, balances, credit limits and terms.",icon:"♙"},
    {title:"Loyalty & rewards",description:"Member search, points, redemption, categories and loyalty statements.",icon:"★"},
    {title:"Receipts, statements & payments",description:"Account invoices, payment allocations, receipts and age analysis.",icon:"▤"},
    {title:"Lay-by account register",description:"Deposits, instalments, stock reservations and collections.",icon:"◉"},
  ],
  dispatch:[
    {title:"Delivery and collection instructions",description:"Attach authorised delivery or collection details to an order.",icon:"↗"},
    {title:"Staged dispatch and yard handover",description:"Pick, load, verify, sign and track delivery notes and partial dispatches.",icon:"▣"},
    {title:"Delivery planning and POD",description:"Vehicle allocation, routes, proof of delivery and exceptions.",icon:"▤"},
  ],
  cashoffice:[
    {title:"Cashier shifts & opening floats",description:"Secure staff sign-in, till assignment, opening float and shift ownership.",icon:"◷"},
    {title:"Cash-up and tender reconciliation",description:"Blind count, payment splits, cash drops and manager review.",icon:"▤"},
    {title:"Cash drawer & hardware audit",description:"Controlled drawer pulses, printer status and receipt reprints.",icon:"▣"},
    {title:"End-of-day close",description:"Trading-day settlement, variance sign-off and final posting.",icon:"✓"},
  ],
  reports:[
    {title:"Till status & cashier performance",description:"Daily transactions, user summaries, tender splits and hourly turnover.",icon:"◫"},
    {title:"Product & department sales",description:"Top sellers, returns, transaction audits and branch comparisons.",icon:"▦"},
    {title:"Financial & audit reporting",description:"VAT, cash-up variances, stock movements and approved GL journals.",icon:"▤"},
  ],
  settings:[
    {title:"Access by assigned branch",description:"The Hub determines the cashier's approved stores and workspaces.",icon:"♙"},
    {title:"Supervisor approvals",description:"Refunds, discounts, voids, account sale and price overrides need backend permission checks.",icon:"✓"},
    {title:"Offline-first workflow",description:"Use the RetailOS transaction service and durable outbox before enabling real trading.",icon:"↻"},
    {title:"Peripherals",description:"Epson TM-T88V printer, drawer and scanner need certified on-device checks.",icon:"▣"},
  ],
};


/** Lightweight inline icons: no external packages, images, or runtime assets. */
function PosGlyph({kind}:{kind:string}) {
  const common={fill:"none",stroke:"currentColor",strokeWidth:1.8,strokeLinecap:"round" as const,strokeLinejoin:"round" as const};
  const shape=(()=>{switch(kind){
    case "checkout":return <><path d="M3 4h2l2 10h11l2-7H6"/><circle cx="9" cy="19" r="1"/><circle cx="18" cy="19" r="1"/></>;
    case "documents":case "quote":return <><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></>;
    case "customers":return <><circle cx="12" cy="8" r="3"/><path d="M5 20v-2a7 7 0 0 1 14 0v2"/></>;
    case "inventory":case "basket":return <><path d="m4 8 8-5 8 5v10l-8 4-8-4zM4 8l8 5 8-5M12 13v9"/></>;
    case "dispatch":return <><path d="M3 6h12v12H3zM15 10h3l3 4v4h-6z"/><circle cx="7" cy="19" r="2"/><circle cx="18" cy="19" r="2"/></>;
    case "cashoffice":return <><rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 10h18M16 15h2"/><path d="M7 6V4h11"/></>;
    case "reports":return <><path d="M4 20V12M9 20V7M14 20v-9M19 20V4"/><path d="M3 20h18"/></>;
    case "settings":return <><circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M19 5l-2 2M7 17l-2 2"/></>;
    case "scan":return <><path d="M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4M7 11v2m3-4v6m3-6v6m3-4v2"/></>;
    case "park":return <><path d="M5 5h14v14H5zM9 5v6h6V5M9 19v-5h6v5"/></>;
    case "retrieve":return <><path d="M3 11a9 9 0 1 1 3 7M3 18v-6h6"/><path d="M12 7v5l4 2"/></>;
    case "order":return <><rect x="6" y="5" width="12" height="17" rx="2"/><path d="M9 5V3h6v2M9 11h6M9 15h6M9 19h4"/></>;
    case "layby":return <><circle cx="12" cy="12" r="9"/><path d="M14.5 8H11a2 2 0 0 0 0 4h2a2 2 0 0 1 0 4H9.5M12 6v2m0 8v2"/></>;
    case "return":return <><path d="m9 10-5 5 5 5M4 15h11a5 5 0 0 0 0-10h-2"/></>;
    case "lock":return <><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>;
    default:return <circle cx="12" cy="12" r="9"/>;
  }})();
  return <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false" {...common}>{shape}</svg>;
}

export default function TillCheckout({username,role,stores}:{username:string;role:string;stores:string[]}) {
  const [branch,setBranch]=useState(stores[0]??"");
  const [section,setSection]=useState<Section>("checkout");
  const [search,setSearch]=useState("");
  const [products,setProducts]=useState<Product[]>([]);
  const [lines,setLines]=useState<Line[]>([]);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const [cash,setCash]=useState("");
  const [card,setCard]=useState("");
  const [eft,setEft]=useState("");
  const [depositPercent,setDepositPercent]=useState("25");
  const [drafts,setDrafts]=useState<Draft[]>([]);
  const [modal,setModal]=useState<Dialog>(null);
  const [documentNo,setDocumentNo]=useState(0);
  const [clock,setClock]=useState("");
  const [deliveryMethod,setDeliveryMethod]=useState<"Collection"|"Delivery">("Collection");
  const [drawerCount,setDrawerCount]=useState("");
  const [receiptMode,setReceiptMode]=useState<"Quote"|"Basket">("Basket");
  const [stockTerm,setStockTerm]=useState("");
  const [stockResults,setStockResults]=useState<Product[]>([]);
  const focus=useRef<HTMLInputElement>(null);
  const activeRequest=useRef<AbortController|null>(null);
  const nextId=useRef(1);
  const totals=useMemo(()=>basketTotals(lines),[lines]);
  const tender=useMemo(()=>tenderPreview(totals.gross,{cash,card,eft}),[totals.gross,cash,card,eft]);
  const deposit=quoteDeposit(totals.gross,Number(depositPercent));
  const isTillOnly=role==="Sales / Tills";
  const isBuster=/buster\s*build/i.test(branch);
  const selectedDocs=drafts.filter(d=>d.branch===branch);
  const invalidTender=[cash,card,eft].some(value=>value.trim()!==""&&parseZarCents(value)===null);

  useEffect(()=>{
    const updateClock=()=>setClock(when());
    const timer=window.setInterval(updateClock,30000);
    const keyboard=(event:KeyboardEvent)=>{
      if(event.key==="F2"){event.preventDefault();setSection("checkout");window.setTimeout(()=>focus.current?.focus(),0);}
      if(event.key==="F4"){event.preventDefault();setSection("documents");}
      if(event.key==="F6"){event.preventDefault();setModal("quote");}
      if(event.key==="F8"){event.preventDefault();setModal("tender");}
      if(event.key==="Escape")setModal(null);
    };
    window.addEventListener("keydown",keyboard);
    return ()=>{window.clearInterval(timer);window.removeEventListener("keydown",keyboard);activeRequest.current?.abort();};
  },[]);
  useEffect(()=>{
    const params=new URLSearchParams(window.location.search);
    const invite=params.get("invite");
    if(!invite)return;
    void fetch("/api/team/accept",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({token:invite})}).finally(()=>{
      window.history.replaceState(null,"",window.location.pathname);
    });
  },[]);

  const changeBranch=(value:string)=>{
    if(value===branch)return;
    if(lines.length&&!window.confirm("Switching stores clears your current basket. Continue?"))return;
    activeRequest.current?.abort(); activeRequest.current=null;
    setBranch(value);setLines([]);setProducts([]);setStockResults([]);setSearch("");setCash("");setCard("");setEft("");setError("");setNotice("");setModal(null);
  };
  const add=(product:Product)=>{
    setLines(previous=>{
      const existing=previous.find(x=>x.product.id===product.id);
      return existing?previous.map(x=>x.product.id===product.id?{...x,quantity:Math.min(9999,Math.round((x.quantity+1)*1000)/1000)}:x):[...previous,{product,quantity:1}];
    });
    setSearch("");setProducts([]);setError("");setNotice(`${product.name} added to basket.`);focus.current?.focus();
  };
  const searchProducts=async(q=search,stock=false)=>{
    const term=q.trim();if(!term){if(stock)setStockResults([]);else setProducts([]);return;}
    activeRequest.current?.abort();const controller=new AbortController();activeRequest.current=controller;
    setBusy(true);setError("");
    try{
      const response=await fetch(`/api/tills/catalogue?branch=${encodeURIComponent(branch)}&q=${encodeURIComponent(term)}`,{cache:"no-store",signal:controller.signal});
      const payload=await response.json();if(controller.signal.aborted)return;
      if(!response.ok)throw new Error(payload.error??"Catalogue search unavailable.");
      const found=(payload.products??[]) as Product[];
      if(stock){setStockResults(found);}
      else {const exact=found.find(p=>p.code.toLowerCase()===term.toLowerCase());
        if(exact)add(exact);else {setProducts(found);if(!found.length)setError("No published branch price found. Ask the stock controller to verify the catalogue.");}}
    }catch(e){if(!controller.signal.aborted)setError(e instanceof Error?e.message:"Unable to retrieve products.");}
    finally{if(!controller.signal.aborted)setBusy(false);}
  };
  const changeQty=(id:number,value:unknown)=>{
    const next=safeQty(value);
    if(next!==null)setLines(old=>old.map(line=>line.product.id===id?{...line,quantity:next}:line));
  };
  const park=()=>{
    if(!lines.length){setNotice("Add products before parking a draft.");return;}
    const id=`LOCAL-${String(nextId.current++).padStart(3,"0")}`;
    setDrafts(previous=>[{id,kind:"Parked sale",branch,created:when(),lines:lines.map(l=>({...l}))},...previous]);
    setLines([]);setCash("");setCard("");setEft("");setNotice(`Basket ${id} parked for this session only. No stock reserved.`);
  };
  const saveDocument=(kind:"Quotation"|"Sales order")=>{
    if(!lines.length){setNotice("Add products before creating a document draft.");setModal(null);return;}
    const id=`DRAFT-${String(nextId.current++).padStart(3,"0")}`;
    setDrafts(previous=>[{id,kind,branch,created:when(),lines:lines.map(l=>({...l}))},...previous]);
    setDocumentNo(n=>n+1);setModal(null);setNotice(`${kind} ${id} saved locally for this browser session. It has not been issued or posted.`);
  };
  const restore=(draft:Draft)=>{
    if(lines.length&&!window.confirm("Replace the current basket with this draft?"))return;
    setLines(draft.lines.map(l=>({...l})));setSection("checkout");setModal(null);
    setNotice(`${draft.kind} ${draft.id} loaded into the basket.`);focus.current?.focus();
    if(draft.kind==="Parked sale")setDrafts(previous=>previous.filter(x=>x.id!==draft.id));
  };
  const open=(name:Dialog)=>{setModal(name);setError("");};
  const renderFeatureCard=(feature:{title:string;description:string;icon:string})=><div className={styles.featureCard} key={feature.title}>
    <div className={styles.featureIcon}>{feature.icon}</div><div><h3>{feature.title}</h3><p>{feature.description}</p><span className={styles.pending}>Backend integration required</span></div>
  </div>;
  const receipt=()=>{
    setReceiptMode("Basket");open("receipt");
  };
  const clear=()=>{
    if(!lines.length)return;
    if(!window.confirm("Clear this basket? No sale will be recorded."))return;
    setLines([]);setCash("");setCard("");setEft("");setNotice("Basket cleared. No transaction was created.");
  };
  const pill=(text:string)=> <span className={styles.smallPill}>{text}</span>;
  const documentTitle=modal==="quote"?"Create quotation draft":modal==="order"?"Create sales order draft":modal==="layby"?"Lay-by calculator":modal==="delivery"?"Delivery / collection":modal==="return"?"Refund and return request":modal==="discount"?"Discount / price override":modal==="drawer"?"Cash drawer control":modal==="receipt"?"Basket summary":"Payment calculator";
  const previewLines=lines.map(line=>({product:line.product,quantity:line.quantity}));
  const isDocumentPrint=modal==="receipt";
  return <main className={`${styles.shell} ${isBuster?styles.buster:styles.power}`}>
    <aside className={styles.side} aria-label="POS navigation">
      <div className={styles.logo}><div className={styles.logoMark}><span className={styles.logoMonogram}>M</span><span className={styles.logoSpark}>✦</span></div><div><strong>MALIKS</strong><span>RETAIL OS <i>PRO</i></span></div></div>
      <div className={styles.sideLabel}>YOUR WORKSPACE</div>
      <nav className={styles.nav}>
        {menus.map(menu=><button type="button" key={menu.id} className={`${styles.navButton} ${section===menu.id?styles.navSelected:""}`} onClick={()=>{setSection(menu.id);setError("");}}>
          <span className={styles.navIcon} aria-hidden><PosGlyph kind={menu.icon}/></span><span><strong>{menu.name}</strong><small>{menu.subtitle}</small></span>
        </button>)}
      </nav>
      <div className={styles.sideFooter}><div className={styles.avatar}>{username.slice(0,1).toUpperCase()}</div><div className={styles.sidePerson}><b>{username}</b><span>{role}</span></div><span className={styles.sideStatus}>●</span></div>
    </aside>

    <div className={styles.main}>
      <header className={styles.topbar}>
        <div className={styles.crumb}><span className={styles.crumbMark}>M</span><span>Maliks Group Hub</span><span className={styles.slash}>/</span><strong>Point of Sale</strong></div>
        <div className={styles.topActions}><span className={styles.previewTag} title="NO LIVE SALES — transaction posting has not been activated"><span className={styles.statusDot}/> Checkout setup required</span><span className={styles.clock}>{clock||"Local workstation"}</span>{!isTillOnly&&<span className={styles.returnHub}>{role!=="Sales / Tills"&&<Link href="/">Switch back to Hub</Link>}</span>}<a className={styles.logout} href="/cdn-cgi/access/logout">Sign out</a></div>
      </header>
      <div className={styles.pageBody}>
        <div className={styles.titleBar}><div><div className={styles.eyebrow}>MALIKS RETAILOS <span className={styles.eyebrowLine}/> {isBuster?"BUSTER BUILD":"POWERBUILD"}</div><h1>{menus.find(x=>x.id===section)?.name}</h1><p>A faster, smarter counter for hardware, trade and everyday retail.</p><div className={styles.heroTags}><span><PosGlyph kind="scan"/> Barcode-ready workspace</span><span><PosGlyph kind="customers"/> Branch-aware pricing</span></div></div><div className={styles.branchWidget}><label htmlFor="branch">ACTIVE BRANCH</label><select id="branch" value={branch} onChange={e=>changeBranch(e.target.value)}>{stores.map(s=><option key={s} value={s}>{s}</option>)}</select><span>Operator: {username} <span className={styles.branchSeparator}>•</span> Shift not opened</span></div></div>
        <div className={styles.alert} role="status"><span className={styles.alertIcon}><PosGlyph kind="lock"/></span><p><strong>Transaction service not yet activated.</strong> You can search products and prepare baskets. Payments, tax invoices, stock movements and financial posting remain locked until RetailOS is connected and verified.</p><span className={styles.alertState}>SETUP REQUIRED</span></div>
        {notice&&<div role="status" className={styles.notice}><span>✓</span><p>{notice}</p><button type="button" aria-label="Dismiss message" onClick={()=>setNotice("")}>×</button></div>}
        {error&&<div role="alert" className={styles.error}><span>!</span><p>{error}</p><button type="button" aria-label="Dismiss error" onClick={()=>setError("")}>×</button></div>}
        {section==="checkout"&&<>
          <div className={styles.kpis}>
            <div className={styles.kpi}><span>CURRENT BASKET</span><strong>Open counter</strong><small>Unposted · Stock not reserved</small></div>
            <div className={styles.kpi}><span>LINE ITEMS</span><strong>{totals.items}</strong><small>{Number(totals.units.toFixed(3))} units in basket</small></div>
            <div className={styles.kpi}><span>AMOUNT DUE</span><strong>{money(totals.gross)}</strong><small>Includes 15% VAT</small></div>
            <div className={styles.kpi}><span>PARKED / DRAFTS</span><strong>{selectedDocs.length}</strong><small>Current session</small></div>
          </div>
          <section className={styles.actionRow} aria-label="Sale actions">
            <button type="button" onClick={park}><span><PosGlyph kind="park"/></span><strong>Park sale</strong><small>F4 for drafts</small></button>
            <button type="button" onClick={()=>setSection("documents")}><span><PosGlyph kind="retrieve"/></span><strong>Retrieve</strong><small>{selectedDocs.length} drafts</small></button>
            <button type="button" onClick={()=>open("quote")}><span><PosGlyph kind="quote"/></span><strong>Quotation</strong><small>F6</small></button>
            <button type="button" onClick={()=>open("order")}><span><PosGlyph kind="order"/></span><strong>Sales order</strong><small>Draft only</small></button>
            <button type="button" onClick={()=>open("layby")}><span><PosGlyph kind="layby"/></span><strong>Lay-by</strong><small>Calculator</small></button>
            <button type="button" onClick={()=>open("return")}><span><PosGlyph kind="return"/></span><strong>Refund / return</strong><small>Approval required</small></button>
          </section>
          <div className={styles.checkoutGrid}>
            <div className={styles.workCol}>
              <section className={styles.panel}>
                <div className={styles.panelHead}><div><span className={styles.eyebrow}>01 / PRODUCT ENTRY</span><h2>Scan or search products</h2></div>{pill("Branch catalogue")}</div>
                <form className={styles.searchForm} onSubmit={e=>{e.preventDefault();void searchProducts();}}>
                  <span className={styles.scanGlyph}><PosGlyph kind="scan"/></span><input ref={focus} autoFocus placeholder="Scan barcode / enter product code / search name…" value={search} onChange={e=>setSearch(e.target.value)} aria-label="Product code or product name" autoComplete="off" maxLength={100}/><kbd>F2</kbd><button type="submit" disabled={busy||!search.trim()}>{busy?"Searching…":"Find item"}</button>
                </form>
                <div className={styles.catalogueInfo}><span><span className={styles.infoDot}/> Published branch prices</span><span>Stock balances not connected</span><span>Scan barcode or search by code</span></div>
                {!!products.length&&<div className={styles.searchResults}>{products.map(p=><button type="button" key={p.id} onClick={()=>add(p)}><span className={styles.productTile}>{p.category.slice(0,2).toUpperCase()}</span><span className={styles.productName}><strong>{p.name}</strong><small>{p.code} · {p.category}</small></span><b>{money(p.price_cents)}</b><span className={styles.addGlyph}>＋</span></button>)}</div>}
              </section>
              <section className={styles.panel}>
                <div className={styles.panelHead}><div><span className={styles.eyebrow}>02 / BASKET</span><h2>Current basket <span className={styles.itemCount}>{lines.length} lines</span></h2></div><div className={styles.inlineActions}><button type="button" onClick={()=>open("discount")}>% Discounts</button><button type="button" onClick={clear} disabled={!lines.length}>Clear all</button></div></div>
                <div className={styles.customerRow}><div className={styles.customerAvatar}>♙</div><div><b>Walk-in customer</b><small>Cash sale · Trade account lookup not yet connected</small></div><button type="button" onClick={()=>setSection("customers")}>Customer options ↗</button></div>
                {lines.length===0?<div className={styles.emptyBasket}><div className={styles.bagIcon}><PosGlyph kind="basket"/></div><strong>Ready for the first scan</strong><p>Start by scanning a barcode or searching the product catalogue above.</p><span>F2 Search · F6 Quote · F8 Tender</span></div>:<div className={styles.basketScroll}><table className={styles.cartTable}><thead><tr><th>PRODUCT</th><th>QTY</th><th>UNIT PRICE</th><th>TOTAL</th><th aria-label="Remove"/></tr></thead><tbody>{lines.map((line)=>
                  <tr key={line.product.id}><td><strong>{line.product.name}</strong><small>{line.product.code} · {line.product.unit||"each"}</small></td><td><div className={styles.qtyBox}><button aria-label={`Reduce quantity of ${line.product.name}`} type="button" onClick={()=>changeQty(line.product.id,Math.max(0.001,line.quantity-1))}>−</button><input aria-label={`Quantity of ${line.product.name}`} type="number" min="0.001" max="9999" step="any" value={line.quantity} onChange={e=>changeQty(line.product.id,e.target.value)} /><button aria-label={`Increase quantity of ${line.product.name}`} type="button" onClick={()=>changeQty(line.product.id,line.quantity+1)}>+</button></div></td><td>{money(line.product.price_cents)}</td><td className={styles.lineAmount}>{money(Math.round(line.product.price_cents*line.quantity))}</td><td><button className={styles.removeItem} type="button" aria-label={`Remove ${line.product.name}`} onClick={()=>setLines(prev=>prev.filter(x=>x.product.id!==line.product.id))}>×</button></td></tr>
                )}</tbody></table></div>}
                <footer className={styles.cartFoot}><span>Item prices include VAT, subject to branch catalogue publishing.</span><button type="button" onClick={()=>open("delivery")}>↗ Add delivery / collection details</button></footer>
              </section>
            </div>
            <aside className={styles.summaryCol}>
              <section className={`${styles.panel} ${styles.totalsPanel}`}><div className={styles.panelHead}><div><span className={styles.eyebrow}>03 / CHECKOUT</span><h2>Payment summary</h2></div><span className={styles.draftTag}>UNPOSTED</span></div><div className={styles.totalsLines}><div><span>Sub-total (excl. VAT)</span><strong>{money(totals.net)}</strong></div><div><span>VAT 15% (included)</span><strong>{money(totals.vat)}</strong></div><div><span>Line items</span><strong>{totals.items}</strong></div></div><div className={styles.grand}><span>TOTAL DUE <small>VAT inclusive</small></span><strong>{money(totals.gross)}</strong></div><div className={styles.paymentOptions}><span>PAYMENT METHODS</span><div><button type="button" onClick={()=>open("tender")}>▣ Cash</button><button type="button" onClick={()=>open("tender")}>▰ Card</button><button type="button" onClick={()=>open("tender")}>↗ EFT</button></div></div><label className={styles.fieldLabel} htmlFor="quickCash">Cash received · calculator</label><div className={styles.moneyEntry}><span>R</span><input id="quickCash" inputMode="decimal" value={cash} onChange={e=>setCash(e.target.value)} placeholder="0.00" aria-label="Cash amount received preview"/></div><div className={styles.changeLine}><span>{tender.paid>=totals.gross?"Change due":"Outstanding"}</span><strong>{money(tender.paid>=totals.gross?tender.change:tender.due)}</strong></div><button className={styles.payPrimary} type="button" disabled aria-label="Complete sale — not enabled"><PosGlyph kind="lock"/> Activate checkout to complete sale</button><button className={styles.secondaryWide} type="button" onClick={()=>open("tender")}>Open payment calculator <span aria-hidden>↗</span></button><div className={styles.safeNote}><PosGlyph kind="lock"/> Sales posting is disabled. No money is taken, no official receipt is issued, and stock remains unchanged.</div></section>
              <section className={styles.panel}><div className={styles.panelHead}><div><span className={styles.eyebrow}>QUICK TOOLS</span><h2>Sale assistance</h2></div></div><div className={styles.sideTools}><button type="button" onClick={receipt}>▤ <span>Print basket summary</span> ↗</button><button type="button" onClick={()=>open("drawer")}>▣ <span>Open cash drawer</span> ↗</button><button type="button" onClick={()=>setSection("inventory")}>▦ <span>Price / stock enquiry</span> ↗</button><button type="button" onClick={()=>setSection("cashoffice")}>◷ <span>Till cash-up</span> ↗</button></div></section>
            </aside>
          </div>
        </>}
        {section==="documents"&&<section className={styles.panel}><div className={styles.panelHead}><div><span className={styles.eyebrow}>TRANSACTIONS</span><h2>Parked sales & document drafts</h2></div>{pill("This browser session only")}</div><div className={styles.sectionIntro}>Parked baskets, quotations and sales orders are held only in this browser session. They are not issued documents and cannot reserve stock or create customer debt.</div><div className={styles.docTools}><button onClick={()=>setSection("checkout")} type="button">＋ New sale</button><button onClick={()=>open("quote")} type="button">▧ Quote current basket</button><button onClick={()=>open("order")} type="button">▤ Sales order draft</button><button onClick={()=>open("layby")} type="button">◉ Lay-by estimate</button></div>{selectedDocs.length? <div className={styles.draftList}>{selectedDocs.map(d=>{const sum=basketTotals(d.lines);return <article key={d.id}><span className={styles.docIcon}>▤</span><div><b>{d.kind} · {d.id}</b><small>{d.created} · {d.lines.length} lines · {d.branch}</small></div><strong>{money(sum.gross)}</strong><button type="button" onClick={()=>restore(d)}>Load basket</button><button type="button" aria-label={`Delete ${d.id}`} onClick={()=>setDrafts(old=>old.filter(x=>x.id!==d.id))}>×</button></article>;})}</div>:<div className={styles.emptyBasket}><div className={styles.bagIcon}>▧</div><strong>No parked or draft documents yet</strong><p>Park an active sale or save a quotation draft from the checkout screen.</p></div>}</section>}
        {section==="inventory"&&<section className={styles.panel}><div className={styles.panelHead}><div><span className={styles.eyebrow}>PRODUCT CONTROL</span><h2>Price and product enquiry</h2></div>{pill("Published price book")}</div><div className={styles.sectionIntro}>Search your branch&apos;s published product prices. Physical available quantity, reorder levels, warehouse bins and serial numbers require the stock ledger integration.</div><form className={styles.searchForm} onSubmit={e=>{e.preventDefault();void searchProducts(stockTerm,true);}}><span className={styles.scanGlyph}><PosGlyph kind="scan"/></span><input placeholder="Code or product description" aria-label="Stock product search" value={stockTerm} onChange={e=>setStockTerm(e.target.value)}/><button type="submit" disabled={busy||!stockTerm.trim()}>Search</button></form><div className={styles.stockList}>{stockResults.map(p=><div key={p.id}><span className={styles.productTile}>{p.category.slice(0,2).toUpperCase()}</span><div><b>{p.name}</b><small>{p.code} · {p.category} · {p.unit}</small></div><strong>{money(p.price_cents)}</strong><span className={styles.pending}>Stock qty unavailable</span><button type="button" onClick={()=>{add(p);setSection("checkout");}}>Add to draft</button></div>)}</div></section>}
        {section!=="checkout"&&section!=="documents"&&section!=="inventory"&&<><div className={styles.workspaceIntro}><div><span className={styles.eyebrow}>BACK OFFICE / MODULES</span><h2>{menus.find(x=>x.id===section)?.name}</h2><p>Designed for the Hub&apos;s role- and branch-controlled workflow. These operations need a secure RetailOS API before activation.</p></div><span className={styles.previewTag}>INTEGRATION PENDING</span></div><div className={styles.featureGrid}>{featureGroups[section].map(renderFeatureCard)}</div>{section==="cashoffice"&&<section className={styles.panel}><div className={styles.panelHead}><div><span className={styles.eyebrow}>CASH COUNT CALCULATOR</span><h2>Cash count preview</h2></div></div><label className={styles.fieldLabel} htmlFor="drawerCount">Physical cash amount (ZAR)</label><div className={styles.moneyEntry}><span>R</span><input id="drawerCount" value={drawerCount} onChange={e=>setDrawerCount(e.target.value)} placeholder="0.00" inputMode="decimal"/></div><p className={styles.sectionIntro}>Entered: {money(parseZarCents(drawerCount)??0)}. This is not recorded as a shift or cash-up declaration. No expected amount is exposed.</p></section>}</>}
        <footer className={styles.bottom}><span><b>Maliks RetailOS</b> · Sales & tills workstation</span><span>Published Hub catalogue · Transaction service inactive · {documentNo} local document action(s)</span></footer>
      </div>
    </div>
    {modal&&<div className={styles.scrim} role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setModal(null);}}><section className={styles.dialog} role="dialog" aria-modal="true" aria-label={documentTitle}><div className={styles.dialogHeader}><div><span className={styles.eyebrow}>MALIKS RETAILOS · CONTROLLED WORKFLOW</span><h2>{documentTitle}</h2></div><button type="button" aria-label="Close dialog" onClick={()=>setModal(null)}>×</button></div><div className={styles.dialogBody}>
      {modal==="tender"&&<><p className={styles.dialogLead}>Calculate split tender amounts. This calculator does not charge or record payments while checkout activation is pending.</p><div className={styles.tenderFields}>{([['Cash',cash,setCash],['Card',card,setCard],['EFT',eft,setEft]] as const).map(([name,val,set])=><label key={name}>{name} received (R)<input value={val} onChange={e=>set(e.target.value)} inputMode="decimal" placeholder="0.00"/></label>)}</div>{invalidTender&&<p className={styles.warningText}>Use whole rand or two decimal places. Negative values are not allowed.</p>}<div className={styles.modalSummary}><div><span>Amount due</span><b>{money(totals.gross)}</b></div><div><span>Entered tender</span><b>{money(tender.paid)}</b></div><div><span>{tender.due?"Still due":"Change"}</span><b>{money(tender.due||tender.change)}</b></div></div><button type="button" className={styles.modalDisabled} disabled aria-label="Complete sale — not enabled">Checkout activation required</button></>}
      {(modal==="quote"||modal==="order")&&<><p className={styles.dialogLead}>Generate a temporary <b>{modal==="quote"?"quotation":"sales order"}</b> draft for this browser session. It cannot be sent, approved, invoiced or converted into a real sale.</p><div className={styles.miniSummary}><span>{lines.length} products</span><b>{money(totals.gross)}</b><small>15% VAT included · Walk-in customer</small></div><div className={styles.modalButtons}><button type="button" onClick={()=>saveDocument(modal==="quote"?"Quotation":"Sales order")} disabled={!lines.length}>Save local draft</button><button className={styles.ghostBtn} type="button" onClick={()=>{setReceiptMode("Quote");setModal("receipt");}} disabled={!lines.length}>Print preview</button></div></>}
      {modal==="layby"&&<><p className={styles.dialogLead}>Estimate a lay-by deposit and balance. A live lay-by requires a customer, stock reservation, payment schedule, deposit receipt and account ledger.</p><label className={styles.fieldLabel} htmlFor="deposit">Deposit percentage</label><select id="deposit" className={styles.selectFull} value={depositPercent} onChange={e=>setDepositPercent(e.target.value)}><option value="10">10%</option><option value="20">20%</option><option value="25">25%</option><option value="30">30%</option><option value="50">50%</option></select><div className={styles.modalSummary}><div><span>Sale value</span><b>{money(totals.gross)}</b></div><div><span>Estimated deposit</span><b>{money(deposit?.deposit??0)}</b></div><div><span>Remaining balance</span><b>{money(deposit?.balance??0)}</b></div></div><button type="button" className={styles.modalDisabled} disabled>Create lay-by — requires account service</button></>}
      {modal==="delivery"&&<><p className={styles.dialogLead}>Choose a fulfilment preference. Dispatch notes, routes, addresses and proof of delivery require the connected back-office service.</p><div className={styles.choiceRow}><button type="button" className={deliveryMethod==="Collection"?styles.activeChoice:""} onClick={()=>setDeliveryMethod("Collection")}>◉ Customer collection</button><button type="button" className={deliveryMethod==="Delivery"?styles.activeChoice:""} onClick={()=>setDeliveryMethod("Delivery")}>↗ Branch delivery</button></div><p className={styles.sectionIntro}>Selected: {deliveryMethod}. This does not create a dispatch note or a delivery commitment.</p><button type="button" className={styles.modalButtonsSingle} onClick={()=>{setNotice(`${deliveryMethod} preference saved to this basket.`);setModal(null);}}>Save preference</button></>}
      {modal==="return"&&<><p className={styles.dialogLead}>A return requires an original invoice, cashier identity, supervisor approval and controlled stock and VAT reversal.</p><div className={styles.lockedFeature}>▣ Locate original transaction — not connected</div><div className={styles.lockedFeature}>✓ Supervisor authorisation — not connected</div><div className={styles.lockedFeature}>↶ Refund / credit note posting — disabled</div></>}
      {modal==="discount"&&<><p className={styles.dialogLead}>Price changes, line discounts and trade terms must be authorised server-side. Only published retail prices are available here; manual price changes are not authorised.</p><div className={styles.lockedFeature}>% Request manager-approved discount — not connected</div><div className={styles.lockedFeature}>▧ Assign account-specific price list — not connected</div></>}
      {modal==="drawer"&&<><p className={styles.dialogLead}>The Epson cash drawer can be opened only by an authorised station after a valid event is audited. Browser access to your printer/drawer has not been configured.</p><div className={styles.lockedFeature}>🔒 Hardware device not commissioned</div><button type="button" className={styles.modalDisabled} disabled>Send drawer pulse — disabled</button></>}
      {isDocumentPrint&&<><p className={styles.dialogLead}>This is an <b>unissued {receiptMode.toLowerCase()} summary</b>, not a tax invoice, cash slip, authorised quote or proof of payment.</p><div className={styles.printSheet} id="maliks-print-sheet"><div className={styles.printHeader}><strong>MALIKS GROUP</strong><span>{branch}</span><small>UNISSUED DOCUMENT — NOT VALID FOR TRADING</small></div><h3>{receiptMode==="Quote"?"QUOTATION DRAFT":"BASKET SUMMARY"}</h3>{previewLines.map(line=><div key={line.product.id} className={styles.printLine}><span>{line.quantity} × {line.product.name}</span><b>{money(Math.round(line.quantity*line.product.price_cents))}</b></div>)}<div className={styles.printTotal}><span>VAT included {money(totals.vat)}</span><strong>{money(totals.gross)}</strong></div><small>UNISSUED / NOT AN INVOICE OR PROOF OF PAYMENT.</small></div><button type="button" className={styles.modalButtonsSingle} onClick={()=>window.print()}>Print unissued summary</button></>}
    </div><div className={styles.dialogFoot}>No transaction posted · Controlled workstation <button type="button" onClick={()=>setModal(null)}>Close</button></div></section></div>}
  </main>;
}

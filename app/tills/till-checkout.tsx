"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import styles from "./tills.module.css";
import { basketTotals, parseZarCents, quoteDeposit, safeQty, tenderPreview } from "./pos-preview-domain.mjs";

type Product={id:number;code:string;name:string;category:string;price_cents:number;unit:string;coverage_per_box:number};
type Line={product:Product;quantity:number};
type Draft={id:string;kind:"Parked sale"|"Quotation"|"Sales order";branch:string;created:string;lines:Line[]};
type Section="checkout"|"documents"|"customers"|"inventory"|"dispatch"|"cashoffice"|"reports"|"settings";
type Dialog="tender"|"quote"|"quoteSuccess"|"order"|"layby"|"delivery"|"return"|"discount"|"drawer"|"receipt"|null;
type CashQuote={number:string;branch:string;customer_name:string;customer_contact:string;notes:string;submitted_by_name:string;created_at:string;status:string;net_cents:number;vat_cents:number;total_cents:number;received_at:string|null;lines:{product_id:number;name:string;code:string;quantity:number;price_cents:number;line_total_cents:number}[]};
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

export default function TillCheckout({username,role,stores,accessScope=""}:{username:string;role:string;stores:string[];accessScope?:string}) {
  const [branch,setBranch]=useState(stores[0]??"");
  const [section,setSection]=useState<Section>("checkout");
  // Checkout defaults to the labelled wide workstation; a standard-width view is available.
  const [fullView,setFullView]=useState(true);
  const [search,setSearch]=useState("");
  const [products,setProducts]=useState<Product[]>([]);
  const [lines,setLines]=useState<Line[]>([]);
  // Quotes, sales orders and lay-by calculations must not alter the active checkout basket.
  const [documentLines,setDocumentLines]=useState<Line[]>([]);
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
  const [customerName,setCustomerName]=useState("Walk-in customer");
  const [customerContact,setCustomerContact]=useState("");
  const [quoteNotes,setQuoteNotes]=useState("");
  const [sendingQuote,setSendingQuote]=useState(false);
  const quoteRequestId=useRef("");
  const [sentQuote,setSentQuote]=useState<CashQuote|null>(null);
  const [cashQuotes,setCashQuotes]=useState<CashQuote[]>([]);
  const [cashQuoteSearch,setCashQuoteSearch]=useState("");
  const [cashOfficeTender,setCashOfficeTender]=useState<"Cash"|"Card">("Cash");
  const [cashOfficeCash,setCashOfficeCash]=useState("");
  const [cashOfficeCardReference,setCashOfficeCardReference]=useState("");
  const [cashQueueBusy,setCashQueueBusy]=useState(false);
  const [cashQueueError,setCashQueueError]=useState("");
  const [selectedCashQuote,setSelectedCashQuote]=useState<string|null>(null);
  const [reviewBusy,setReviewBusy]=useState(false);
  const [clock,setClock]=useState("");
  const [deliveryMethod,setDeliveryMethod]=useState<"Collection"|"Delivery">("Collection");
  const [drawerCount,setDrawerCount]=useState("");
  const [receiptMode,setReceiptMode]=useState<"Quote"|"Basket">("Basket");
  const [stockTerm,setStockTerm]=useState("");
  const [stockResults,setStockResults]=useState<Product[]>([]);
  // Scoped, paginated product browser for quotation/order/lay-by drafts.
  const [pickerSearch,setPickerSearch]=useState("");
  const [pickerCategory,setPickerCategory]=useState("");
  const [pickerCategories,setPickerCategories]=useState<string[]>([]);
  const [pickerProducts,setPickerProducts]=useState<Product[]>([]);
  const [pickerPage,setPickerPage]=useState(1);
  const [pickerHasMore,setPickerHasMore]=useState(false);
  const [pickerBusy,setPickerBusy]=useState(false);
  const [pickerError,setPickerError]=useState("");
  const pickerRequest=useRef<AbortController|null>(null);
  const pickerTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const activeSaleLinesRef=useRef<Line[]>([]);
  const focus=useRef<HTMLInputElement>(null);
  const activeRequest=useRef<AbortController|null>(null);
  const nextId=useRef(1);
  const totals=useMemo(()=>basketTotals(lines),[lines]);
  const documentTotals=useMemo(()=>basketTotals(documentLines),[documentLines]);
  const tender=useMemo(()=>tenderPreview(totals.gross,{cash,card,eft}),[totals.gross,cash,card,eft]);
  const deposit=quoteDeposit(documentTotals.gross,Number(depositPercent));
  const isTillOnly=role==="Sales / Tills";
  const cashOfficeAccess=["Owner / Admin","Developer / Technical Admin","Store Manager","Regional Manager"].includes(role)||(role==="Executive / EXCO"&&accessScope==="Full company");
  const isBuster=/buster\s*build/i.test(branch);
  const selectedDocs=drafts.filter(d=>d.branch===branch);
  const invalidTender=[cash,card,eft].some(value=>value.trim()!==""&&parseZarCents(value)===null);

  const fetchPicker=useCallback(async(branchName:string,term:string,category:string,page:number)=>{
    pickerRequest.current?.abort();
    const controller=new AbortController();
    pickerRequest.current=controller;
    setPickerBusy(true);setPickerError("");
    try {
      const params=new URLSearchParams({mode:"browse",branch:branchName,q:term.trim(),category,page:String(page)});
      const res=await fetch(`/api/tills/catalogue?${params.toString()}`,{cache:"no-store",signal:controller.signal});
      const payload=await res.json();
      if(controller.signal.aborted)return;
      if(!res.ok)throw new Error(payload.error??"Unable to open the product catalogue.");
      setPickerProducts(Array.isArray(payload.products)?payload.products:[]);
      setPickerHasMore(payload.hasMore===true);
      setPickerPage(page);
    }catch(err){
      if(!controller.signal.aborted){setPickerError(err instanceof Error?err.message:"Product list unavailable.");setPickerProducts([]);setPickerHasMore(false);}
    }finally{if(!controller.signal.aborted)setPickerBusy(false);}
  },[]);
  const fetchCategories=useCallback(async(branchName:string)=>{
    try {
      const params=new URLSearchParams({mode:"categories",branch:branchName});
      const res=await fetch(`/api/tills/catalogue?${params.toString()}`,{cache:"no-store"});
      if(!res.ok)return;
      const payload=await res.json();
      setPickerCategories(Array.isArray(payload.categories)?payload.categories.filter((c:unknown):c is string=>typeof c==="string"):[]);
    }catch{setPickerCategories([]);}
  },[]);
  const pickerMode=modal==="quote"||modal==="order"||modal==="layby";
  useEffect(()=>{
    if(!modal)return;
    const previous=document.body.style.overflow;
    document.body.style.overflow="hidden";
    return()=>{document.body.style.overflow=previous;};
  },[modal]);
  useEffect(()=>{
    if(!pickerMode)return;
    // Schedule network work after opening; never update React state synchronously in an effect.
    const kickoff=window.setTimeout(()=>{void fetchPicker(branch,"","",1);void fetchCategories(branch);},0);
    return()=>window.clearTimeout(kickoff);
  },[pickerMode,branch,fetchPicker,fetchCategories]);
  const pickerSearchChange=(value:string)=>{
    setPickerSearch(value);setPickerPage(1);setPickerProducts([]);
    pickerRequest.current?.abort();
    if(pickerTimer.current)window.clearTimeout(pickerTimer.current);
    pickerTimer.current=window.setTimeout(()=>{void fetchPicker(branch,value,pickerCategory,1);},280);
  };
  const pickerCategoryChange=(value:string)=>{
    if(pickerTimer.current)window.clearTimeout(pickerTimer.current);
    setPickerCategory(value);setPickerPage(1);
    void fetchPicker(branch,pickerSearch,value,1);
  };
  const pickerGoto=(page:number)=>{
    if(page<1||pickerBusy)return;
    if(pickerTimer.current)window.clearTimeout(pickerTimer.current);
    void fetchPicker(branch,pickerSearch,pickerCategory,page);
  };
  const pickerChangeQty=(id:number,value:unknown)=>{
    const next=safeQty(value);
    if(next!==null)setDocumentLines(previous=>previous.map(line=>line.product.id===id?{...line,quantity:next}:line));
  };
  const pickerAdd=(product:Product)=>{
    if(!Number.isSafeInteger(product.price_cents)||product.price_cents<=0)return;
    setDocumentLines(previous=>{
      const existing=previous.find(line=>line.product.id===product.id);
      return existing?previous.map(line=>line.product.id===product.id?{...line,quantity:Math.min(9999,Math.round((line.quantity+1)*1000)/1000)}:line):[...previous,{product,quantity:1}];
    });
  };

  const sendQuote=async()=>{
    if(sendingQuote||!documentLines.length)return;
    if(!quoteRequestId.current)quoteRequestId.current=crypto.randomUUID();
    setSendingQuote(true);setError("");
    try{
      const response=await fetch("/api/tills/quotes",{method:"POST",headers:{"content-type":"application/json"},
        body:JSON.stringify({request_id:quoteRequestId.current,branch,customer_name:customerName,
          customer_contact:customerContact,notes:quoteNotes,
          lines:documentLines.map(line=>({product_id:line.product.id,quantity:line.quantity,expected_price_cents:line.product.price_cents}))})});
      const data=await response.json();
      if(!response.ok)throw Error(data.error||"Quotation could not reach Cash Office.");
      setSentQuote(data.quotation as CashQuote);
      quoteRequestId.current="";
      setModal("quoteSuccess");
      setDocumentNo(n=>n+1);
      setNotice(`Quotation ${data.quotation.number} has been sent to the ${branch} Cash Office queue. No payment was taken.`);
    }catch(err){setError(err instanceof Error?err.message:"Unable to send quotation. Retry without closing this form.");}
    finally{setSendingQuote(false);}
  };
  const printNumberedQuotation=()=>{
    if(!sentQuote)return;
    const popup=window.open("","_blank","width=810,height=850");
    if(!popup){setNotice("Allow pop-ups to print the numbered quotation.");return;}
    const doc=popup.document;
    doc.title=`Quotation ${sentQuote.number}`;
    const style=doc.createElement("style");
    style.textContent="body{font:15px Arial,sans-serif;margin:28px;color:#17324b}h1{font-size:28px;margin-bottom:6px}.muted{color:#607b8f}table{width:100%;border-collapse:collapse;margin:24px 0}td,th{border-bottom:1px solid #dce5eb;padding:10px;text-align:left}td:last-child,th:last-child{text-align:right}.total{font-size:22px;font-weight:700;text-align:right}.warning{padding:12px;background:#fff5e5;border-left:4px solid #ca921b}button{padding:10px 20px}@media print{button{display:none}}";
    doc.head.appendChild(style);
    const el=(tag:string,value:string,parent:HTMLElement,cl?:string)=>{const child=doc.createElement(tag);child.textContent=value;if(cl)child.className=cl;parent.appendChild(child);return child;};
    const root=doc.createElement("main");doc.body.appendChild(root);
    el("h1",`QUOTATION ${sentQuote.number}`,root);
    el("p",`MALIKS RETAILOS · ${sentQuote.branch}`,root,"muted");
    el("p",`Customer: ${sentQuote.customer_name}`,root);
    if(sentQuote.customer_contact)el("p",`Contact: ${sentQuote.customer_contact}`,root);
    el("p",`Issued: ${new Date(sentQuote.created_at).toLocaleString("en-ZA")}`,root);
    const table=doc.createElement("table");root.appendChild(table);
    const header=doc.createElement("tr");table.appendChild(header);
    for(const text of ["Item","Qty","Amount"]){el("th",text,header);}
    for(const line of sentQuote.lines){const tr=doc.createElement("tr");table.appendChild(tr);el("td",`${line.name} (${line.code})`,tr);el("td",String(line.quantity),tr);el("td",money(line.line_total_cents),tr);}
    el("p",`VAT included: ${money(sentQuote.vat_cents)}`,root,"total");
    el("p",`TOTAL: ${money(sentQuote.total_cents)}`,root,"total");
    el("p","UNPAID QUOTATION — PRESENT THIS NUMBER AT CASH OFFICE. NOT AN INVOICE OR RECEIPT.",root,"warning");
    const button=el("button","Print quotation",root);button.onclick=()=>popup.print();
    popup.focus();
  };
  const fetchCashQueue=useCallback(async(branchName:string,q:string)=>{
    setCashQueueBusy(true);setCashQueueError("");
    try{
      const response=await fetch(`/api/tills/quotes?${new URLSearchParams({branch:branchName,q})}`,{cache:"no-store"});
      const payload=await response.json();
      if(!response.ok)throw Error(payload.error||"Unable to open Cash Office queue.");
      setCashQuotes(Array.isArray(payload.quotations)?payload.quotations:[]);
    }catch(err){setCashQueueError(err instanceof Error?err.message:"Queue unavailable.");setCashQuotes([]);}
    finally{setCashQueueBusy(false);}
  },[]);
  useEffect(()=>{
    if(section!=="cashoffice"||!cashOfficeAccess)return;
    const token=window.setTimeout(()=>{void fetchCashQueue(branch,"");},0);
    return()=>window.clearTimeout(token);
  },[section,branch,cashOfficeAccess,fetchCashQueue]);
  const reviewCashQuote=async(number:string)=>{
    if(reviewBusy||!cashOfficeAccess)return;
    setReviewBusy(true);setCashQueueError("");
    try{
      const response=await fetch("/api/tills/quotes",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({number,branch})});
      const payload=await response.json();
      if(!response.ok)throw Error(payload.error||"Unable to mark quotation reviewed.");
      setNotice(`Quotation ${number} marked as reviewed by Cash Office. It has NOT been paid or invoiced.`);
      await fetchCashQueue(branch,cashQuoteSearch);
    }catch(err){setCashQueueError(err instanceof Error?err.message:"Unable to update quotation.");}
    finally{setReviewBusy(false);}
  };
  useEffect(()=>{activeSaleLinesRef.current=lines;},[lines]);
  useEffect(()=>{
    const updateClock=()=>setClock(when());
    const timer=window.setInterval(updateClock,30000);
    const keyboard=(event:KeyboardEvent)=>{
      if(event.key==="F2"){event.preventDefault();setSection("checkout");window.setTimeout(()=>focus.current?.focus(),0);}
      if(event.key==="F4"){event.preventDefault();setSection("documents");}
      if(event.key==="F6"){event.preventDefault();setDocumentLines(activeSaleLinesRef.current.map(line=>({...line})));setPickerSearch("");setPickerCategory("");setModal("quote");}
      if(event.key==="F8"){event.preventDefault();setNotice("Payment is handled exclusively by Cash Office after a quotation is issued.");}
      if(event.key==="Escape")setModal(null);
    };
    window.addEventListener("keydown",keyboard);
    return ()=>{window.clearInterval(timer);window.removeEventListener("keydown",keyboard);activeRequest.current?.abort();pickerRequest.current?.abort();if(pickerTimer.current)window.clearTimeout(pickerTimer.current);};
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
    activeRequest.current?.abort(); activeRequest.current=null;pickerRequest.current?.abort();if(pickerTimer.current)window.clearTimeout(pickerTimer.current);
    quoteRequestId.current="";setCashQuotes([]);setCashQuoteSearch("");setSelectedCashQuote(null);setSentQuote(null);
    setBranch(value);setLines([]);setDocumentLines([]);setProducts([]);setStockResults([]);setPickerProducts([]);setPickerCategories([]);setPickerSearch("");setPickerCategory("");setSearch("");setCash("");setCard("");setEft("");setError("");setNotice("");setModal(null);
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
    if(!lines.length){setError("Add products before parking a draft.");return;}
    const id=`LOCAL-${String(nextId.current++).padStart(3,"0")}`;
    setDrafts(previous=>[{id,kind:"Parked sale",branch,created:when(),lines:lines.map(l=>({...l}))},...previous]);
    setLines([]);setCash("");setCard("");setEft("");setNotice(`Basket ${id} parked for this session only. No stock reserved.`);
  };
  const saveDocument=(kind:"Quotation"|"Sales order")=>{
    if(!documentLines.length){setNotice("Add products before creating a document draft.");setModal(null);return;}
    const id=`DRAFT-${String(nextId.current++).padStart(3,"0")}`;
    setDrafts(previous=>[{id,kind,branch,created:when(),lines:documentLines.map(l=>({...l}))},...previous]);
    setDocumentNo(n=>n+1);setModal(null);setNotice(`${kind} ${id} saved locally for this browser session. It has not been issued or posted.`);
  };
  const restore=(draft:Draft)=>{
    if(lines.length&&!window.confirm("Replace the current basket with this draft?"))return;
    setLines(draft.lines.map(l=>({...l})));setSection("checkout");setModal(null);
    setNotice(`${draft.kind} ${draft.id} loaded into the basket.`);focus.current?.focus();
    if(draft.kind==="Parked sale")setDrafts(previous=>previous.filter(x=>x.id!==draft.id));
  };
  const open=(name:Dialog)=>{if(name==="quote")quoteRequestId.current="";if(name==="quote"||name==="order"||name==="layby"){setDocumentLines(lines.map(line=>({...line})));setPickerSearch("");setPickerCategory("");setPickerProducts([]);setPickerPage(1);setPickerHasMore(false);}setModal(name);setError("");};
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
  const documentTitle=modal==="quote"?"Create quotation · Select products":modal==="quoteSuccess"?"Quotation sent to Cash Office":modal==="order"?"Sales order · Select products":modal==="layby"?"Lay-by · Select products":modal==="delivery"?"Delivery / collection":modal==="return"?"Refund and return request":modal==="discount"?"Discount / price override":modal==="drawer"?"Cash drawer control":modal==="receipt"?"Basket summary":"Payment calculator";
  const previewLines=(receiptMode==="Quote"?documentLines:lines).map(line=>({product:line.product,quantity:line.quantity}));
  const previewTotals=basketTotals(previewLines);
  const isDocumentPrint=modal==="receipt";

  const cataloguePicker=()=> <div className={styles.pickerLayout}>
    <section className={styles.pickerLibrary} aria-label="Branch product catalogue">
      <div className={styles.pickerTools}>
        <div className={styles.pickerSearchControl}>
          <label htmlFor="quote-product-search">Find products</label>
          <input id="quote-product-search" autoComplete="off" value={pickerSearch} onChange={event=>pickerSearchChange(event.target.value)} placeholder="Search name, barcode, SKU or size…" maxLength={100}/>
        </div>
        <div className={styles.pickerCategoryControl}>
          <label htmlFor="quote-product-category">Department</label>
          <select id="quote-product-category" value={pickerCategory} onChange={event=>pickerCategoryChange(event.target.value)}>
            <option value="">All departments</option>
            {pickerCategories.map(category=><option value={category} key={category}>{category}</option>)}
          </select>
        </div>
      </div>
      <div className={styles.pickerResultsHeader}><strong>{pickerSearch.trim()?"Search results":"All catalogue items"}</strong><span>{pickerBusy?"Loading products…":`${pickerProducts.length} on page ${pickerPage}`} · {branch}</span></div>
      {pickerError&&<div className={styles.pickerError} role="alert">{pickerError} <button type="button" onClick={()=>void fetchPicker(branch,pickerSearch,pickerCategory,pickerPage)}>Retry</button></div>}
      <div className={styles.pickerResults} aria-live="polite">
        {!pickerBusy&&!pickerError&&!pickerProducts.length&&<div className={styles.pickerEmpty}>No matching items. Try another search or choose All departments.</div>}
        {pickerBusy&&<div className={styles.pickerEmpty}>Loading the branch product list…</div>}
        {!pickerBusy&&pickerProducts.map(product=>{
          const count=documentLines.find(line=>line.product.id===product.id)?.quantity??0;
          const priced=Number.isSafeInteger(product.price_cents)&&product.price_cents>0;
          return <article className={styles.pickerProduct} key={product.id}>
            <div className={styles.pickerProductMark}><PosGlyph kind="inventory"/></div>
            <div className={styles.pickerProductInfo}><strong>{product.name}</strong><span>{product.code} · {product.category||"Uncategorised"} · {product.unit||"each"}</span></div>
            <div className={styles.pickerProductPrice}>{priced?<strong>{money(product.price_cents)}</strong>:<span className={styles.pickerNoPrice}>Price not published</span>}<small>VAT inclusive</small></div>
            <button className={styles.pickerAdd} type="button" onClick={()=>pickerAdd(product)} disabled={!priced} aria-label={`Add ${product.name} to document`}>{count?`+ Add (${count})`:'＋ Add'}</button>
          </article>;
        })}
      </div>
      <div className={styles.pickerFooter}><span>Active items are listed across pages. Unpriced products must be published before quoting.</span><div><button type="button" disabled={pickerBusy||pickerPage===1} onClick={()=>pickerGoto(pickerPage-1)}>← Previous</button><b>{pickerPage}</b><button type="button" disabled={pickerBusy||!pickerHasMore} onClick={()=>pickerGoto(pickerPage+1)}>Next →</button></div></div>
    </section>
    <section className={styles.pickerSelection} aria-label="Selected products for document">
      <div className={styles.pickerSelectionHead}><span>SELECTED ITEMS</span><strong>{documentLines.length} products</strong></div>
      {documentLines.length===0?<div className={styles.pickerSelectionEmpty}><PosGlyph kind="basket"/><b>Your document is empty</b><p>Press Add beside a product to build your {modal==="quote"?"quotation":modal==="order"?"sales order":"lay-by"}.</p></div>:
        <div className={styles.pickerSelectionRows}>{documentLines.map(line=><div className={styles.pickerSelected} key={line.product.id}>
          <div><strong>{line.product.name}</strong><small>{line.product.code}</small></div>
          <div className={styles.pickerSelectedBottom}><div className={styles.pickerStepper}><button aria-label={`Subtract ${line.product.name}`} type="button" onClick={()=>pickerChangeQty(line.product.id,Math.max(0.001,line.quantity-1))}>−</button><input aria-label={`Document quantity of ${line.product.name}`} type="number" min="0.001" max="9999" step="any" value={line.quantity} onChange={e=>pickerChangeQty(line.product.id,e.target.value)}/><button aria-label={`Add another ${line.product.name}`} type="button" onClick={()=>pickerChangeQty(line.product.id,line.quantity+1)}>+</button></div><strong>{money(Math.round(line.product.price_cents*line.quantity))}</strong><button type="button" aria-label={`Remove ${line.product.name} from document`} className={styles.pickerRemove} onClick={()=>setDocumentLines(previous=>previous.filter(item=>item.product.id!==line.product.id))}>×</button></div>
        </div>)}</div>}
      <div className={styles.pickerSelectionTotals}><div><span>Subtotal excl. VAT</span><strong>{money(documentTotals.net)}</strong></div><div><span>VAT included (15%)</span><strong>{money(documentTotals.vat)}</strong></div><div className={styles.pickerSelectionGrand}><span>Total incl. VAT</span><strong>{money(documentTotals.gross)}</strong></div></div>
    </section>
  </div>;

  return <main className={`${styles.shell} ${isBuster?styles.buster:styles.power} ${section==="checkout"&&fullView?styles.fullView:""}`}>
    <aside className={styles.side} aria-label="POS navigation">
      <div className={styles.logo}><div className={styles.logoMark}><span className={styles.logoMonogram}>M</span><span className={styles.logoSpark}>✦</span></div><div><strong>MALIKS</strong><span>RETAIL OS <i>PRO</i></span></div></div>
      <div className={styles.sideLabel}>YOUR WORKSPACE</div>
      <nav className={styles.nav}>
        {menus.filter(menu=>!isTillOnly||["checkout","documents","inventory"].includes(menu.id)).map(menu=><button type="button" key={menu.id} className={`${styles.navButton} ${section===menu.id?styles.navSelected:""}`} title={menu.name} aria-label={menu.name} onClick={()=>{setSection(menu.id);setError("");}}>
          <span className={styles.navIcon} aria-hidden><PosGlyph kind={menu.icon}/></span><span><strong>{menu.name}</strong><small>{menu.subtitle}</small></span>
        </button>)}
      </nav>
      <div className={styles.sideFooter}><div className={styles.avatar}>{username.slice(0,1).toUpperCase()}</div><div className={styles.sidePerson}><b>{username}</b><span>{role}</span></div><span className={styles.sideStatus}>●</span></div>
    </aside>

    <div className={styles.main}>
      <header className={styles.topbar}>
        <div className={styles.crumb}><span className={styles.crumbMark}>M</span><span>Maliks Group Hub</span><span className={styles.slash}>/</span><strong>Point of Sale</strong></div>
        <div className={styles.topActions}>{section==="checkout"&&<button type="button" className={styles.viewToggle} aria-pressed={fullView} aria-label={fullView?"Switch to standard-width menu":"Switch to wide checkout layout"} title={fullView?"Use standard-width menu":"Use wide checkout layout"} onClick={()=>setFullView(value=>!value)}>{fullView?"☷ Standard view":"⤢ Wide checkout"}</button>}<span className={styles.previewTag} title="NO LIVE SALES — Transaction service not yet activated. Transaction posting has not been activated"><span className={styles.statusDot}/> Checkout setup required</span><span className={styles.clock}>{clock||"Local workstation"}</span>{!isTillOnly&&<span className={styles.returnHub}>{role!=="Sales / Tills"&&<Link href="/">Switch back to Hub</Link>}</span>}<a className={styles.logout} href="/cdn-cgi/access/logout">Sign out</a></div>
      </header>
      <div className={styles.pageBody}>
        <div className={styles.titleBar}><div><div className={styles.eyebrow}>MALIKS RETAILOS <span className={styles.eyebrowLine}/> {isBuster?"BUSTER BUILD":"POWERBUILD"}</div><h1>{menus.find(x=>x.id===section)?.name}</h1><p>A faster, smarter counter for hardware, trade and everyday retail.</p><div className={styles.heroTags}><span><PosGlyph kind="scan"/> Barcode-ready workspace</span><span><PosGlyph kind="customers"/> Branch-aware pricing</span></div></div><div className={styles.branchWidget}><label htmlFor="branch">ACTIVE BRANCH</label><select id="branch" value={branch} onChange={e=>changeBranch(e.target.value)}>{stores.map(s=><option key={s} value={s}>{s}</option>)}</select><span>Operator: {username} <span className={styles.branchSeparator}>•</span> Shift not opened</span></div></div>
        <div className={styles.alert} role="status"><span className={styles.alertIcon}><PosGlyph kind="lock"/></span><p><strong>Checkout connection pending.</strong> Product lookup and quotation handover are available. Live payments, tax invoices, inventory movements and financial posting are disabled until the transaction service is verified.</p><span className={styles.alertState}>TRANSACTIONS LOCKED</span></div>
        {notice&&<div role="status" className={styles.notice}><span>✓</span><p>{notice}</p><button type="button" aria-label="Dismiss message" onClick={()=>setNotice("")}>×</button></div>}
        {error&&<div role="alert" className={styles.error}><span>!</span><p>{error}</p><button type="button" aria-label="Dismiss error" onClick={()=>setError("")}>×</button></div>}
        {section==="checkout"&&<>
          <section className={styles.salesStage} aria-label="Active counter overview">
            <div className={styles.salesStageHeading}>
              <div className={styles.salesStageIcon}><PosGlyph kind="checkout"/></div>
              <div><span className={styles.salesStageEyebrow}>ACTIVE COUNTER · {branch}</span><h2>{isTillOnly?"New customer quotation":"New customer sale"}</h2><p>Scan items, prepare documents and review the amount due.</p></div>
            </div>
            <div className={styles.saleMetrics} aria-label="Current draft summary">
              <div className={styles.saleMetric}><span>PRODUCTS</span><strong>{totals.items}</strong><small>{Number(totals.units.toFixed(3))} units</small></div>
              <div className={styles.saleMetric}><span>AMOUNT DUE</span><strong>{money(totals.gross)}</strong><small>VAT inclusive</small></div>
              <div className={styles.saleMetric}><span>OPEN DRAFTS</span><strong>{selectedDocs.length}</strong><small>Current session</small></div>
            </div>
          </section>
          <div className={styles.checkoutGrid}>
            <div className={styles.workCol}>
              <section className={styles.panel}>
                <div className={styles.panelHead}><div><span className={styles.eyebrow}>01 / PRODUCT ENTRY</span><h2>Find an item fast</h2></div>{pill("Branch price book")}</div>
                <form className={styles.searchForm} onSubmit={e=>{e.preventDefault();void searchProducts();}}>
                  <span className={styles.scanGlyph}><PosGlyph kind="scan"/></span><input ref={focus} autoFocus placeholder="Scan barcode / enter product code / search name…" value={search} onChange={e=>setSearch(e.target.value)} aria-label="Product code or product name" autoComplete="off" maxLength={100}/><kbd>F2</kbd><button type="submit" disabled={busy||!search.trim()}>{busy?"Searching…":"Find item"}</button>
                </form>
                <div className={styles.catalogueInfo}><span><span className={styles.infoDot}/> Published branch prices</span><span>Barcode, SKU or description</span><span>Stock balances not connected</span></div>
                {!!products.length&&<div className={styles.searchResults}>{products.map(p=><button type="button" key={p.id} onClick={()=>add(p)}><span className={styles.productTile}>{p.category.slice(0,2).toUpperCase()}</span><span className={styles.productName}><strong>{p.name}</strong><small>{p.code} · {p.category}</small></span><b>{money(p.price_cents)}</b><span className={styles.addGlyph}>＋</span></button>)}</div>}
              </section>
              <section className={styles.quickActionPanel} aria-label="Fast sale actions">
                <div className={styles.quickActionTitle}><div><span className={styles.eyebrow}>FAST ACTIONS</span><h2>What would you like to do?</h2></div><span>F4 Drafts · F6 Quotation · Payment at Cash Office</span></div>
                <div className={styles.actionRow}>
                  <button type="button" onClick={park}><span><PosGlyph kind="park"/></span><strong>Park sale</strong><small>Save current basket</small></button>
                  <button type="button" onClick={()=>setSection("documents")}><span><PosGlyph kind="retrieve"/></span><strong>Retrieve</strong><small>{selectedDocs.length} drafts</small></button>
                  <button type="button" onClick={()=>open("quote")}><span><PosGlyph kind="quote"/></span><strong>Quotation</strong><small>Send to Cash Office</small></button>
                  {!isTillOnly&&<button type="button" onClick={()=>open("order")}><span><PosGlyph kind="order"/></span><strong>Sales order</strong><small>Create draft</small></button>}
                  {!isTillOnly&&<button type="button" onClick={()=>open("layby")}><span><PosGlyph kind="layby"/></span><strong>Lay-by</strong><small>Deposit estimator</small></button>}
                  {!isTillOnly&&<button type="button" onClick={()=>open("return")}><span><PosGlyph kind="return"/></span><strong>Refund / return</strong><small>Supervisor control</small></button>}
                </div>
              </section>
              <section className={styles.panel}>
                <div className={styles.panelHead}><div><span className={styles.eyebrow}>02 / ITEMS SELECTED</span><h2>Current basket <span className={styles.itemCount}>{lines.length} lines</span></h2></div><div className={styles.inlineActions}><button type="button" onClick={()=>open("discount")}>% Discounts</button><button type="button" onClick={clear} disabled={!lines.length}>Clear all</button></div></div>
                <div className={styles.customerRow}><div className={styles.customerAvatar}>♙</div><div><b>Walk-in customer</b><small>Cash sale · Trade account lookup not yet connected</small></div>{!isTillOnly&&<button type="button" onClick={()=>setSection("customers")}>Customer options ↗</button>}</div>
                {lines.length===0?<div className={styles.emptyBasket}><div className={styles.bagIcon}><PosGlyph kind="basket"/></div><strong>Ready for the first scan</strong><p>Start by scanning a barcode or searching the product catalogue above.</p><span>F2 Search · F6 Quote · F8 Payment at Cash Office</span></div>:<div className={styles.basketScroll}><table className={styles.cartTable}><thead><tr><th>PRODUCT</th><th>QTY</th><th>UNIT PRICE</th><th>TOTAL</th><th aria-label="Remove"/></tr></thead><tbody>{lines.map((line)=>
                  <tr key={line.product.id}><td><strong>{line.product.name}</strong><small>{line.product.code} · {line.product.unit||"each"}</small></td><td><div className={styles.qtyBox}><button aria-label={`Reduce quantity of ${line.product.name}`} type="button" onClick={()=>changeQty(line.product.id,Math.max(0.001,line.quantity-1))}>−</button><input aria-label={`Quantity of ${line.product.name}`} type="number" min="0.001" max="9999" step="any" value={line.quantity} onChange={e=>changeQty(line.product.id,e.target.value)} /><button aria-label={`Increase quantity of ${line.product.name}`} type="button" onClick={()=>changeQty(line.product.id,line.quantity+1)}>+</button></div></td><td>{money(line.product.price_cents)}</td><td className={styles.lineAmount}>{money(Math.round(line.product.price_cents*line.quantity))}</td><td><button className={styles.removeItem} type="button" aria-label={`Remove ${line.product.name}`} onClick={()=>setLines(prev=>prev.filter(x=>x.product.id!==line.product.id))}>×</button></td></tr>
                )}</tbody></table></div>}
                <footer className={styles.cartFoot}><span>Item prices include VAT, subject to branch catalogue publishing.</span><button type="button" onClick={()=>open("delivery")}>↗ Add delivery / collection details</button></footer>
              </section>
            </div>
            <aside className={styles.summaryCol}>
              <section className={`${styles.panel} ${styles.totalsPanel}`} aria-label="Quotation totals — no payment collection">
                <div className={styles.panelHead}><div><span className={styles.eyebrow}>03 / SALES QUOTATION</span><h2>Quotation summary</h2></div><span className={styles.draftTag}>UNPAID</span></div>
                <div className={styles.totalsLines}>
                  <div><span>Subtotal (excl. VAT)</span><strong>{money(totals.net)}</strong></div>
                  <div><span>VAT 15% (included)</span><strong>{money(totals.vat)}</strong></div>
                  <div><span>Products</span><strong>{totals.items}</strong></div>
                </div>
                <div className={styles.grand}><span>QUOTE TOTAL <small>VAT inclusive</small></span><strong>{money(totals.gross)}</strong></div>
                <div className={styles.handoverNotice}><strong>Sales does not take payment.</strong><p>Build the quotation, send it to Cash Office and print the numbered quotation for the customer. The cashier collects and confirms payment separately.</p></div>
                <button className={styles.payPrimary} type="button" onClick={()=>open("quote")}><PosGlyph kind="quote"/> Create quotation for Cash Office</button>
                <div className={styles.safeNote}><PosGlyph kind="lock"/> No cash, card, EFT, invoice or stock-release action is available on the Sales screen.</div>
              </section>
              <section className={styles.panel}><div className={styles.panelHead}><div><span className={styles.eyebrow}>QUICK TOOLS</span><h2>Sale assistance</h2></div></div><div className={styles.sideTools}><button type="button" onClick={receipt}>▤ <span>Print basket summary</span> ↗</button><button type="button" onClick={()=>setSection("inventory")}>▦ <span>Price / stock enquiry</span> ↗</button>{cashOfficeAccess&&<button type="button" onClick={()=>setSection("cashoffice")}>◷ <span>Cash Office quotation queue</span> ↗</button>}</div></section>
            </aside>
          </div>
        </>}
        {section==="documents"&&<section className={styles.panel}><div className={styles.panelHead}><div><span className={styles.eyebrow}>TRANSACTIONS</span><h2>Parked sales & document drafts</h2></div>{pill("This browser session only")}</div><div className={styles.sectionIntro}>Parked baskets, quotations and sales orders are held only in this browser session. They are not issued documents and cannot reserve stock or create customer debt.</div><div className={styles.docTools}><button onClick={()=>setSection("checkout")} type="button">＋ New sale</button><button onClick={()=>open("quote")} type="button">▧ Quote current basket</button><button onClick={()=>open("order")} type="button">▤ Sales order draft</button><button onClick={()=>open("layby")} type="button">◉ Lay-by estimate</button></div>{selectedDocs.length? <div className={styles.draftList}>{selectedDocs.map(d=>{const sum=basketTotals(d.lines);return <article key={d.id}><span className={styles.docIcon}>▤</span><div><b>{d.kind} · {d.id}</b><small>{d.created} · {d.lines.length} lines · {d.branch}</small></div><strong>{money(sum.gross)}</strong><button type="button" onClick={()=>restore(d)}>Load basket</button><button type="button" aria-label={`Delete ${d.id}`} onClick={()=>setDrafts(old=>old.filter(x=>x.id!==d.id))}>×</button></article>;})}</div>:<div className={styles.emptyBasket}><div className={styles.bagIcon}>▧</div><strong>No parked or draft documents yet</strong><p>Park an active sale or save a quotation draft from the checkout screen.</p></div>}</section>}
        {section==="inventory"&&<section className={styles.panel}><div className={styles.panelHead}><div><span className={styles.eyebrow}>PRODUCT CONTROL</span><h2>Price and product enquiry</h2></div>{pill("Published price book")}</div><div className={styles.sectionIntro}>Search your branch&apos;s published product prices. Physical available quantity, reorder levels, warehouse bins and serial numbers require the stock ledger integration.</div><form className={styles.searchForm} onSubmit={e=>{e.preventDefault();void searchProducts(stockTerm,true);}}><span className={styles.scanGlyph}><PosGlyph kind="scan"/></span><input placeholder="Code or product description" aria-label="Stock product search" value={stockTerm} onChange={e=>setStockTerm(e.target.value)}/><button type="submit" disabled={busy||!stockTerm.trim()}>Search</button></form><div className={styles.stockList}>{stockResults.map(p=><div key={p.id}><span className={styles.productTile}>{p.category.slice(0,2).toUpperCase()}</span><div><b>{p.name}</b><small>{p.code} · {p.category} · {p.unit}</small></div><strong>{money(p.price_cents)}</strong><span className={styles.pending}>Stock qty unavailable</span><button type="button" onClick={()=>{add(p);setSection("checkout");}}>Add to draft</button></div>)}</div></section>}
        {section!=="checkout"&&section!=="documents"&&section!=="inventory"&&<><div className={styles.workspaceIntro}><div><span className={styles.eyebrow}>BACK OFFICE / MODULES</span><h2>{menus.find(x=>x.id===section)?.name}</h2><p>Designed for the Hub&apos;s role- and branch-controlled workflow. These operations need a secure RetailOS API before activation.</p></div><span className={styles.previewTag}>INTEGRATION PENDING</span></div><div className={styles.featureGrid}>{featureGroups[section].map(renderFeatureCard)}</div>{section==="cashoffice"&&cashOfficeAccess&&<section className={styles.panel}>
          <div className={styles.panelHead}><div><span className={styles.eyebrow}>QUOTE HANDOVER / CASH OFFICE</span><h2>Incoming quotations</h2></div><span className={styles.smallPill}>{cashQuotes.filter(item=>item.status==="AWAITING_CASH_OFFICE").length} awaiting review</span></div>
          <p className={styles.sectionIntro}>Submitted quotations arrive here with a permanent reference. Reviewing a quotation does not take payment, invoice the customer or deduct stock.</p>
          <form className={styles.cashQueueSearch} onSubmit={event=>{event.preventDefault();void fetchCashQueue(branch,cashQuoteSearch);}}><input aria-label="Find quotation number or customer" placeholder="Quotation number e.g. Q-00000001 or customer name" value={cashQuoteSearch} onChange={event=>setCashQuoteSearch(event.target.value)}/><button type="submit" disabled={cashQueueBusy}>Search</button><button type="button" onClick={()=>{setCashQuoteSearch("");void fetchCashQueue(branch,"");}}>Refresh</button></form>
          {cashQueueError&&<p role="alert" className={styles.warningText}>{cashQueueError}</p>}
          {cashQueueBusy&&<p className={styles.sectionIntro}>Loading the Cash Office queue…</p>}
          {!cashQueueBusy&&!cashQuotes.length&&!cashQueueError&&<p className={styles.sectionIntro}>No quotations found for this branch.</p>}
          <div className={styles.cashQueueList}>{cashQuotes.map(item=><article key={item.number} className={styles.cashQueueCard}>
            <button type="button" className={styles.cashQueueRow} onClick={()=>setSelectedCashQuote(current=>current===item.number?null:item.number)}><span><strong>{item.number}</strong><small>{item.customer_name} · {item.submitted_by_name} · {new Date(item.created_at).toLocaleString("en-ZA")}</small></span><b>{money(item.total_cents)}</b><em>{item.status==="AWAITING_CASH_OFFICE"?"Awaiting Cash Office":"Reviewed"}</em></button>
            {selectedCashQuote===item.number&&<div className={styles.cashQueueDetails}><div><b>Customer:</b> {item.customer_name}{item.customer_contact?` · ${item.customer_contact}`:""}</div>{item.notes&&<div><b>Notes:</b> {item.notes}</div>}
              <div className={styles.cashQueueItems}>{item.lines.map(line=><div key={line.product_id}><span>{line.quantity} × {line.name}<small>{line.code}</small></span><b>{money(line.line_total_cents)}</b></div>)}</div>
              <div className={styles.cashQueueTotal}><span>VAT included {money(item.vat_cents)}</span><strong>Total: {money(item.total_cents)}</strong></div>
              <div className={styles.paymentCapture} aria-label="Cash Office payment method">
                <span className={styles.eyebrow}>02 / CASH OFFICE TENDER</span>
                <div className={styles.paymentSelector}>
                  <button type="button" aria-pressed={cashOfficeTender==="Cash"} onClick={()=>setCashOfficeTender("Cash")}>Cash</button>
                  <button type="button" aria-pressed={cashOfficeTender==="Card"} onClick={()=>setCashOfficeTender("Card")}>Card</button>
                </div>
                {cashOfficeTender==="Cash"?<label>Cash handed over (R)<input inputMode="decimal" placeholder="Amount received" value={cashOfficeCash} onChange={event=>setCashOfficeCash(event.target.value)} /></label>:
                  <label>Approved terminal reference<input placeholder="Bank/terminal approval reference" value={cashOfficeCardReference} onChange={event=>setCashOfficeCardReference(event.target.value)}/></label>}
                {cashOfficeTender==="Cash"&&parseZarCents(cashOfficeCash)!==null&&<p>Change calculation: {money(Math.max(0,(parseZarCents(cashOfficeCash)??0)-item.total_cents))}</p>}
                <div className={styles.handoverNotice}><strong>Finalise payment / issue invoice</strong><p>Requires authenticated cashier shift, payment verification, invoice numbering and accounting posting. This button remains disabled until those services are connected. No PAID invoice is issued from this preview.</p></div>
                <button type="button" disabled className={styles.modalDisabled}>Confirm payment and print paid invoice — setup required</button>
              </div>
              <div className={styles.cashQueueActions}>{item.status==="AWAITING_CASH_OFFICE"?<button type="button" disabled={reviewBusy} onClick={()=>void reviewCashQuote(item.number)}>Mark received / reviewed</button>:<span>Received by Cash Office · No payment processed</span>}</div>
            </div>}
          </article>)}</div>
        </section>}
        {section==="dispatch"&&<section className={styles.panel} aria-label="Dispatch paid invoice queue"><div className={styles.panelHead}><div><span className={styles.eyebrow}>DISPATCH / PICKING</span><h2>Paid invoices ready for picking</h2></div></div><p className={styles.sectionIntro}>Only posted and payment-verified invoices may appear here. A quotation, a Cash Office review, or a pending card transaction must never release stock.</p><div className={styles.handoverNotice}><strong>Awaiting invoice posting integration</strong><p>The verified invoice feed, printing of picking slips, picking and checking signatures, and stock movements are not connected. No unpaid quotation is shown as ready for dispatch.</p></div></section>}
        {section==="cashoffice"&&<section className={styles.panel}><div className={styles.panelHead}><div><span className={styles.eyebrow}>CASH COUNT CALCULATOR</span><h2>Cash count preview</h2></div></div><label className={styles.fieldLabel} htmlFor="drawerCount">Physical cash amount (ZAR)</label><div className={styles.moneyEntry}><span>R</span><input id="drawerCount" value={drawerCount} onChange={e=>setDrawerCount(e.target.value)} placeholder="0.00" inputMode="decimal"/></div><p className={styles.sectionIntro}>Entered: {money(parseZarCents(drawerCount)??0)}. This is not recorded as a shift or cash-up declaration. No expected amount is exposed.</p></section>}</>}
        <footer className={styles.bottom}><span><b>Maliks RetailOS</b> · Sales & tills workstation</span><span>Published Hub catalogue · Transaction service inactive · {documentNo} local document action(s)</span></footer>
      </div>
    </div>
    {modal&&createPortal(<div className={`${styles.scrim} ${isBuster?styles.buster:styles.power}`} role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setModal(null);}}><section className={`${styles.dialog} ${pickerMode?styles.catalogueDialog:""}`} role="dialog" aria-modal="true" aria-label={documentTitle}><div className={styles.dialogHeader}><div><span className={styles.eyebrow}>MALIKS RETAILOS · CONTROLLED WORKFLOW</span><h2>{documentTitle}</h2></div><button type="button" aria-label="Close dialog" onClick={()=>setModal(null)}>×</button></div><div className={styles.dialogBody}>
      {pickerMode&&<div className={styles.pickerWorkflow} aria-label="Document workflow"><span className={styles.pickerWorkflowCurrent}><b>01</b> Select items</span><span><b>02</b> Customer & details</span><span><b>03</b> {modal==="quote"?"Send to Cash Office":"Save draft"}</span></div>}
      
      {(modal==="quote"||modal==="order")&&<><p className={styles.pickerIntro}>{modal==="quote"?"Select products from your branch catalogue, then add the customer details and send the quotation to Cash Office.":"Choose the products and quantities for the sales-order draft."}</p>{cataloguePicker()}{modal==="quote"&&<div className={styles.quoteCustomerGrid}>
        <label>Customer name<input maxLength={120} value={customerName} onChange={event=>setCustomerName(event.target.value)} placeholder="Customer / company name" /></label>
        <label>Contact number / reference<input maxLength={80} value={customerContact} onChange={event=>setCustomerContact(event.target.value)} placeholder="Optional contact number" /></label>
        <label className={styles.quoteNotes}>Notes for Cash Office<textarea maxLength={400} rows={2} value={quoteNotes} onChange={event=>setQuoteNotes(event.target.value)} placeholder="Collection / delivery note (optional)"/></label>
      </div>}
      <div className={styles.pickerActions}><span>{documentLines.length?`${documentLines.length} products selected · ${money(documentTotals.gross)}`:"Select products to begin"}</span>{modal==="quote"?<>
        <button type="button" onClick={()=>void sendQuote()} disabled={sendingQuote||!documentLines.length||!customerName.trim()}>{sendingQuote?"Sending…":"Send quotation to Cash Office →"}</button>
        <button type="button" className={styles.ghostBtn} disabled={sendingQuote||!documentLines.length} onClick={()=>saveDocument("Quotation")}>Save local draft</button>
      </>:<button type="button" disabled={!documentLines.length} onClick={()=>saveDocument("Sales order")}>Save sales order draft</button>}
      <button type="button" className={styles.ghostBtn} onClick={()=>{setReceiptMode("Quote");setModal("receipt");}} disabled={!documentLines.length}>Print unissued summary</button></div></>}
      {modal==="quoteSuccess"&&sentQuote&&<div className={styles.quoteSuccess}><div className={styles.quoteSuccessIcon}>✓</div><span>Sent to {sentQuote.branch} Cash Office</span><strong>{sentQuote.number}</strong><p>Customer: {sentQuote.customer_name} · {money(sentQuote.total_cents)} incl. VAT</p><p>Cash Office can retrieve this number and review the product list. No money or stock has moved.</p><div><button type="button" onClick={()=>{setSentQuote(null);setDocumentLines([]);setCustomerName("Walk-in customer");setCustomerContact("");setQuoteNotes("");open("quote");}}>Create another quotation</button>{cashOfficeAccess&&<button type="button" onClick={()=>{setModal(null);setSection("cashoffice");}}>Open Cash Office queue</button>}<button type="button" onClick={printNumberedQuotation}>Print numbered quotation</button><button type="button" className={styles.ghostBtn} onClick={()=>{setModal(null);setSection("documents");}}>Done</button></div></div>}
      {modal==="layby"&&<><p className={styles.pickerIntro}>Choose the lay-by products first, then calculate a deposit. No payment or stock reservation is created.</p>{cataloguePicker()}<div className={styles.pickerLayby}><label className={styles.fieldLabel} htmlFor="deposit">Deposit percentage <select id="deposit" className={styles.selectFull} value={depositPercent} onChange={e=>setDepositPercent(e.target.value)}><option value="10">10%</option><option value="20">20%</option><option value="25">25%</option><option value="30">30%</option><option value="50">50%</option></select></label><div><span>Estimated deposit</span><strong>{money(deposit?.deposit??0)}</strong></div><div><span>Remaining balance</span><strong>{money(deposit?.balance??0)}</strong></div></div><button type="button" className={styles.modalDisabled} disabled>Create lay-by — account service not connected</button></>}
      {modal==="delivery"&&<><p className={styles.dialogLead}>Choose a fulfilment preference. Dispatch notes, routes, addresses and proof of delivery require the connected back-office service.</p><div className={styles.choiceRow}><button type="button" className={deliveryMethod==="Collection"?styles.activeChoice:""} onClick={()=>setDeliveryMethod("Collection")}>◉ Customer collection</button><button type="button" className={deliveryMethod==="Delivery"?styles.activeChoice:""} onClick={()=>setDeliveryMethod("Delivery")}>↗ Branch delivery</button></div><p className={styles.sectionIntro}>Selected: {deliveryMethod}. This does not create a dispatch note or a delivery commitment.</p><button type="button" className={styles.modalButtonsSingle} onClick={()=>{setNotice(`${deliveryMethod} preference saved to this basket.`);setModal(null);}}>Save preference</button></>}
      {modal==="return"&&<><p className={styles.dialogLead}>A return requires an original invoice, cashier identity, supervisor approval and controlled stock and VAT reversal.</p><div className={styles.lockedFeature}>▣ Locate original transaction — not connected</div><div className={styles.lockedFeature}>✓ Supervisor authorisation — not connected</div><div className={styles.lockedFeature}>↶ Refund / credit note posting — disabled</div></>}
      {modal==="discount"&&<><p className={styles.dialogLead}>Price changes, line discounts and trade terms must be authorised server-side. Only published retail prices are available here; manual price changes are not authorised.</p><div className={styles.lockedFeature}>% Request manager-approved discount — not connected</div><div className={styles.lockedFeature}>▧ Assign account-specific price list — not connected</div></>}
      {modal==="drawer"&&<><p className={styles.dialogLead}>The Epson cash drawer can be opened only by an authorised station after a valid event is audited. Browser access to your printer/drawer has not been configured.</p><div className={styles.lockedFeature}>🔒 Hardware device not commissioned</div><button type="button" className={styles.modalDisabled} disabled>Send drawer pulse — disabled</button></>}
      {isDocumentPrint&&<><p className={styles.dialogLead}>This is an <b>unissued {receiptMode.toLowerCase()} summary</b>, not a tax invoice, cash slip, authorised quote or proof of payment.</p><div className={styles.printSheet} id="maliks-print-sheet"><div className={styles.printHeader}><strong>MALIKS GROUP</strong><span>{branch}</span><small>UNISSUED DOCUMENT — NOT VALID FOR TRADING</small></div><h3>{receiptMode==="Quote"?"QUOTATION DRAFT":"BASKET SUMMARY"}</h3>{previewLines.map(line=><div key={line.product.id} className={styles.printLine}><span>{line.quantity} × {line.product.name}</span><b>{money(Math.round(line.quantity*line.product.price_cents))}</b></div>)}<div className={styles.printTotal}><span>VAT included {money(previewTotals.vat)}</span><strong>{money(previewTotals.gross)}</strong></div><small>UNISSUED / NOT AN INVOICE OR PROOF OF PAYMENT.</small></div><button type="button" className={styles.modalButtonsSingle} onClick={()=>window.print()}>Print unissued summary</button></>}
    </div><div className={styles.dialogFoot}>No transaction posted · Controlled workstation <button type="button" onClick={()=>setModal(null)}>Close</button></div></section></div>,document.body)}
  </main>;
}

// Independent, mobile-first sales quotation Worker. Reuses private Maliks Core.
// No till/payment/dispatch routes and no direct D1 binding are exposed.
import { POWERBUILD_LOGO_BASE64 } from './powerbuild-logo.mjs';
import { LUCIDE_ICON_MARKUP } from './pos-lucide-icons.mjs';
import {QUOTE_ICON_192_BASE64,QUOTE_ICON_512_BASE64,QUOTE_ICON_MASKABLE_512_BASE64,QUOTE_APPLE_TOUCH_ICON_BASE64} from './quote-app-icons.mjs';
import {QUOTE_APP_MANIFEST} from './quote-app-manifest.mjs';
const logoBytes=Uint8Array.from(atob(POWERBUILD_LOGO_BASE64),c=>c.charCodeAt(0));
const iconBytes=Object.freeze({
  '/quote-icon-192.png':Uint8Array.from(atob(QUOTE_ICON_192_BASE64),c=>c.charCodeAt(0)),
  '/quote-icon-512.png':Uint8Array.from(atob(QUOTE_ICON_512_BASE64),c=>c.charCodeAt(0)),
  '/quote-icon-maskable-512.png':Uint8Array.from(atob(QUOTE_ICON_MASKABLE_512_BASE64),c=>c.charCodeAt(0)),
  '/apple-touch-icon.png':Uint8Array.from(atob(QUOTE_APPLE_TOUCH_ICON_BASE64),c=>c.charCodeAt(0)),
});
const ico=(name)=>LUCIDE_ICON_MARKUP[name]||'';
const css=String.raw`
:root{font-family:Inter,system-ui,'Segoe UI',Arial,sans-serif;font-synthesis:none;--navy:#0A2A3F;--gold:#D4A017;--white:#FFFFFF;--grey:#F2F3F5;--line:#DFE3E6;--muted:#64727B;color:var(--navy);background:var(--grey)}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0}button,input,textarea,select{font:inherit}button{cursor:pointer}button:disabled{opacity:.5;cursor:not-allowed}a{color:inherit}button:focus-visible,input:focus-visible,textarea:focus-visible,select:focus-visible{outline:3px solid var(--gold);outline-offset:2px}
header.top{position:sticky;top:0;z-index:20;background:var(--navy);color:var(--white);box-shadow:0 8px 28px rgba(10,42,63,.12)}.top-inner{max-width:1190px;margin:0 auto;min-height:83px;padding:10px 22px;display:flex;align-items:center;gap:16px}.brand{display:flex;align-items:center;gap:13px}.brand img{width:54px;height:54px;object-fit:contain}.brand strong{display:block;font-size:21px;letter-spacing:.04em}.brand strong span{color:var(--gold)}.brand small{display:block;font-size:9px;font-weight:700;letter-spacing:.09em;opacity:.88}.secure{margin-left:auto;font-size:11px;font-weight:800;letter-spacing:.1em;white-space:nowrap;opacity:.88}.secure i{display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--gold);margin-right:8px}.user{font-size:12px;max-width:200px;text-align:right}.app{max-width:1190px;margin:auto;padding:24px 20px 140px}.page-heading{display:flex;align-items:center;justify-content:space-between;gap:18px;margin:0 0 20px}.page-heading h1{font-size:26px;margin:0}.page-heading p{margin:5px 0 0;color:var(--muted);font-size:13px}.panel{background:var(--white);border:1px solid var(--line);border-radius:17px;padding:21px;margin:0 0 17px;box-shadow:0 8px 24px rgba(10,42,63,.045)}h2{margin:0 0 13px;font-size:18px}h3{margin:0 0 10px;font-size:15px}.intro{font-size:13px;color:var(--muted);margin:3px 0 18px;line-height:1.55}.gold-label{font-weight:850;letter-spacing:.11em;font-size:10px;color:var(--gold);text-transform:uppercase}.field{display:grid;gap:7px;margin-bottom:14px}.field label{font-size:12px;font-weight:800}.field input,.field select,.field textarea,input.qr-entry{width:100%;background:var(--white);color:var(--navy);border:1px solid #cfd5d9;border-radius:11px;padding:13px 12px;min-height:48px}.field textarea{resize:vertical;min-height:75px}.btn{min-height:46px;border-radius:11px;border:1px solid var(--gold);background:var(--gold);color:var(--navy);font-weight:850;display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:10px 16px}.btn svg{width:18px;height:18px;stroke:currentColor}.btn.secondary{background:var(--white);color:var(--navy);border-color:var(--line)}.btn.dark{background:var(--navy);color:var(--white);border-color:var(--navy)}.btn.block{width:100%}.btn.small{min-height:35px;font-size:12px;padding:6px 10px}.tabs{display:flex;gap:9px;margin-bottom:16px;flex-wrap:wrap}.tabs .btn{flex:1;min-width:100px}.tabs .active{background:var(--navy);border-color:var(--navy);color:white}.grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(310px,.92fr);gap:18px;align-items:start}.stack{min-width:0}.row{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.row>*{min-width:0}.row .field{flex:1;min-width:160px;margin:0}.row .btn{flex-shrink:0}.notice{background:var(--grey);border-left:4px solid var(--gold);padding:12px;border-radius:9px;font-size:12px;line-height:1.55}.message{padding:13px 15px;background:var(--grey);border:1px solid var(--line);border-left:4px solid var(--gold);border-radius:9px;margin:14px 0;font-size:13px;line-height:1.5;white-space:pre-wrap}.message[hidden]{display:none}.scan-box{background:var(--grey);border:2px dashed var(--gold);border-radius:14px;padding:18px;margin:14px 0}.scan-box .scan-hero{display:flex;align-items:center;gap:13px;margin:0 0 13px}.scan-box .scan-hero svg{width:35px;height:35px;stroke:var(--gold)}.scan-box .scan-hero strong{font-size:15px}.scan-box .scan-hero small{display:block;margin-top:5px;color:var(--muted);font-size:12px}#camera{width:100%;max-height:320px;object-fit:cover;border-radius:10px;background:var(--navy);margin:10px 0}#camera[hidden]{display:none}.search-results{display:grid;gap:8px;max-height:360px;overflow-y:auto}.result{display:flex;align-items:center;justify-content:space-between;gap:10px;border:1px solid var(--line);border-radius:11px;padding:12px}.result .product-title{font-weight:750;font-size:13px;overflow-wrap:anywhere}.result small{display:block;font-size:11px;color:var(--muted);margin-top:4px}.result .money{font-size:14px;font-weight:800;white-space:nowrap}.basket-empty{text-align:center;padding:38px 10px;color:var(--muted);font-size:13px}.basket-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;padding:13px 0;border-bottom:1px solid var(--line)}.basket-row:last-child{border:0}.basket-row strong{font-size:13px}.basket-row small{display:block;margin-top:4px;color:var(--muted);font-size:11px}.qty{display:flex;gap:3px;align-items:center;justify-content:flex-end;margin-top:8px}.qty input{width:69px;height:37px;border:1px solid var(--line);border-radius:7px;text-align:center;color:var(--navy);background:white}.qty .btn{width:37px;min-width:37px;min-height:37px;padding:5px}.amounts{border-top:2px solid var(--line);margin-top:10px}.amount-line{display:flex;align-items:center;justify-content:space-between;gap:15px;padding:8px 0;font-size:13px}.amount-line.total{font-size:22px;font-weight:900;border-top:1px solid var(--line);padding-top:15px}.money{font-variant-numeric:tabular-nums}.two-fields{display:grid;grid-template-columns:1fr 1fr;gap:11px}.customer{margin-top:15px}.screen[hidden],#login[hidden],#workspace[hidden],#print-sheet[hidden]{display:none!important}.history-item{border:1px solid var(--line);border-radius:12px;padding:14px;margin:9px 0}.history-item h3{display:flex;justify-content:space-between;gap:8px}.history-item p{font-size:12px;color:var(--muted);margin:7px 0}.history-item .row{margin-top:10px}.footer-bar{position:fixed;bottom:0;left:0;right:0;padding:12px max(16px,calc((100vw - 1190px)/2));background:var(--white);border-top:1px solid var(--line);box-shadow:0 -8px 30px rgba(10,42,63,.09);z-index:12}.footer-bar .inner{display:flex;align-items:center;gap:14px}.footer-bar b{font-size:19px;white-space:nowrap;margin-right:auto}.footer-bar .btn{min-width:165px}.saved-hero{text-align:center;padding:18px 0}.saved-hero svg{width:44px;height:44px;stroke:var(--gold)}.saved-hero h2{font-size:28px;margin:12px 0 7px}.saved-hero p{color:var(--muted)}.saved-actions{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.saved-actions .btn{min-height:55px}.saved-actions .btn:first-child{grid-column:1/-1}.muted{color:var(--muted);font-size:12px;line-height:1.5}.hide{display:none!important}#print-sheet{display:none}.print-info{font-size:13px;color:var(--muted)}.print-table{border-collapse:collapse;width:100%;font-size:12px;margin:18px 0}.print-table th,.print-table td{border-bottom:1px solid var(--line);text-align:left;padding:9px 4px}.print-table td:last-child,.print-table th:last-child{text-align:right}.print-head{display:flex;align-items:center;justify-content:space-between;gap:20px;border-bottom:3px solid var(--gold);padding-bottom:16px}.print-head img{width:70px;height:70px;object-fit:contain}.print-totals{margin-left:auto;width:260px}.print-totals .amount-line.total{font-size:17px}@media(max-width:850px){.grid{grid-template-columns:1fr}.top-inner{padding:8px 15px;min-height:74px}.user{display:none}.app{padding:17px 13px 135px}.panel{padding:17px}.secure{font-size:10px}.page-heading h1{font-size:23px}}@media(max-width:440px){.two-fields{grid-template-columns:1fr}.top-inner{gap:8px}.brand strong{font-size:19px}.brand img{width:45px;height:45px}.secure{display:none}.footer-bar b{font-size:16px}.footer-bar .btn{min-width:155px}.saved-actions{grid-template-columns:1fr}.saved-actions .btn:first-child{grid-column:auto}}@media print{@page{size:A4 portrait;margin:13mm}html,body{background:#fff!important}.top,.app,.footer-bar,#login{display:none!important}#print-sheet{display:block!important;position:static!important;width:100%;color:#0A2A3F}#print-sheet .print-totals{width:260px}}
`;

function mobileQuoteBrowser(){
  'use strict';
  const $=id=>document.getElementById(id);
  const money=c=>new Intl.NumberFormat('en-ZA',{style:'currency',currency:'ZAR'}).format(Number(c||0)/100);
  const icon=(name)=>document.querySelector('#icon-'+name)?.innerHTML||'';
  const state={session:null,branch:'',basket:[],saved:null,history:[],scanner:null,stream:null,scanBusy:false,pending:null,selected:'new',refreshing:false,sequence:0,checkingSession:false};
  const message=(m)=>{const el=$('notice');el.textContent=String(m||'');el.hidden=!m;};
  const setText=(id,txt)=>{if($(id))$(id).textContent=txt;};
  const fmtDate=d=>{const date=new Date(d);return Number.isNaN(date.getTime())?String(d||''):date.toLocaleString('en-ZA',{dateStyle:'medium',timeStyle:'short'});};
  const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
  const btn=(label,cls,callback)=>{const b=el('button','btn '+(cls||''));b.type='button';b.textContent=label;b.addEventListener('click',callback);return b;};
  const moneyParts=()=>{const total=state.basket.reduce((a,b)=>a+Math.round(b.price_cents*b.quantity),0);const vat=Math.round(total*15/115);return{total,vat,net:total-vat};};
  // Every API request has a deadline; an Access redirect or dropped connection
  // must never leave an installed Quote window stuck on 'Checking' forever.
  const request=async(url,options={})=>{
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),15000);
    try{
      const r=await fetch(url,{credentials:'same-origin',cache:'no-store',...options,signal:controller.signal});
      let data;
      try{data=await r.json();}catch{throw Error('Could not read the Maliks server response (HTTP '+r.status+').');}
      if(!r.ok){const e=Error(data.error||'Request failed (HTTP '+r.status+').');e.status=r.status;throw e;}
      return data;
    }catch(error){
      if(error?.name==='AbortError')throw Error('Connection timed out after 15 seconds. Click Continue with Cloudflare Access to retry.');
      throw error;
    }finally{clearTimeout(timeout);}
  };
  function quotePhone(value){let digits=String(value||'').trim().replace(/[^\d+]/g,'');if(digits.startsWith('+'))digits=digits.slice(1);else if(digits.startsWith('0')&&digits.length===10)digits='27'+digits.slice(1);if(!/^\d{10,15}$/.test(digits))return'';return digits;}
  function parseQR(raw){
    const text=String(raw||'').trim();const uuid=/^[a-f\d]{8}-(?:[a-f\d]{4}-){3}[a-f\d]{12}$/i;
    if(uuid.test(text))return{token:text.toLowerCase(),tagBranch:''};
    let url;try{url=new URL(text);}catch{throw Error('This is not a valid product QR URL. Use a Maliks price-card QR, or search by code.');}
    if(!['https:','http:'].includes(url.protocol))throw Error('Only web price-card QR codes are supported.');
    const m=/^\/p\/([0-9a-f-]{36})\/?$/i.exec(url.pathname);
    if(!m||!uuid.test(m[1]))throw Error('This QR is not a Maliks product price card.');
    return{token:m[1].toLowerCase(),tagBranch:url.searchParams.get('branch')||''};
  }
  async function addScanned(text){
    if(state.scanBusy)return;state.scanBusy=true;
    try{
      const {token,tagBranch}=parseQR(text);
      const data=await request('/api/quote/tag?'+new URLSearchParams({branch:state.branch,tag:token,tag_branch:tagBranch}));
      addProduct(data.product);message('Added '+data.product.name+' from the price card.');$('qr-input').value='';stopCamera();showTab('new');
    }catch(e){message(e.message);}finally{state.scanBusy=false;}
  }
  function addProduct(p){
    if(state.pending){message('A quotation save may still be pending. Check Branch Quotes before changing the basket.');return;}
    if(!p||!Number.isSafeInteger(p.price_cents)||p.price_cents<=0){message('This product has no current branch selling price.');return;}
    const prev=state.basket.find(x=>x.id===p.id);
    if(prev)prev.quantity=Math.min(9999,Math.round((prev.quantity+1)*1000)/1000);
    else if(state.basket.length<100)state.basket.push({...p,quantity:1});
    else {message('Maximum 100 different products per quotation.');return;}
    state.saved=null;state.pending=null;renderBasket();
  }
  function updateQty(id,n){if(state.pending){message('Check Branch Quotes before changing a pending save.');return;}const line=state.basket.find(x=>x.id===id);if(!line)return;
    if(!Number.isFinite(n)||n<.001||n>9999||Math.abs(n*1000-Math.round(n*1000))>.000001){message('Quantity must be between 0.001 and 9999, up to three decimals.');renderBasket();return;}
    line.quantity=Math.round(n*1000)/1000;state.pending=null;renderBasket();
  }
  function renderBasket(){
    const list=$('basket-list');list.replaceChildren();
    if(!state.basket.length)list.append(el('div','basket-empty','No products added yet. Scan a price card or search the catalogue.'));
    for(const line of state.basket){
      const row=el('div','basket-row');const left=el('div');left.append(el('strong','',line.name));left.append(el('small','',line.code+' · '+money(line.price_cents)+' / '+line.unit));
      const right=el('div');const amount=el('strong','money',money(Math.round(line.price_cents*line.quantity)));right.append(amount);
      const qty=el('div','qty');const minus=btn('−','secondary small',()=>{if(line.quantity>1)updateQty(line.id,line.quantity-1);else{state.basket=state.basket.filter(x=>x.id!==line.id);state.pending=null;renderBasket();}});minus.setAttribute('aria-label','Decrease '+line.name);
      const input=el('input');input.type='number';input.step='.001';input.min='.001';input.max='9999';input.value=String(line.quantity);input.setAttribute('aria-label','Quantity for '+line.name);input.addEventListener('change',()=>updateQty(line.id,Number(input.value)));
      const plus=btn('+','secondary small',()=>updateQty(line.id,line.quantity+1));plus.setAttribute('aria-label','Increase '+line.name);
      const remove=btn('Remove','secondary small',()=>{state.basket=state.basket.filter(x=>x.id!==line.id);state.pending=null;renderBasket();});
      qty.append(minus,input,plus,remove);right.append(qty);row.append(left,right);list.append(row);
    }
    const totals=moneyParts();setText('net',money(totals.net));setText('vat',money(totals.vat));setText('total',money(totals.total));setText('bar-total',money(totals.total));setText('bar-count',state.basket.reduce((n,l)=>n+l.quantity,0)+' items');$('save-quote').disabled=!state.basket.length;
  }
  function showTab(tab){
    state.selected=tab;for(const name of ['new','saved','history']){$('view-'+name).hidden=name!==tab;$('tab-'+name).classList.toggle('active',name===tab);}
    $('footer').hidden=tab!=='new';if(tab!=='new')stopCamera();message('');
    if(tab==='history')void loadHistory();
    window.scrollTo({top:0,behavior:'instant'});
  }
  function clearBasket(){if(state.pending&&!confirm('The last Save may have succeeded. Check Branch Quotes first. Release this pending save and start again?'))return;
    if(state.basket.length&&!confirm('Start a new quotation and clear the existing basket?'))return;
    state.basket=[];state.saved=null;state.pending=null;for(const id of ['customer','phone','email','notes'])$(id).value='';renderBasket();showTab('new');}
  function shareText(q){
    const lines=q.lines||[];
    const fmt=line=>line.quantity+' × '+line.name+' ('+line.code+') — '+money(line.line_total_cents||Math.round(line.quantity*line.price_cents));
    return ['MALIKS QUOTE · '+q.branch,'Quotation: '+q.number,'Date: '+fmtDate(q.created_at),
      'Customer: '+q.customer_name,'','Products:',...lines.map(fmt),'',
      'Subtotal excl. VAT: '+money(q.net_cents),'VAT included (15%): '+money(q.vat_cents),'TOTAL: '+money(q.total_cents),'',
      'QUOTATION ONLY — NOT PAID. Subject to current price and stock availability.'];
  }
  function customerPhone(){const a=String($('phone').value||'').trim();return a||String(state.saved?.customer_contact||'').split('|')[0].trim();}
  function customerEmail(){const a=String($('email').value||'').trim();if(a)return a;const found=String(state.saved?.customer_contact||'').match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);return found?found[0]:'';}
  function whatsapp(q){const text=shareText(q).join('\n');const number=quotePhone(customerPhone());const url='https://wa.me/'+number+'?text='+encodeURIComponent(text);window.open(url,'_blank','noopener,noreferrer');}
  function email(q){const subject='Maliks quotation '+q.number;const body=shareText(q).join('\n');const to=customerEmail();window.location.href='mailto:'+encodeURIComponent(to)+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);}
  async function copyQuote(q){const text=shareText(q).join('\n');try{await navigator.clipboard.writeText(text);message('Quotation copied. You can paste it into WhatsApp or email.');}catch{message('Copy not available in this browser. Use WhatsApp or Email.');}}
  function print(q){
    const sheet=$('print-sheet');sheet.replaceChildren();const header=el('div','print-head');const left=el('div');const logo=el('img');logo.src='/powerbuild-logo.png';logo.alt='PowerBuild';left.append(logo);const right=el('div');right.style.textAlign='right';right.append(el('h1','',q.number));right.append(el('p','print-info','MALIKS QUOTE · '+q.branch));header.append(left,right);sheet.append(header);
    for(const label of ['Date: '+fmtDate(q.created_at),'Salesperson: '+q.submitted_by_name,'Customer: '+q.customer_name,'Contact: '+(q.customer_contact||'—')])sheet.append(el('p','print-info',label));
    const table=el('table','print-table'),head=el('tr');for(const t of ['Code / Description','Qty','Unit','Amount'])head.append(el('th','',t));const thead=el('thead');thead.append(head);table.append(thead);const body=el('tbody');for(const line of q.lines||[]){const r=el('tr');for(const t of [line.code+' · '+line.name,String(line.quantity),money(line.price_cents),money(line.line_total_cents)])r.append(el('td','',t));body.append(r);}table.append(body);sheet.append(table);
    const totals=el('div','print-totals');for(const [label,val] of [['Subtotal (excl. VAT)',q.net_cents],['VAT (15%, included)',q.vat_cents],['TOTAL (incl. VAT)',q.total_cents]]){const r=el('div','amount-line'+(label.startsWith('TOTAL')?' total':''));r.append(el('span','',label),el('strong','',money(val)));totals.append(r);}sheet.append(totals);
    sheet.append(el('p','print-info','NOT PAID — QUOTATION ONLY. Prices VAT inclusive. No stock reserved. Subject to availability and final verification.'));
    sheet.hidden=false;window.print();sheet.hidden=true;
  }
  function savedActions(target,q){target.replaceChildren();const box=el('div','saved-actions');box.append(btn('Print / Save PDF','dark',()=>print(q)),btn('WhatsApp','secondary',()=>whatsapp(q)),btn('Email','secondary',()=>email(q)),btn('Copy text','secondary',()=>void copyQuote(q)),btn('New quotation','secondary',clearBasket));target.append(box);}
  function renderSaved(q){state.saved=q;setText('saved-number',q.number);setText('saved-info',q.branch+' · '+q.customer_name+' · '+money(q.total_cents));savedActions($('saved-actions'),q);showTab('saved');}
  function saveInput(){const name=$('customer').value.trim()||'Walk-in customer',phone=$('phone').value.trim(),email=$('email').value.trim(),notes=$('notes').value.trim();
    if(name.length>120||notes.length>400)throw Error('Customer name or notes are too long.');
    if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Error('Check the customer email address.');
    const contact=[phone,email].filter(Boolean).join(' | ');if(contact.length>80)throw Error('Customer contact details exceed 80 characters.');
    if(!state.basket.length)throw Error('Scan at least one product before saving.');
    return {branch:state.branch,customer_name:name,customer_contact:contact,notes,
      lines:state.basket.map(line=>({product_id:line.id,quantity:line.quantity,expected_price_cents:line.price_cents}))};
  }
  async function saveQuote(){const b=$('save-quote');b.disabled=true;
    try{const input=saveInput();if(state.pending&&JSON.stringify(state.pending.input)!==JSON.stringify(input))throw Error('A previous save may have succeeded. Check saved quotations before changing it.');
      if(!state.pending)state.pending={request_id:crypto.randomUUID(),input};
      const response=await request('/api/quotes',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({...input,request_id:state.pending.request_id})});
      state.pending=null;renderSaved(response.quotation);message('');
    }catch(e){if(e.status===409&&/Price changed/i.test(e.message))state.pending=null;message(e.message+' Use Refresh Prices if an item changed. If the connection stopped during Save, check Branch Quotes before retrying.');}
    finally{b.disabled=!state.basket.length;}}
  async function refreshPrices(){if(state.pending){message('Check pending quotation status before refreshing prices.');return;}
    if(!state.basket.length)return;
    const selected=state.branch;let changed=0;
    try{for(const line of state.basket){const data=await request('/api/catalogue?'+new URLSearchParams({branch:selected,q:line.code}));if(selected!==state.branch)return;const exact=(data.products||[]).find(p=>p.code===line.code);if(!exact)throw Error(line.code+' is no longer available.');if(exact.price_cents!==line.price_cents){line.price_cents=exact.price_cents;changed++;}}
      state.pending=null;renderBasket();message(changed?changed+' product price(s) refreshed. Please review the total before saving.':'All prices are current for '+selected+'.');}
    catch(e){message('Could not refresh prices: '+e.message);}
  }
  async function searchProducts(){const query=$('product-search').value.trim();if(query.length<2){message('Enter at least 2 letters or a product code.');return;}
    const selected=state.branch,seq=++state.sequence,box=$('search-results');box.replaceChildren(el('p','muted','Searching…'));
    try{const data=await request('/api/catalogue?'+new URLSearchParams({branch:selected,q:query}));if(seq!==state.sequence||state.branch!==selected)return;box.replaceChildren();if(!data.products?.length)box.append(el('p','muted','No published products found.'));for(const p of data.products||[]){const row=el('div','result');const name=el('div');name.append(el('div','product-title',p.name),el('small','',p.code+' · '+p.unit));const right=el('div');right.append(el('div','money',money(p.price_cents)),btn('Add','small',()=>{addProduct(p);message('Added '+p.name+'.');}));row.append(name,right);box.append(row);}}
    catch(e){box.replaceChildren(el('p','muted',e.message));}}
  function stopCamera(){if(state.scanner){cancelAnimationFrame(state.scanner);state.scanner=null;}if(state.stream){for(const tr of state.stream.getTracks())tr.stop();state.stream=null;}const vid=$('camera');if(vid){vid.srcObject=null;vid.hidden=true;}$('camera-start').textContent='Start camera scan';}
  async function cameraLoop(video,detector){if(!state.stream)return;
    try{if(video.readyState>=2&&!state.scanBusy){const results=await detector.detect(video);if(results.length&&results[0].rawValue){await addScanned(results[0].rawValue);return;}}}
    catch(e){message('Camera scanning could not read the code. Try good lighting or use the phone camera app.');stopCamera();return;}
    if(state.stream)state.scanner=requestAnimationFrame(()=>void cameraLoop(video,detector));
  }
  async function startCamera(){if(state.stream){stopCamera();return;}
    if(!('BarcodeDetector'in window)){message('Built-in camera QR detection is unavailable in this browser. Scan the printed QR using your phone camera, then tap Add to Maliks Quote on the product page. You can also paste a QR link here.');return;}
    if(!navigator.mediaDevices?.getUserMedia){message('Camera permission is unavailable. Use HTTPS and allow camera access, or paste the QR link.');return;}
    try{const detector=new window.BarcodeDetector({formats:['qr_code']});const stream=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:720}}});
      const video=$('camera');state.stream=stream;video.srcObject=stream;video.hidden=false;await video.play();$('camera-start').textContent='Stop camera';message('Aim at the QR code in the price card.');state.scanner=requestAnimationFrame(()=>void cameraLoop(video,detector));}
    catch(e){stopCamera();message('Camera could not open. Check permission settings, or use your phone QR scanner and the Add to Maliks Quote button.');}}
  async function loadHistory(){const selected=state.branch,root=$('history-list');root.replaceChildren(el('p','muted','Loading branch quotations…'));
    try{const data=await request('/api/quote/branch-queue?'+new URLSearchParams({branch:selected}));if(selected!==state.branch)return;state.history=data.quotes||[];root.replaceChildren();
      if(!state.history.length)root.append(el('p','muted','No saved quotations in this branch yet.'));
      for(const q of state.history){const row=el('div','history-item');const head=el('h3');head.append(el('span','',q.number),el('span','money',money(q.total_cents)));row.append(head,el('p','',q.customer_name+' · '+q.submitted_by_name+' · '+fmtDate(q.created_at)));
        row.append(el('p','',q.status+' · '+q.lines.length+' product lines'));const actions=el('div','row');actions.append(btn('Open','secondary small',()=>renderSaved(q)),btn('Print','secondary small',()=>print(q)));row.append(actions);root.append(row);}}
    catch(e){root.replaceChildren(el('p','muted','Could not load branch quotes: '+e.message));}}
  function changeBranch(){stopCamera();state.branch=$('branch').value;state.basket=[];state.pending=null;state.saved=null;state.history=[];renderBasket();showTab('new');message('Branch changed. Prices will now use '+state.branch+'.');}
  // Cloudflare Access can already authenticate the browser without a staff-password
  // login. Recheck when an installed/PWA window regains focus after Access sign-in.
  async function startSession(){
    if(state.session)return true;
    if(state.checkingSession)return false;
    state.checkingSession=true;
    const accessButton=$('access-continue');
    if(accessButton)accessButton.disabled=true;
    setText('access-status','Checking your Cloudflare Access session…');
    try{
      const data=await request('/api/session');
      if(!data||!data.user||!Array.isArray(data.branches))throw Error('Invalid session response from Maliks Core.');
      if(data.password_change_required){
        $('login').hidden=true;$('workspace').hidden=true;$('change-password').hidden=false;
        setText('password-help','A temporary password must be changed before you can create quotations.');
        return true;
      }
      if(!data.branches.length)throw Error('No assigned branch. Contact Head Office.');
      const branchInput=$('branch');branchInput.replaceChildren();
      for(const b of data.branches){const opt=el('option','',b);opt.value=b;branchInput.append(opt);}
      const params=new URLSearchParams(location.search);const requested=params.get('branch');
      if(requested&&data.branches.some(x=>x.toLowerCase()===requested.toLowerCase()))
        branchInput.value=data.branches.find(x=>x.toLowerCase()===requested.toLowerCase());
      state.branch=branchInput.value;
      setText('staff-name',data.user.name+' · '+data.user.role);
      state.session=data;
      $('login').hidden=true;$('change-password').hidden=true;$('workspace').hidden=false;
      setText('login-help','');setText('access-status','Secure Access verified.');
      renderBasket();
      const token=params.get('tag');
      if(token){const qr=new URL('/p/'+encodeURIComponent(token),'https://maliks.co.za');
        if(params.get('tag_branch'))qr.searchParams.set('branch',params.get('tag_branch'));
        await addScanned(qr.href);}
      return true;
    }catch(e){
      // Keep the login fallback, but show the actual Core error. No credentials,
      // bypass, or browser-stored bearer tokens are introduced here.
      if(!state.session){$('login').hidden=false;$('workspace').hidden=true;
        setText('access-status','Cloudflare session not yet verified in this window. Select Continue to check again.');
        setText('login-help',e.message||'Unable to verify Maliks Quote session.');}
      return false;
    }finally{
      state.checkingSession=false;
      if(accessButton)accessButton.disabled=false;
    }
  }
  $('change-password-form').addEventListener('submit',async event=>{
    event.preventDefault();const button=$('change-password-submit');
    const current=$('change-current').value,next=$('change-new').value,confirmation=$('change-confirm').value;
    if(next.length<14||next!==confirmation){setText('password-help','New password must have at least 14 characters and match the confirmation.');return;}
    button.disabled=true;setText('password-help','Saving employee password…');
    try{
      await request('/api/auth/change-password',{method:'POST',headers:{'content-type':'application/json'},
        body:JSON.stringify({current_password:current,new_password:next})});
      $('change-current').value='';$('change-new').value='';$('change-confirm').value='';
      try{await request('/api/auth/logout',{method:'POST',headers:{'content-type':'application/json'},body:'{}'});}catch{}
      location.reload();
    }catch(e){setText('password-help',e.message);}finally{button.disabled=false;}
  });
  $('branch').addEventListener('change',changeBranch);
  for(const id of ['new','saved','history'])$('tab-'+id).addEventListener('click',()=>showTab(id));
  $('camera-start').addEventListener('click',()=>void startCamera());
  $('qr-add').addEventListener('click',()=>void addScanned($('qr-input').value));
  $('qr-input').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();void addScanned($('qr-input').value);}});
  $('product-search-go').addEventListener('click',()=>void searchProducts());
  $('product-search').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();void searchProducts();}});
  $('save-quote').addEventListener('click',()=>void saveQuote());
  $('refresh-prices').addEventListener('click',()=>void refreshPrices());
  $('new-quote').addEventListener('click',clearBasket);
  $('review-save').addEventListener('click',()=>$('save-quote').scrollIntoView({behavior:'smooth',block:'center'}));
  $('logout').addEventListener('click',async()=>{stopCamera();try{await request('/api/auth/logout',{method:'POST',headers:{'content-type':'application/json'},body:'{}'});}catch{}location.reload();});
  $('login-form').addEventListener('submit',async e=>{e.preventDefault();const b=$('login-button');b.disabled=true;setText('login-help','Signing in…');
    try{await request('/api/auth/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:$('login-email').value.trim(),password:$('login-password').value})});$('login-password').value='';await startSession();}
    catch(err){setText('login-help',err.message);}finally{b.disabled=false;}});
  $('access-continue').addEventListener('click',()=>void startSession());
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopCamera();else if(!state.session)void startSession();});
  window.addEventListener('pageshow',()=>{if(!state.session)void startSession();});
  window.addEventListener('focus',()=>{if(!state.session)void startSession();});
  void startSession();
}

const screen=()=>`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>Maliks Quote — Mobile Sales</title><meta name="theme-color" content="#0A2A3F"><meta name="application-name" content="Maliks Quote"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-title" content="Maliks Quote"><meta name="apple-mobile-web-app-status-bar-style" content="default"><link rel="manifest" href="/manifest.webmanifest"><link rel="icon" type="image/png" sizes="192x192" href="/quote-icon-192.png"><link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png"><style>${css}</style></head>
<body><header class="top"><div class="top-inner"><div class="brand"><img src="/powerbuild-logo.png" width="54" height="54" alt="PowerBuild"><div><strong>MALIKS <span>QUOTE</span></strong><small>ACCOUNTING &amp; POS SOLUTIONS · PROFESSIONAL</small></div></div><span class="secure"><i></i>SECURE SALES</span><span class="user" id="staff-name"></span></div></header>
<section id="login" class="app"><div class="panel" style="max-width:420px;margin:35px auto"><p class="gold-label">Authorised sales only</p><h1>Sign in to Maliks Quote</h1><p class="intro">Already signed into Cloudflare Access? Open your authorised Quote workspace below. You do not need to type your Cloudflare password into the employee form.</p><button id="access-continue" class="btn dark block" type="button">Continue with Cloudflare Access</button><p id="access-status" class="muted" role="status" aria-live="polite">Loading secure Quote application… If this stays here, the app script has not loaded. Open the address in Chrome and refresh.</p><noscript><p class="message">JavaScript is required to use Maliks Quote. Enable it for this site in your browser.</p></noscript><p class="muted" style="margin:18px 0 12px">Alternatively, use your Maliks Member Team employee email and password. These are separate from your Cloudflare credentials.</p><form id="login-form"><div class="field"><label for="login-email">Staff email</label><input id="login-email" type="email" autocomplete="username" required></div><div class="field"><label for="login-password">Password</label><input id="login-password" type="password" autocomplete="current-password" required></div><button id="login-button" class="btn dark block" type="submit">Sign in securely</button></form><p id="login-help" class="muted" aria-live="polite"></p></div></section>
<section id="change-password" class="app" hidden><div class="panel" style="max-width:440px;margin:35px auto"><p class="gold-label">First sign-in security</p><h1>Choose your permanent password</h1><p class="intro">Change the temporary Maliks Member Team password here. This password will work in Maliks Sales and Maliks Quote once your app permissions are enabled.</p><form id="change-password-form"><div class="field"><label for="change-current">Temporary password</label><input id="change-current" type="password" autocomplete="current-password" required></div><div class="field"><label for="change-new">New password (14+ characters)</label><input id="change-new" type="password" minlength="14" maxlength="128" autocomplete="new-password" required></div><div class="field"><label for="change-confirm">Confirm new password</label><input id="change-confirm" type="password" minlength="14" maxlength="128" autocomplete="new-password" required></div><button id="change-password-submit" class="btn dark block" type="submit">Save new password</button></form><p id="password-help" aria-live="polite" class="muted"></p></div></section>
<main id="workspace" class="app" hidden><div class="page-heading"><div><p class="gold-label">Mobile sales · scan to quote</p><h1>Build a customer quotation</h1><p>Live branch pricing · quotation only, no payment</p></div><button class="btn secondary small" type="button" id="logout">Sign out</button></div>
<div class="row" style="margin-bottom:18px"><div class="field" style="max-width:400px"><label for="branch">Branch / Store</label><select id="branch"></select></div></div>
<div class="tabs" role="navigation" aria-label="Quotation navigation"><button class="btn active" id="tab-new" type="button">New Quote</button><button class="btn secondary" id="tab-saved" type="button">Saved Quote</button><button class="btn secondary" id="tab-history" type="button">Branch Quotes</button></div>
<div id="notice" class="message" role="status" aria-live="polite" hidden></div>
<section id="view-new" class="screen"><div class="grid"><div class="stack">
<section class="panel"><p class="gold-label">01 · Product selection</p><h2>Scan the price card</h2><p class="intro">Use the existing QR code from any published PowerBuild/BusterBuild price tag. Scan one item after another while walking with the customer.</p>
<div class="scan-box"><div class="scan-hero">${ico('scan-line')}<div><strong>QR Product Scanner</strong><small>Use your rear camera, or paste a scanned link.</small></div></div><video id="camera" autoplay muted playsinline hidden></video><button type="button" class="btn dark block" id="camera-start">Start camera scan</button><div class="field" style="margin-top:13px"><label for="qr-input">QR link or token</label><input id="qr-input" class="qr-entry" placeholder="Paste the scanned price-card link"></div><button type="button" class="btn secondary block" id="qr-add">Add scanned product</button><p class="muted">On phones without built-in QR detection: scan with the Camera app, then tap “Add to Maliks Quote” on the product page.</p></div>
<div class="field"><label for="product-search">Search by product name or stock code</label><div class="row"><input id="product-search" placeholder="e.g. cement, tiles, SKU" maxlength="100" style="flex:1;min-height:48px;border-radius:11px;border:1px solid #cfd5d9;padding:12px"><button class="btn secondary" id="product-search-go" type="button">Search</button></div></div><div id="search-results" class="search-results"></div></section></div>
<div class="stack"><section class="panel"><p class="gold-label">02 · Your basket</p><div class="row" style="justify-content:space-between"><h2>Quotation items</h2><button id="refresh-prices" type="button" class="btn secondary small">Refresh Prices</button></div><div id="basket-list"></div><div class="amounts"><div class="amount-line"><span>Subtotal excl. VAT</span><strong id="net">R 0,00</strong></div><div class="amount-line"><span>VAT included (15%)</span><strong id="vat">R 0,00</strong></div><div class="amount-line total"><span>Total</span><strong id="total">R 0,00</strong></div></div></section>
<section class="panel customer"><p class="gold-label">03 · Customer details</p><h2>Save for the counter or share</h2><div class="field"><label for="customer">Customer name</label><input id="customer" maxlength="120" placeholder="Walk-in customer"></div><div class="two-fields"><div class="field"><label for="phone">WhatsApp / phone</label><input id="phone" type="tel" maxlength="40" placeholder="082 000 0000"></div><div class="field"><label for="email">Email address</label><input id="email" type="email" maxlength="70" placeholder="customer@example.com"></div></div><div class="field"><label for="notes">Quotation notes</label><textarea id="notes" maxlength="400" placeholder="Optional collection/delivery notes"></textarea></div><button class="btn dark block" type="button" id="save-quote" disabled>Save quotation</button><p class="muted">Saving creates a numbered Maliks Sales quotation. The customer has not paid; the quote does not reserve stock or release dispatch.</p></section></div></div></section>
<section id="view-saved" class="screen" hidden><div class="panel"><div class="saved-hero">${ico('receipt')}<p class="gold-label">Saved in Maliks Sales</p><h2 id="saved-number">Q-00000000</h2><p id="saved-info"></p><p>Open this number on the Sales PC, or share the quotation with your customer.</p></div><div id="saved-actions"></div><div class="notice" style="margin-top:18px">WhatsApp and Email open your phone's messaging apps with quotation details. You must confirm and send the message yourself; these buttons do not send messages automatically.</div></div></section>
<section id="view-history" class="screen" hidden><div class="panel"><p class="gold-label">Branch quotation register</p><h2>Saved quotations</h2><p class="intro">Open or print saved quotations created by authorised sales staff at this branch. The PC Sales workspace also has this queue.</p><div id="history-list"></div></div></section></main>
<footer id="footer" class="footer-bar" hidden><div class="inner"><div><small id="bar-count" style="display:block;color:var(--muted);font-size:11px">0 items</small><b id="bar-total">R 0,00</b></div><button type="button" class="btn secondary small" id="new-quote">Clear</button><button type="button" class="btn dark" id="review-save">Review &amp; Save</button></div></footer><section id="print-sheet" hidden></section>
<script src="/quote-app.js" defer></script></body></html>`;
// Wrangler/esbuild may add __name() calls inside mobileQuoteBrowser when it
// bundles this Worker. Function.toString() then captures those calls without
// the bundler's module-scoped helper. Supply the harmless function-name helper
// inside the separately served script, BEFORE the captured function executes.
// This restores startup without weakening authentication or browser CSP.
const quoteBrowserScript=`const __name=(target,_label)=>target;\n${mobileQuoteBrowser.toString()};(${mobileQuoteBrowser.name})();`;
const routeMap=Object.freeze({'/api/session':'/v1/session','/api/catalogue':'/v1/catalogue',
  '/api/quotes':'/v1/quotes','/api/quote/tag':'/v1/quote/tag','/api/quote/branch-queue':'/v1/quote/branch-queue',
  '/api/auth/login':'/v1/auth/login','/api/auth/logout':'/v1/auth/logout','/api/auth/change-password':'/v1/auth/change-password'});
export default {
  async fetch(request,env){
    const url=new URL(request.url);const path=url.pathname;
    // Serve executable JavaScript from this same-origin Worker, not from an
    // inline HTML script. This works with strict Cloudflare Access CSP policies.
    if(path==='/quote-app.js'&&request.method==='GET')
      return new Response(quoteBrowserScript,{headers:{'content-type':'text/javascript; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});
    if(path==='/powerbuild-logo.png'&&request.method==='GET')return new Response(logoBytes,{headers:{'content-type':'image/png','cache-control':'public,max-age=3600','x-content-type-options':'nosniff'}});
    // Public static install metadata must load before authentication on Android/iOS.
    // No user session or quotation data is cached in these icon endpoints.
    if(request.method==='GET'&&Object.prototype.hasOwnProperty.call(iconBytes,path))
      return new Response(iconBytes[path],{headers:{'content-type':'image/png','cache-control':'public,max-age=86400','x-content-type-options':'nosniff'}});
    if(path==='/manifest.webmanifest'&&request.method==='GET')
      return Response.json(QUOTE_APP_MANIFEST,{headers:{'content-type':'application/manifest+json','cache-control':'public,max-age=3600','x-content-type-options':'nosniff'}});
    if(path==='/'&&request.method==='GET')return new Response(screen(),{headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store','content-security-policy':"default-src 'self'; img-src 'self' data:; media-src 'self' blob:; connect-src 'self'; script-src 'self'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",'x-content-type-options':'nosniff','referrer-policy':'no-referrer'}});
    const target=routeMap[path];if(!target)return Response.json({error:'Unknown endpoint.'},{status:404});
    const method=request.method;
    const permitted=method==='GET'&&['/api/session','/api/catalogue','/api/quote/tag','/api/quote/branch-queue'].includes(path)||
      method==='POST'&&['/api/quotes','/api/auth/login','/api/auth/logout','/api/auth/change-password'].includes(path);
    if(!permitted)return Response.json({error:'Operation not permitted in Maliks Quote.'},{status:405});
    if(method==='POST'&&request.headers.get('origin')!==url.origin)return Response.json({error:'Invalid request origin.'},{status:403});
    const access=request.headers.get('cf-access-jwt-assertion');
    const session=(request.headers.get('cookie')||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('__Host-maliks_session='))?.split('=')[1]||'';
    if(!access&&!session&&!['/api/auth/login','/api/auth/logout'].includes(path))return Response.json({error:'Sign in to Maliks Quote.'},{status:401,headers:{'cache-control':'no-store'}});
    // The private Core uses the Quote Access AUD for this verified Quote Worker,
    // while keeping the common Sales employee-password permission ('pos').
    // Browser-supplied x-maliks-access-app values are not forwarded.
    const headers=new Headers({'x-maliks-app':'pos','x-maliks-access-app':'quote','x-maliks-original-origin':url.origin});
    if(access)headers.set('cf-access-jwt-assertion',access);
    if(session)headers.set('x-maliks-session',session);
    if(path==='/api/auth/login')headers.set('x-maliks-client-ip',request.headers.get('cf-connecting-ip')||'unknown');
    if(method==='POST'){headers.set('origin',url.origin);headers.set('content-type','application/json');}
    let res;try{res=await env.CORE.fetch(new Request('https://maliks-core.internal'+target+url.search,{method,headers,body:method==='POST'?request.body:undefined,duplex:method==='POST'?'half':undefined}));}
    catch(error){console.error('Maliks Quote Core connection error',String(error?.message||'').slice(0,100));return Response.json({error:'Core service unavailable.'},{status:503});}
    const replyHeaders=new Headers({'cache-control':'no-store','content-type':'application/json','x-content-type-options':'nosniff'});
    if(path==='/api/auth/login'&&res.ok){const data=await res.json();if(!/^[A-Za-z0-9_-]{43}$/.test(data.token||''))return Response.json({error:'Login failed.'},{status:503});replyHeaders.set('set-cookie','__Host-maliks_session='+data.token+'; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=28800');return Response.json({ok:true,password_change_required:!!data.password_change_required},{headers:replyHeaders});}
    if(path==='/api/auth/logout')replyHeaders.set('set-cookie','__Host-maliks_session=; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=0');
    return new Response(res.body,{status:res.status,headers:replyHeaders});
  }
};

const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const money=c=>new Intl.NumberFormat('en-ZA',{style:'currency',currency:'ZAR'}).format((Number(c)||0)/100);
const clean=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const newId=()=>crypto.randomUUID();
const state={screen:'overview',session:null,branch:'',products:[],category:'',productQuery:'',page:1,more:false,
  cart:[],customer:'',contact:'',notes:'',requestId:newId(),quotes:[],isOffline:!navigator.onLine,lastConfirmed:null};
const features=[
  ['▣','Sales quotations','Live catalogue, VAT-inclusive pricing, quotation handover to Cash Office.','live'],
  ['▤','Quotation register','Search, inspect and print submitted branch quotations.','live'],
  ['◫','Product & price lookup','Branch-approved prices and active catalogue product information.','live'],
  ['◈','Offline drafts','Save quotes on the current device and submit only after reconnection.','live'],
  ['▥','Cash Office & cash-ups','Role-restricted payment receipt, teller shifts, Z reports and cashier reconciliation.','planned'],
  ['▧','Dispatch & collections','Server-verified paid invoices, picking, staging, POD and proof of collection.','planned'],
  ['◉','Inventory control','Opening balances, perpetual stock, counts, transfers, shrinkage and reorder alerts.','planned'],
  ['⊞','Purchasing & receiving','Supplier PO, GRV, credit notes, cost history, stock movements and approvals.','planned'],
  ['◇','Trade & debtor accounts','Credit accounts, statements, ageing, terms and controlled credit limits.','planned'],
  ['◎','Lay-bys & parked sales','Deposits, balance tracking and controlled stock reservations.','planned'],
  ['✦','Loyalty & promotions','Customer rewards, promotions, discounts and manager overrides.','planned'],
  ['▥','Financial accounting','Double-entry general ledger, journals, VAT and integrated reconciliation.','planned'],
  ['▩','Business reports','Sales, gross profit, department reports, sales-rep commission and exports.','planned'],
  ['⇄','DC & multi-branch','Distribution centre replenishment, routing and inter-branch stock control.','planned'],
  ['⚙','Staff & permissions','Till profiles, approvals, access control and detailed audit trail.','planned']
];
function toast(message,type='normal'){$('#toast').textContent=message;$('#toast').className=`toast ${type}`;window.clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#toast').classList.add('hidden'),4500);}
function setConnection(online){state.isOffline=!online;$('#side-connection').textContent=online?'Connected to Cloudflare':'Offline / local drafts';$('#side-status-dot').classList.toggle('offline',!online);$('#online-banner').classList.toggle('offline',!online);$('#online-banner').innerHTML=`<span class="status-dot ${online?'':'offline'}"></span> ${online?'Connected':'Offline'}`;$('#offline-notice').hidden=online;$('#submit-quote').disabled=(!online||!state.cart.length||!state.session);}
function show(screen){if(!['overview','sales','quotes','catalogue','modules'].includes(screen))return;
  state.screen=screen; $$('.view').forEach(el=>el.classList.add('hidden'));$(`#view-${screen}`).classList.remove('hidden');
  $$('.nav-link').forEach(b=>b.classList.toggle('active',b.dataset.route===screen));
  $('#top-screen').textContent=({overview:'Overview',sales:'Sales quotation',quotes:'Quotations',catalogue:'Products & pricing',modules:'Operations modules'})[screen];
  $('#sidebar').classList.remove('open');
  if(screen==='overview')loadOverview();if(screen==='sales')searchProducts();if(screen==='quotes')loadQuotes();if(screen==='catalogue')loadCatalogue();
  if(screen==='modules')renderModules();}
async function api(path,opts={}){const response=await fetch(path,{credentials:'same-origin',cache:'no-store',...opts});let body;
  try{body=await response.json();}catch{body={error:`Unexpected response (${response.status})`};}
  if(!response.ok)throw Error(body.error||`Request failed: ${response.status}`);
  return body;}
// Device-local storage. Financial posting is NEVER performed from these records.
function dbOpen(){return new Promise((resolve,reject)=>{
  const req=indexedDB.open('malikspos-local-v1',1);
  req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains('drafts'))db.createObjectStore('drafts');if(!db.objectStoreNames.contains('products'))db.createObjectStore('products');};
  req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
});}
async function dbValue(store,key,value,put=false){const db=await dbOpen();return new Promise((resolve,reject)=>{const tx=db.transaction(store,put?'readwrite':'readonly');const s=tx.objectStore(store),req=put?s.put(value,key):s.get(key);req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);tx.oncomplete=()=>db.close();});}
async function dbDelete(store,key){const db=await dbOpen();return new Promise((resolve,reject)=>{const tx=db.transaction(store,'readwrite');tx.objectStore(store).delete(key);tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>reject(tx.error);});}
function currentDraftKey(){
  // Never share an offline quotation between staff using the same branch terminal.
  const user=String(state.session?.user?.email||'').trim().toLowerCase();
  return user && state.branch ? `draft:${user}:${state.branch}` : null;
}
async function saveDraft(silent=false){if(!currentDraftKey())return;
  state.customer=$('#customer-name').value;state.contact=$('#customer-contact').value;state.notes=$('#quote-notes').value;
  try{await dbValue('drafts',currentDraftKey(),{branch:state.branch,requestId:state.requestId,cart:state.cart,customer:state.customer,contact:state.contact,notes:state.notes,savedAt:Date.now()},true);if(!silent)toast('Draft saved on this device. No stock or payment has been posted.','success');}
  catch{if(!silent)toast('Could not save the offline draft on this device.','error');}}
async function restoreDraft(){state.cart=[];state.customer='';state.contact='';state.notes='';state.requestId=newId();
  const key=currentDraftKey();
  if(!key){$('#customer-name').value='';$('#customer-contact').value='';$('#quote-notes').value='';renderBasket();return;}
  try{const doc=await dbValue('drafts',key);if(doc&&doc.branch===state.branch){state.cart=doc.cart||[];state.customer=doc.customer||'';state.contact=doc.contact||'';state.notes=doc.notes||'';state.requestId=doc.requestId||newId();}}
  catch{};
  $('#customer-name').value=state.customer;$('#customer-contact').value=state.contact;$('#quote-notes').value=state.notes;renderBasket();}
function initSession(data){state.session=data;$('#welcome-name').textContent=(data.user?.name||'team').split(' ')[0]+'.';$('#user-badge').textContent=(data.user?.name||'M').slice(0,1).toUpperCase();$('#user-badge').title=`${data.user.name} • ${data.user.role}`;
  const sel=$('#branch-select');sel.replaceChildren();for(const b of data.branches||[]){const el=document.createElement('option');el.value=b;el.textContent=b;sel.append(el);}
  state.branch=data.branches?.[0]||'';sel.value=state.branch;restoreDraft().then(()=>{loadCategories();loadOverview();});}
function resetForBranch(next){if(next===state.branch)return;
  saveDraft(true).then(async()=>{state.branch=next;state.page=1;state.category='';state.productQuery='';$('#product-search').value='';$('#catalogue-search').value='';await restoreDraft();await loadCategories();show(state.screen);});}
async function sessionStart(){
  try{const data=await api('/api/session');initSession(data);setConnection(true);}
  catch(e){setConnection(false);const reason=e.message||'Connection error';$('#welcome-name').textContent='team.';
    // A device shared by cashiers must NOT expose another person's customer drafts.
    // After a page refresh, restore requires verified account identity online.
    $('#branch-select').replaceChildren(new Option('Sign-in required',''));
    state.session=null;
    state.branch='';
    if(!navigator.onLine)toast('Sign-in is needed to reopen drafts after a page refresh. Keep the signed-in tab open for offline editing.','error');
    if(navigator.onLine)toast(`Unable to load authorised branches: ${reason}`,'error');
    $('#overview-quotes').innerHTML='<div class="empty-state">Sign in through Cloudflare Access and confirm your branch assignment.</div>';
  }
}
function quotationTotals(){let total=0;for(const l of state.cart)total+=Math.round(l.product.price_cents*l.quantity);const vat=Math.round(total*15/115);return {total,vat,net:total-vat};}
function renderBasket(){const count=state.cart.length;$('#basket-caption').textContent=`${count} product${count===1?'':'s'} in this quotation`;
  const root=$('#basket-lines');root.replaceChildren();if(!count)root.innerHTML='<div class="basket-empty"><span>▣</span><strong>Your basket is empty</strong><small>Select products to add them to the quotation.</small></div>';
  for(const l of state.cart){const row=document.createElement('div');row.className='basket-row';row.innerHTML=`<div><strong>${clean(l.product.name)}</strong><small>${clean(l.product.code)} • ${money(l.product.price_cents)} each</small><div class="qty-actions"><button data-minus="${l.product.id}" aria-label="Decrease quantity">−</button><input data-qty="${l.product.id}" value="${l.quantity}" aria-label="Quantity for ${clean(l.product.code)}" inputmode="decimal"><button data-plus="${l.product.id}" aria-label="Increase quantity">+</button><button class="remove-line" data-remove="${l.product.id}" aria-label="Remove line">×</button></div></div><div class="basket-value">${money(Math.round(l.product.price_cents*l.quantity))}</div>`;root.append(row);}
  const total=quotationTotals();$('#net-value').textContent=money(total.net);$('#vat-value').textContent=money(total.vat);$('#total-value').textContent=money(total.total);
  $('#submit-quote').disabled=!count||state.isOffline||!state.session;}
function addProduct(p){if(!p||p.price_cents<1){toast('This product has no approved selling price.','error');return;}const found=state.cart.find(l=>l.product.id===p.id);if(found)found.quantity=Math.min(9999,+(found.quantity+1).toFixed(3));else state.cart.push({product:p,quantity:1});renderBasket();saveDraft(true);toast(`${p.code} added to quotation`,'success');}
function adjustQty(id,quantity){const item=state.cart.find(x=>x.product.id===Number(id));if(!item)return;const n=Number(quantity);if(!Number.isFinite(n)||n<=0||n>9999||Math.abs(n*1000-Math.round(n*1000))>.000001){toast('Quantity must be between 0.001 and 9,999 (max three decimals).','error');renderBasket();return;}item.quantity=Math.round(n*1000)/1000;renderBasket();saveDraft(true);}
async function searchProducts(){if(!state.branch)return;const q=state.productQuery,cat=state.category,page=state.page;
  $('#search-note').textContent=state.isOffline?'Local cached catalogue • verify prices online':'Published branch prices • refreshed from server';
  const uri=`/api/products?branch=${encodeURIComponent(state.branch)}&q=${encodeURIComponent(q)}&category=${encodeURIComponent(cat)}&page=${page}`;
  let data;try{data=await api(uri);await dbValue('products',uri,data,true);setConnection(true);}catch(e){try{data=await dbValue('products',uri);if(!data)throw Error();setConnection(false);}catch{data={products:[],has_more:false};$('#search-note').textContent=`Products unavailable: ${e.message}`;}}
  state.products=data.products||[];state.more=!!data.has_more;$('#product-count').textContent=`${state.products.length} results`;$('#page-label').textContent=`Page ${page}`;
  $('#prev-page').disabled=page===1;$('#next-page').disabled=!state.more;renderProducts();}
function renderProducts(){const root=$('#search-results');root.replaceChildren();if(!state.products.length){root.innerHTML='<div class="empty-state"><div class="empty-icon">▧</div><h4>No products found</h4><p>Try searching with a shorter name, barcode or product code.</p></div>';return;}
  for(const p of state.products){const row=document.createElement('div');row.className='product-item';const stock=p.qty_milli===null||p.qty_milli===undefined?'Stock not verified':`On hand: ${Number(p.qty_milli)/1000}`;
   row.innerHTML=`<span class="product-code">${clean(p.code)}</span><div class="product-info"><strong>${clean(p.name)}</strong><small>${clean(p.category||'General')} • ${clean(stock)}</small></div><div class="product-price">${p.price_cents>0?money(p.price_cents):'No price'}<small>${clean(p.unit||'each')}</small></div><button class="add-product" data-add="${p.id}" aria-label="Add ${clean(p.code)}" ${p.price_cents>0?'':'disabled'}>+</button>`;root.append(row);}
}
async function loadCategories(){if(!state.branch)return;try{const data=await api(`/api/categories?branch=${encodeURIComponent(state.branch)}`);const sel=$('#category-select');sel.replaceChildren(new Option('All departments',''));for(const name of data.categories){sel.append(new Option(name,name));}sel.value=state.category;}
  catch{$('#category-select').replaceChildren(new Option('All departments',''));}}
function lineStatus(s){return s==='AWAITING_CASH_OFFICE'?'<span class="pill warning">Awaiting review</span>':'<span class="pill positive">Reviewed</span>';}
async function loadQuotes(filter=''){if(!state.session||!state.branch)return;
  let data;try{data=await api(`/api/quotes?branch=${encodeURIComponent(state.branch)}&q=${encodeURIComponent(filter)}`);}
  catch(e){$('#quotes-table').innerHTML=`<tr><td colspan="7">${clean(e.message)}</td></tr>`;return;}
  state.quotes=data.quotations||[];const body=$('#quotes-table');body.replaceChildren();if(!state.quotes.length){body.innerHTML='<tr><td colspan="7">No matching submitted quotations.</td></tr>';return;}
  for(const r of state.quotes){const tr=document.createElement('tr');tr.innerHTML=`<td><strong>${clean(r.number)}</strong></td><td>${clean(r.customer_name)}</td><td>${new Date(r.created_at).toLocaleString('en-ZA')}</td><td>${clean(r.submitted_by_name)}</td><td>${lineStatus(r.status)}</td><td class="num"><strong>${money(r.total_cents)}</strong></td><td><button class="table-action" data-print-quote="${clean(r.number)}">Print quote</button></td>`;body.append(tr);}
}
async function loadOverview(){if(!state.session||!state.branch)return;
  try{const response=await api(`/api/summary?branch=${encodeURIComponent(state.branch)}`);const m=response.metrics;$('#metric-total').textContent=Number(m.quotes_total).toLocaleString('en-ZA');$('#metric-pending').textContent=Number(m.pending).toLocaleString('en-ZA');$('#metric-value').textContent=money(m.quoted_cents);}
  catch{$('#metric-total').textContent='—';$('#metric-pending').textContent='—';$('#metric-value').textContent='—';}
  try{const data=await api(`/api/quotes?branch=${encodeURIComponent(state.branch)}`);const root=$('#overview-quotes');root.replaceChildren();const rows=data.quotations?.slice(0,4)||[];
    if(!rows.length){root.innerHTML='<div class="empty-state"><h4>No quotations yet</h4><p>Create your first quotation to see it here.</p></div>';return;}
    for(const r of rows){const div=document.createElement('div');div.className='small-list-row';div.innerHTML=`<div><b>${clean(r.number)} • ${clean(r.customer_name)}</b><small>${new Date(r.created_at).toLocaleString('en-ZA')} • ${clean(r.status.replaceAll('_',' '))}</small></div><strong>${money(r.total_cents)}</strong>`;root.append(div);}}
  catch{$('#overview-quotes').innerHTML='<div class="empty-state">Quotation history could not be loaded.</div>';}}
async function loadCatalogue(){if(!state.branch)return;
 const q=$('#catalogue-search').value.trim();const root=$('#catalogue-results');try{
  const data=await api(`/api/products?branch=${encodeURIComponent(state.branch)}&q=${encodeURIComponent(q)}&page=1`);
  const rows=(data.products||[]).map(p=>`<tr><td><strong>${clean(p.code)}</strong></td><td>${clean(p.name)}</td><td>${clean(p.category)}</td><td>${p.qty_milli===null||p.qty_milli===undefined?'Not verified':(p.qty_milli/1000)}</td><td class="num">${p.price_cents?money(p.price_cents):'Not published'}</td><td><button class="table-action" data-catalogue-add="${p.id}" ${p.price_cents>0?'':'disabled'}>Add to quote</button></td></tr>`).join('');
  root.innerHTML=`<table class="data-table"><thead><tr><th>Code</th><th>Product name</th><th>Department</th><th>Stock on hand</th><th class="num">Selling price</th><th></th></tr></thead><tbody>${rows||'<tr><td colspan="6">No products found.</td></tr>'}</tbody></table>`;
  state.catalogueRows=data.products||[];
 }catch(e){root.innerHTML=`<div class="empty-state">${clean(e.message)}</div>`;}}
async function submitQuote(){if(state.isOffline||!state.session||!state.cart.length){toast('Reconnect and add products before submitting.','error');return;}
  state.customer=$('#customer-name').value.trim()||'Walk-in customer';state.contact=$('#customer-contact').value.trim();state.notes=$('#quote-notes').value.trim();
  if(state.customer.length>120||state.contact.length>80||state.notes.length>400){toast('Please shorten customer details.','error');return;}
  const body={request_id:state.requestId,branch:state.branch,customer_name:state.customer,customer_contact:state.contact,notes:state.notes,
    lines:state.cart.map(l=>({product_id:l.product.id,quantity:l.quantity,expected_price_cents:l.product.price_cents}))};
  const button=$('#submit-quote');button.disabled=true;button.textContent='Checking prices and saving...';
  try{const response=await api('/api/quotes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    state.lastConfirmed=response.quotation;await dbDelete('drafts',currentDraftKey());state.cart=[];state.customer='';state.contact='';state.notes='';state.requestId=newId();
    $('#customer-name').value='';$('#customer-contact').value='';$('#quote-notes').value='';renderBasket();
    toast(`${response.quotation.number} saved and sent to the Cash Office review queue.`, 'success');show('quotes');
  }catch(e){toast(e.message,'error');await saveDraft(true);}finally{button.textContent='Submit to Cash Office →';renderBasket();}}
function printQuote(quotation,draft=false){if(!quotation&&!draft){toast('No quotation is available for printing.','error');return;}
  const t=draft?quotationTotals():{net:quotation.net_cents,vat:quotation.vat_cents,total:quotation.total_cents};
  const lines=draft?state.cart.map(l=>({code:l.product.code,name:l.product.name,quantity:l.quantity,price_cents:l.product.price_cents,line_total_cents:Math.round(l.product.price_cents*l.quantity)})):quotation.lines;
  const name=draft?($('#customer-name').value||'Walk-in customer'):quotation.customer_name;
  const ref=draft?'DRAFT — NOT SUBMITTED':quotation.number;
  const date=draft?new Date().toLocaleString('en-ZA'):new Date(quotation.created_at).toLocaleString('en-ZA');
  $('#print-content').innerHTML=`<div class="print-top"><div><h1>MALIKSPOS</h1><div>Sales quotation • ${clean(state.branch)}</div><p>${date}</p></div><div><h2>${clean(ref)}</h2><div>Customer: ${clean(name)}</div></div></div>
   <table><thead><tr><th>Product code</th><th>Description</th><th>Qty</th><th class="right">Unit price</th><th class="right">Total</th></tr></thead><tbody>${lines.map(l=>`<tr><td>${clean(l.code)}</td><td>${clean(l.name)}</td><td>${l.quantity}</td><td class="right">${money(l.price_cents)}</td><td class="right">${money(l.line_total_cents)}</td></tr>`).join('')}</tbody></table>
   <p class="right">Net ${money(t.net)} | VAT included (15%) ${money(t.vat)}</p><p class="print-total">Total: ${money(t.total)}</p>
   <p class="print-note">QUOTATION ONLY — NOT AN INVOICE OR PROOF OF PAYMENT. No goods may be released without server-verified payment.</p>`;
  window.print();}
function renderModules(){$('#module-grid').innerHTML=features.map(([icon,title,desc,status])=>`<article class="module-card ${status==='live'?'live':''}"><div class="module-icon">${icon}</div><h3>${clean(title)}</h3><p>${clean(desc)}</p><div class="module-status">${status==='live'?'● ENABLED':'◌ PLANNED — NOT ACTIVATED'}</div></article>`).join('');}
// Input, navigation, and keyboard listeners.
$$('[data-route]').forEach(btn=>btn.addEventListener('click',()=>show(btn.dataset.route)));
$$('[data-action="new-quote"]').forEach(btn=>btn.addEventListener('click',()=>show('sales')));
$('#branch-select').addEventListener('change',e=>resetForBranch(e.target.value));
$('#mobile-menu').addEventListener('click',()=>$('#sidebar').classList.toggle('open'));
$('#product-search-go').addEventListener('click',()=>{state.productQuery=$('#product-search').value.trim();state.page=1;searchProducts();});
$('#product-search').addEventListener('keydown',e=>{if(e.key==='Enter'){$('#product-search-go').click();}});
$('#category-select').addEventListener('change',e=>{state.category=e.target.value;state.page=1;searchProducts();});
$('#prev-page').addEventListener('click',()=>{if(state.page>1){state.page--;searchProducts();}});
$('#next-page').addEventListener('click',()=>{if(state.more){state.page++;searchProducts();}});
$('#search-results').addEventListener('click',e=>{const b=e.target.closest('[data-add]');if(b){const p=state.products.find(x=>x.id===Number(b.dataset.add));if(p)addProduct(p);}});
$('#basket-lines').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
  if(b.hasAttribute('data-remove')){state.cart=state.cart.filter(l=>l.product.id!==Number(b.dataset.remove));renderBasket();saveDraft(true);}
  if(b.hasAttribute('data-minus')||b.hasAttribute('data-plus')){const key=b.hasAttribute('data-plus')?'plus':'minus',id=b.dataset[key],item=state.cart.find(l=>l.product.id===Number(id));if(item)adjustQty(id,Math.max(.001,item.quantity+(key==='plus'?1:-1)));}});
$('#basket-lines').addEventListener('change',e=>{if(e.target.hasAttribute('data-qty'))adjustQty(e.target.dataset.qty,e.target.value);});
$('#save-draft').addEventListener('click',()=>saveDraft());
$('#clear-quote').addEventListener('click',async()=>{if(!confirm('Clear this local quotation draft?'))return;state.cart=[];state.requestId=newId();$('#customer-name').value='';$('#customer-contact').value='';$('#quote-notes').value='';renderBasket();await dbDelete('drafts',currentDraftKey());toast('Local draft cleared.');});
$('#print-draft').addEventListener('click',()=>{if(!state.cart.length)return toast('Add products before printing.','error');printQuote(null,true);});
$('#submit-quote').addEventListener('click',submitQuote);
$('#refresh-quotes').addEventListener('click',()=>loadQuotes());
$('#quote-search-go').addEventListener('click',()=>loadQuotes($('#quote-search').value.trim()));
$('#quote-search').addEventListener('keydown',e=>{if(e.key==='Enter')$('#quote-search-go').click();});
$('#quotes-table').addEventListener('click',e=>{const b=e.target.closest('[data-print-quote]');if(b){const row=state.quotes.find(q=>q.number===b.dataset.printQuote);if(row)printQuote(row);}});
$('#catalogue-search-go').addEventListener('click',loadCatalogue);
$('#catalogue-search').addEventListener('keydown',e=>{if(e.key==='Enter')loadCatalogue();});
$('#catalogue-results').addEventListener('click',e=>{const b=e.target.closest('[data-catalogue-add]');if(!b)return;const p=state.catalogueRows?.find(x=>x.id===Number(b.dataset.catalogueAdd));if(p){addProduct(p);show('sales');}});
['customer-name','customer-contact','quote-notes'].forEach(id=>$('#'+id).addEventListener('change',()=>saveDraft(true)));
document.addEventListener('keydown',e=>{if(e.key==='F2'){e.preventDefault();show('sales');$('#product-search').focus();}if(e.key==='Escape')$('#sidebar').classList.remove('open');});
window.addEventListener('online',()=>{setConnection(true);if(!state.session)sessionStart();else{toast('Online again. Review prices before submission.','success');if(state.screen==='sales')searchProducts();}});
window.addEventListener('offline',()=>setConnection(false));
$('#greeting').textContent=new Date().getHours()<12?'morning':new Date().getHours()<17?'afternoon':'evening';
renderModules();renderBasket();setConnection(navigator.onLine);sessionStart();
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}));

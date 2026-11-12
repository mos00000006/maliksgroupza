import { POWERBUILD_LOGO_BASE64 } from './powerbuild-logo.mjs';

const POWERBUILD_LOGO_BYTES = Uint8Array.from(atob(POWERBUILD_LOGO_BASE64), c => c.charCodeAt(0));

const APPS={
  pos:{name:'Maliks POS',subtitle:'Sales & Quotations',hint:'Product search, VAT-inclusive quotations, quotation history and printing. No till payment or dispatch posting.'},
  tills:{name:'Maliks Tills',subtitle:'Cashier Workstation',hint:'Phase 4: record till opening float and shift closing cash count, and preview quotes. NOT A LIVE PAYMENT SYSTEM: no payment, tax invoice, cash-up reconciliation or stock movement.'},
  cashoffice:{name:'Maliks Cash Office',subtitle:'Cash Office Workstation',hint:'Review quotations and branch till shift records (read-only). No payment posting, cash-up approval or invoice processing.'},
  dispatch:{name:'Maliks Dispatch',subtitle:'Dispatch Workstation',hint:'Dispatch is a separate secured application. Picking, checking, POD and stock posting will be connected in a later phase.'},
};
function page(app){
 const d=APPS[app];
 const releaseLabel=app==='dispatch'?'PHASE 1 — CONTROLLED RELEASE':app==='tills'?'PHASE 4 — TILL SHIFTS':app==='cashoffice'?'PHASE 4 — SHIFT REVIEW':'PHASE 2 — QUOTATION RELEASE';
 return `<!doctype html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
 <title>${d.name}</title><link rel="icon" type="image/png" href="/powerbuild-logo.png"/><meta name="theme-color" content="#102a4b"/><style>
 :root{font-family:Inter,Arial,sans-serif;color:#19263b;background:#eff3f8}*{box-sizing:border-box}
 body{margin:0}.shell{display:grid;grid-template-columns:240px 1fr;min-height:100vh}
 aside{background:#102a4b;color:#fff;padding:28px 18px}aside h1{font-size:21px;margin:14px 0 5px}aside p{font-size:13px;color:#adbed0}
 aside .brand-logo{display:block;width:112px;height:112px;max-width:100%;object-fit:contain}
 .nav{margin-top:35px;background:#21436b;padding:13px;border-radius:10px;font-weight:700}
 .foot{font-size:12px;color:#aabbd0;margin-top:34px;line-height:1.6}
 main{max-width:1200px;padding:34px 38px;width:100%;margin:0 auto}
 .top{display:flex;justify-content:space-between;gap:14px;align-items:center;flex-wrap:wrap;margin-bottom:28px}
 h2{font-size:28px;margin:0 0 6px}h3{font-size:19px;margin:0 0 14px}p{line-height:1.5}.muted{color:#607187;font-size:14px}
 .tag{background:#fef3c7;border:1px solid #eab308;border-radius:6px;padding:7px 10px;color:#785217;font-weight:700;font-size:11px}
 .panel{background:white;padding:22px;border:1px solid #dae2ec;border-radius:15px;box-shadow:0 6px 24px #1529480b;margin-bottom:18px}
 .bar{display:flex;gap:12px;align-items:end;flex-wrap:wrap;margin:18px 0}.bar>*{flex:1 1 170px}
 label{font-weight:700;font-size:12px;display:block;margin:0 0 7px}input,select,textarea{width:100%;border:1px solid #bdc9d9;border-radius:7px;padding:11px;font:inherit;background:#fff;color:#19263b}
 input:focus,select:focus,textarea:focus{outline:2px solid #8fc1f6;outline-offset:1px}
 button{border:0;border-radius:8px;padding:11px 17px;font:inherit;font-weight:700;background:#165eab;color:white;cursor:pointer}
 button:disabled{background:#a4b4c7;cursor:not-allowed}.secondary{background:#eaf0f7;color:#21486f}
 table{border-collapse:collapse;width:100%;font-size:13px}th,td{border-bottom:1px solid #e1e8f0;padding:11px 8px;text-align:left;vertical-align:top}th{font-size:12px;color:#52657d}td:last-child,th:last-child{text-align:right}
 .scroll{overflow-x:auto}.two{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(290px,0.8fr);gap:18px}
 .notice{background:#eaf4ff;color:#124979;border-left:4px solid #3381ce;padding:14px 18px;font-size:13px;border-radius:5px;margin-bottom:21px}
 .error{color:#991b1b;background:#fee2e2;border:1px solid #f4a3a3;padding:12px;border-radius:7px;margin:12px 0}.success{color:#166534;background:#dcfce7;padding:12px;border-radius:7px}
 .items{display:grid;gap:8px}.item{display:flex;justify-content:space-between;align-items:center;gap:8px;border-bottom:1px solid #e8eef5;padding:10px 0}.item div{min-width:0}.item small{color:#63748a;display:block;margin-top:4px}
 .item button{white-space:nowrap}.price{font-weight:800;color:#165eab}.empty{color:#738299;font-size:14px;padding:25px 5px;text-align:center}
 .total{font-size:24px;font-weight:800;text-align:right;color:#12395e;padding:16px 0}
 .tiny{font-size:12px;color:#63748a}.widebutton{width:100%}
 .small-btn{font-size:12px;padding:7px 10px}.basket-header{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap}
 .amount-row{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #e9eef5;padding:10px 0;font-size:14px}
 .grand-total{font-size:20px;font-weight:800;border-bottom:0;color:#12395e;margin-bottom:12px}.training-warning{border:2px solid #b45309;background:#fffbeb;padding:12px;border-radius:9px;color:#92400e;font-weight:700;margin:12px 0}.lookup-output{margin-top:14px}.tender-preview{border:2px dashed #94a3b8;padding:16px;border-radius:9px;margin:12px 0;background:#f8fafc}.tender-preview .total{margin:2px 0;padding:4px 0}.tender-preview label{margin-top:10px}
 .row-actions{text-align:right;white-space:nowrap}.row-actions button+button{margin-left:6px}.quote-detail{background:#f7fafe;border:1px solid #e0e8f0;border-radius:8px;padding:14px}
 .quote-detail p{margin:7px 0}.detail-total{font-size:14px;font-weight:700;text-align:right}
 td input[type=number]{min-width:86px;width:95px;padding:8px}.shift-form{display:grid;grid-template-columns:repeat(auto-fit,minmax(185px,1fr));gap:12px;align-items:end}.shift-form button{margin-bottom:1px}.shift-form .info{grid-column:1/-1}.print-sheet{display:none}
 @media print{body{background:#fff}.shell{display:none!important}.print-sheet{display:block!important;color:#111;font:12pt Arial,sans-serif;padding:10mm}
 .print-sheet .print-logo{width:110px;height:auto;object-fit:contain}.print-sheet h1{font-size:21pt}.print-sheet p{margin:6px 0}
 .print-sheet .print-warning{font-weight:bold;border:2px solid #000;padding:9px}.print-sheet .quote-detail{border:0;background:none;padding:0}
 .print-sheet table{font-size:10pt}.print-sheet th,.print-sheet td{border-bottom:1px solid #ccc;padding:7px 4px}.print-sheet .tiny{font-size:9pt}}

 @media(max-width:850px){.shell{grid-template-columns:1fr}aside{padding:15px 20px;display:flex;align-items:center;gap:14px}aside h1{margin:0;font-size:17px}aside .brand-logo{width:56px;height:56px;flex:0 0 56px}aside .nav,aside .foot,aside p{display:none}main{padding:23px 14px}.two{grid-template-columns:1fr}}
 </style></head><body>
 <div class="shell"><aside><img class="brand-logo" src="/powerbuild-logo.png" alt="PowerBuild logo" width="112" height="112"/><div><h1>${d.name}</h1><p>${d.subtitle}</p></div><div class="nav">${d.subtitle}</div><p class="foot">Restricted department workstation. All activity is associated with your approved Maliks account and assigned branch.</p></aside>
 <main><div class="top"><div><h2>${d.name}</h2><div class="muted" id="signed-in">Checking approved user access…</div></div><span class="tag">${releaseLabel}</span></div>
 <div class="notice">${d.hint}</div><div id="error" role="alert" hidden></div>
 <div class="panel"><div class="bar"><div><label for="branch">Assigned branch</label><select id="branch" disabled><option>Authorising…</option></select></div><div><label>Application access</label><p class="muted" id="access">Verification in progress…</p></div></div></div>
 <div id="app-content"></div>
 </main></div><script type="module">
 const APP=${JSON.stringify(app)};
 const E=id=>document.getElementById(id);
 const h=(tag,text='',cls='')=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=String(text);if(cls)el.className=cls;return el;};
 const api=async (url,opts)=>{const r=await fetch(url,{credentials:'same-origin',cache:'no-store',...opts});let data;try{data=await r.json();}catch{throw Error('Unexpected service response.');}if(!r.ok)throw Error(data.error||'Request failed');return data;};
 const money=c=>new Intl.NumberFormat('en-ZA',{style:'currency',currency:'ZAR'}).format(c/100);
 const err=message=>{const e=E('error');e.hidden=!message;e.textContent=message||'';e.className='error';};
 const panel=title=>{const p=h('section',undefined,'panel');p.append(h('h3',title));return p;};
 const cell=(row,text,tag='td')=>row.append(h(tag,text));
 const showDate=value=>{if(!value)return '—';const d=new Date(value);return Number.isNaN(d.getTime())?value:new Intl.DateTimeFormat('en-ZA',{dateStyle:'medium',timeStyle:'short',timeZone:'Africa/Johannesburg'}).format(d);};
 const calcBasket=()=>{const total=basket.reduce((s,l)=>s+Math.round(l.product.price_cents*l.quantity),0);const vat=Math.round(total*15/115);return {total,vat,net:total-vat};};
 let branch='',basket=[],pendingQuote=null,recentQuotes=[],quoteRows=[],pendingShiftAction=null;
 function selectBranch(){
   const incoming=E('branch').value;
   if(pendingQuote){E('branch').value=branch;err('Finish or release the pending quotation before changing branch.');return;}
   if(basket.length && !window.confirm('Changing branch will clear the quotation basket. Continue?')){E('branch').value=branch;return;}
   branch=incoming;basket=[];recentQuotes=[];quoteRows=[];pendingShiftAction=null;draw();
 }
 async function searchProducts(){
   err('');const q=E('search')?.value.trim();if(!q){err('Enter a product name or code.');return;}
   const searchBranch=branch;E('results').textContent='Searching catalogue…';
   try{
     const data=await api('/api/catalogue?branch='+encodeURIComponent(searchBranch)+'&q='+encodeURIComponent(q));
     if(searchBranch!==branch)return;
     const area=E('results');area.replaceChildren();
     if(!Array.isArray(data.products)||!data.products.length){area.append(h('div','No active priced products found.','empty'));return;}
     for(const p of data.products){
       const r=h('div',undefined,'item');const info=h('div');
       info.append(h('strong',p.name),h('small',p.code+' · '+p.unit),h('small',money(p.price_cents),'price'));
       const b=h('button','Add');b.type='button';b.disabled=!!pendingQuote;
       b.addEventListener('click',()=>{
         if(pendingQuote)return;
         const existing=basket.find(x=>x.product.id===p.id);
         if(existing)existing.quantity=Math.min(9999,existing.quantity+1);
         else basket.push({product:p,quantity:1});
         E('confirmation').replaceChildren();drawBasket();
       });
       r.append(info,b);area.append(r);
     }
   }catch(e){err(e.message);E('results').textContent='';}
 }
 function setDraftLocked(locked){
   for(const id of ['branch','customer','contact','notes']){const el=E(id);if(el)el.disabled=locked;}
   const results=E('results');if(results)for(const b of results.querySelectorAll('button'))b.disabled=locked;
   const reset=E('release-pending');if(reset)reset.hidden=!locked;
 }
 function drawBasket(){
   const tbody=E('basket-rows');if(!tbody)return;tbody.replaceChildren();
   for(const line of basket){
     const r=h('tr');const product=h('td');product.append(h('strong',line.product.name),h('small',line.product.code+' · '+line.product.unit));r.append(product);
     const q=h('td');const n=h('input');n.type='number';n.min='0.001';n.max='9999';n.step='0.001';n.value=line.quantity;n.disabled=!!pendingQuote;n.setAttribute('aria-label','Quantity for '+line.product.name);
     n.addEventListener('change',()=>{
       if(pendingQuote)return;
       const val=Number(n.value);
       if(!Number.isFinite(val)||val<0.001||val>9999||Math.abs(val*1000-Math.round(val*1000))>0.000001){err('Quantity must be between 0.001 and 9999, at most three decimal places.');n.value=line.quantity;return;}
       line.quantity=val;E('confirmation').replaceChildren();drawBasket();
     });q.append(n);r.append(q);
     cell(r,money(Math.round(line.product.price_cents*line.quantity)));
     const act=h('td');const remove=h('button','Remove','secondary small-btn');remove.type='button';remove.disabled=!!pendingQuote;
     remove.setAttribute('aria-label','Remove '+line.product.name);
     remove.addEventListener('click',()=>{if(pendingQuote)return;basket=basket.filter(x=>x.product.id!==line.product.id);E('confirmation').replaceChildren();drawBasket();});act.append(remove);r.append(act);tbody.append(r);
   }
   const amount=calcBasket();E('net').textContent=money(amount.net);E('vat').textContent=money(amount.vat);E('total').textContent=money(amount.total);
   E('quote-btn').disabled=!basket.length;E('quote-btn').textContent=pendingQuote?'Retry same quotation':'Send quotation to Cash Office';
   E('clear-basket').disabled=!basket.length||!!pendingQuote;
   setDraftLocked(!!pendingQuote);
 }
 function releasePending(){
   if(!pendingQuote)return;
   if(!window.confirm('A previous submission may have been saved. Check My Recent Quotations before starting a new request. Release this pending request?'))return;
   pendingQuote=null;err('');drawBasket();
 }
 async function sendQuote(){
   err('');if(!basket.length)return;
   const submit=E('quote-btn');submit.disabled=true;
   if(!pendingQuote){
     const customer=E('customer').value.trim()||'Walk-in customer';
     const contact=E('contact').value.trim();const notes=E('notes').value.trim();
     if(customer.length>120||contact.length>80||notes.length>400){err('Customer details are too long.');submit.disabled=false;return;}
     pendingQuote={request_id:crypto.randomUUID(),branch,customer_name:customer,customer_contact:contact,notes,
       lines:basket.map(x=>({product_id:x.product.id,quantity:x.quantity,expected_price_cents:x.product.price_cents}))};
   }
   drawBasket();submit.disabled=true;
   try{
     const data=await api('/api/quotes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(pendingQuote)});
     E('confirmation').className='success';
     E('confirmation').textContent='Quotation '+data.quotation.number+' sent to Cash Office. It is NOT paid, invoiced or approved for dispatch.';
     pendingQuote=null;basket=[];
     E('customer').value='';E('contact').value='';E('notes').value='';
     drawBasket();await loadOwnQuotes();
   }catch(e){
     err(e.message+' Submission is not confirmed. Check My Recent Quotations or retry the SAME request; do not create a second quotation.');
     drawBasket();
   }
 }
 function makeQuoteTable(target){
   const table=h('table');const head=h('thead');const tr=h('tr');
   for(const heading of ['Quotation','Customer','Status','Submitted','Total','Actions'])cell(tr,heading,'th');
   head.append(tr);table.append(head);const body=h('tbody');body.id=target;table.append(body);
   const sc=h('div',undefined,'scroll');sc.append(table);return sc;
 }
 function quoteDetails(row){
   const wrapper=h('div',undefined,'quote-detail');
   wrapper.append(h('p','Submitted by: '+(row.submitted_by_name||'—')+'  |  Contact: '+(row.customer_contact||'—'),'tiny'));
   if(row.notes)wrapper.append(h('p','Notes: '+row.notes,'tiny'));
   const tbl=h('table');const head=h('thead');const hr=h('tr');
   for(const name of ['Code','Product','Qty','Price (incl. VAT)','Line total'])cell(hr,name,'th');head.append(hr);tbl.append(head);
   const body=h('tbody');for(const line of row.lines||[]){
     const r=h('tr');for(const val of [line.code,line.name,String(line.quantity)+' '+line.unit,money(line.price_cents),money(line.line_total_cents)])cell(r,val);body.append(r);
   }
   tbl.append(body);const sc=h('div',undefined,'scroll');sc.append(tbl);wrapper.append(sc);
   wrapper.append(h('p','Net '+money(row.net_cents)+'  ·  VAT (15%) '+money(row.vat_cents)+'  ·  Total '+money(row.total_cents),'detail-total'));
   wrapper.append(h('p','Quotation only. No payment or dispatch authorisation has been recorded.','tiny'));
   return wrapper;
 }
 function printQuote(row){
   E('print-sheet')?.remove();
   const sheet=h('section',undefined,'print-sheet');sheet.id='print-sheet';
   const img=h('img');img.src='/powerbuild-logo.png';img.alt='PowerBuild';img.className='print-logo';sheet.append(img);
   sheet.append(h('h1','QUOTATION '+row.number));
   sheet.append(h('p','Quotation only — NOT a tax invoice, paid receipt or dispatch instruction.','print-warning'));
   for(const value of ['Branch: '+row.branch,'Customer: '+row.customer_name,
      'Contact: '+(row.customer_contact||'—'),'Prepared by: '+(row.submitted_by_name||'—'),
      'Submitted: '+showDate(row.created_at),'Status: '+row.status])sheet.append(h('p',value));
   sheet.append(quoteDetails(row));document.body.append(sheet);
   window.addEventListener('afterprint',()=>sheet.remove(),{once:true});window.print();
 }
 function renderQuotes(target,list){
   const body=E(target);if(!body)return;body.replaceChildren();
   if(!list.length){const r=h('tr');const c=h('td','No quotations found.','empty');c.colSpan=6;r.append(c);body.append(r);return;}
   for(const row of list){
     const r=h('tr');for(const val of [row.number,row.customer_name,row.status,showDate(row.created_at),money(row.total_cents)])cell(r,val);
     const td=h('td',undefined,'row-actions');const view=h('button','Details','secondary small-btn');view.type='button';
     view.setAttribute('aria-expanded','false');
     const print=h('button','Print','secondary small-btn');print.type='button';print.addEventListener('click',()=>printQuote(row));
     td.append(view,print);r.append(td);body.append(r);
     const detailRow=h('tr');detailRow.hidden=true;const c=h('td');c.colSpan=6;c.append(quoteDetails(row));detailRow.append(c);body.append(detailRow);
     view.addEventListener('click',()=>{detailRow.hidden=!detailRow.hidden;view.setAttribute('aria-expanded',String(!detailRow.hidden));view.textContent=detailRow.hidden?'Details':'Hide';});
   }
 }
 function posView(){
   const root=E('app-content');const two=h('div',undefined,'two');const lookup=panel('Product catalogue');
   const bar=h('div',undefined,'bar');const field=h('div');const l=h('label','Search products');l.htmlFor='search';field.append(l);
   const input=h('input');input.id='search';input.placeholder='Enter product code or name';input.maxLength=100;
   input.addEventListener('keydown',ev=>{if(ev.key==='Enter')searchProducts();});field.append(input);
   const b=h('button','Search');b.addEventListener('click',searchProducts);bar.append(field,b);lookup.append(bar);
   const res=h('div','Search by product name or code.','items');res.id='results';lookup.append(res);
   const checkout=panel('Quotation basket');const controls=h('div',undefined,'basket-header');
   controls.append(h('p','Prices are VAT-inclusive. Quotes do not reserve stock.','tiny'));
   const clear=h('button','Clear basket','secondary small-btn');clear.type='button';clear.id='clear-basket';
   clear.addEventListener('click',()=>{if(!basket.length||!window.confirm('Remove every item from the basket?'))return;basket=[];drawBasket();});
   controls.append(clear);checkout.append(controls);
   const table=h('table');const head=h('thead');const hr=h('tr');for(const heading of ['Product','Qty','Amount',''])cell(hr,heading,'th');head.append(hr);table.append(head);const body=h('tbody');body.id='basket-rows';table.append(body);const sc=h('div',undefined,'scroll');sc.append(table);checkout.append(sc);
   for(const [id,label] of [['net','Net amount (excl. VAT)'],['vat','VAT included (15%)'],['total','Total (incl. VAT)']]){
     const r=h('div',undefined,id==='total'?'amount-row grand-total':'amount-row');r.append(h('span',label));const num=h('strong','R 0,00');num.id=id;r.append(num);checkout.append(r);
   }
   for(const [id,label,placeholder] of [['customer','Customer name','Walk-in customer'],['contact','Customer contact','Optional'],['notes','Notes','Optional']]){
     const l=h('label',label);l.htmlFor=id;const inp=h('input');inp.id=id;inp.placeholder=placeholder;inp.maxLength=id==='notes'?400:id==='customer'?120:80;checkout.append(l,inp);
   }
   const send=h('button','Send quotation to Cash Office','widebutton');send.id='quote-btn';send.disabled=true;send.addEventListener('click',sendQuote);checkout.append(send);
   const release=h('button','Release pending request (after checking quotations)','secondary widebutton');release.id='release-pending';release.type='button';release.hidden=true;release.addEventListener('click',releasePending);checkout.append(release);
   checkout.append(h('p','This action only submits a quotation. No payment, tax invoice, stock deduction or dispatch release occurs.','tiny'));
   const confirmation=h('div');confirmation.id='confirmation';checkout.append(confirmation);two.append(lookup,checkout);root.append(two);
   const recent=panel('My recent quotations');const controls2=h('div',undefined,'bar');const refresh=h('button','Refresh my quotations','secondary');refresh.addEventListener('click',loadOwnQuotes);controls2.append(refresh);recent.append(controls2);
   recent.append(makeQuoteTable('own-quotes'));recent.append(h('p','Only quotations submitted by your current signed-in account and selected branch are shown.','tiny'));root.append(recent);
   drawBasket();void loadOwnQuotes();
 }
 async function loadOwnQuotes(){
   const body=E('own-quotes');if(!body)return;const selected=branch;body.replaceChildren();const row=h('tr');const c=h('td','Loading quotations…');c.colSpan=6;row.append(c);body.append(row);
   try{const data=await api('/api/quotes?branch='+encodeURIComponent(selected));if(selected!==branch)return;recentQuotes=data.quotes||[];renderQuotes('own-quotes',recentQuotes);}
   catch(e){if(selected!==branch)return;const r=h('tr');const td=h('td','Could not load quotations: '+e.message);td.colSpan=6;r.append(td);body.replaceChildren(r);}
 }
 /** Cash maths is local to this page. It never calls an API or records a tender. */
 function tenderPreview(row){
   const area=h('section',undefined,'tender-preview');
   area.append(h('h3','Cash change calculator — TRAINING ONLY'));
   area.append(h('p','NO PAYMENT RECORDED. No receipt, invoice, till transaction or stock posting will be created.','training-warning'));
   area.append(h('p','Amount due: '+money(row.total_cents),'price'));
   const name=h('label','Cash received (R)');name.htmlFor='cash-preview';area.append(name);
   const amount=h('input');amount.id='cash-preview';amount.type='text';amount.inputMode='decimal';amount.placeholder='Example: 500.00';amount.maxLength=12;area.append(amount);
   const output=h('p','Enter a cash amount to calculate change or a shortfall.','muted');output.setAttribute('aria-live','polite');area.append(output);
   amount.addEventListener('input',()=>{
     const text=amount.value.trim();
     if(!text){output.textContent='Enter a cash amount to calculate change or a shortfall.';return;}
     if(!/^(?:0|[1-9]\d{0,8})(?:\.\d{1,2})?$/.test(text)){
       output.textContent='Invalid amount. Use rand and up to two decimals, e.g. 500.00.';return;
     }
     const parts=text.split('.');const paid=Number(parts[0])*100+Number((parts[1]||'').padEnd(2,'0'));
     if(!Number.isSafeInteger(paid)||paid>1000000000){output.textContent='Amount exceeds the preview limit.';return;}
     const difference=paid-row.total_cents;
     output.textContent=difference>=0?'Change to return (preview): '+money(difference):'Cash shortfall (preview): '+money(-difference);
   });
   return area;
 }
 async function exactLookup(){
   const field=E('quote-number'),output=E('exact-result');if(!field||!output)return;
   const number=field.value.trim().toUpperCase();output.replaceChildren();
   if(!/^Q-\d{1,12}$/.test(number)){output.append(h('div','Use the quotation number, for example Q-00000001.','error'));return;}
   const selected=branch;output.append(h('p','Looking up '+number+'…','muted'));
   try{
     const data=await api('/api/quotes/find?branch='+encodeURIComponent(selected)+'&number='+encodeURIComponent(number));
     if(selected!==branch)return;output.replaceChildren();const row=data.quotation;
     output.append(h('h3','Quotation '+row.number),quoteDetails(row));
     const print=h('button','Print quotation','secondary small-btn');print.addEventListener('click',()=>printQuote(row));output.append(print);
     if(APP==='tills')output.append(tenderPreview(row));
   }catch(error){if(selected!==branch)return;output.replaceChildren(h('div',error.message,'error'));}
 }

 const randToCents=(value,maximum=100000000)=>{
   const text=String(value??'').trim();
   if(!/^(?:0|[1-9]\\d{0,7})(?:\\.\\d{1,2})?$/.test(text))throw Error('Enter a valid cash amount in rand, e.g. 250.00.');
   const parts=text.split('.');const n=Number(parts[0])*100+Number((parts[1]||'').padEnd(2,'0'));
   if(!Number.isSafeInteger(n)||n>maximum)throw Error('Amount is outside the allowed range.');
   return n;
 };
 const postShift=(endpoint,body)=>api(endpoint,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
 function shiftRow(t){
   const tr=h('tr');for(const val of ['#'+t.id,t.till_code,t.status,t.opened_by_name,showDate(t.opened_at),money(t.opening_float_cents),t.closed_at?money(t.counted_cash_cents):'—',showDate(t.closed_at)])cell(tr,val);
   return tr;
 }
 async function loadShifts(){
   const container=E('shift-history'),form=E('shift-current');if(!container||!form)return;
   const selected=branch;container.textContent='Loading shifts…';form.replaceChildren();
   try{
     const data=await api('/api/till-shifts?branch='+encodeURIComponent(selected));
     if(branch!==selected)return;
     const rows=data.shifts||[];
     const open=rows.find(s=>s.status==='OPEN');
     if(APP==='tills'){
       if(open){
         form.append(h('p','Open shift #'+open.id+' · Till '+open.till_code+' · Opened '+showDate(open.opened_at)+' · Float '+money(open.opening_float_cents),'success'));
         const inputs=h('div',undefined,'shift-form');const countWrap=h('div');const countLabel=h('label','Closing cash count (R)');countLabel.htmlFor='shift-count';
         const count=h('input');count.id='shift-count';count.placeholder='Example: 500.00';count.inputMode='decimal';count.maxLength=12;countWrap.append(countLabel,count);
         const noteWrap=h('div');const noteLabel=h('label','Closing notes');noteLabel.htmlFor='shift-note';const note=h('input');note.id='shift-note';note.maxLength=400;note.placeholder='Optional';noteWrap.append(noteLabel,note);
         const btn=h('button','Close my shift');btn.addEventListener('click',async()=>{
           err('');try{
             const cash=randToCents(count.value,1000000000);const notes=note.value.trim();
             if(pendingShiftAction&&pendingShiftAction.kind!=='close')throw Error('Finish your previous shift action first.');
             if(pendingShiftAction&&(pendingShiftAction.body.counted_cash_cents!==cash||pendingShiftAction.body.close_notes!==notes))throw Error('A previous close attempt may have succeeded. Retry using the same amount and note.');
             const body=pendingShiftAction?.body||{request_id:crypto.randomUUID(),branch:selected,shift_id:open.id,counted_cash_cents:cash,close_notes:notes};
             pendingShiftAction={kind:'close',body};btn.disabled=true;
             await postShift('/api/till-shifts/close',body);pendingShiftAction=null;await loadShifts();
           }catch(e){err(e.message);btn.disabled=false;}
         });
         inputs.append(countWrap,noteWrap,btn);form.append(inputs);
       }else{
         form.append(h('p','No open shift for your account. Opening a shift records responsibility for this till, not a payment.','muted'));
         const fields=h('div',undefined,'shift-form');const codeWrap=h('div');const codeLabel=h('label','Till number / code');codeLabel.htmlFor='till-code';
         const code=h('input');code.id='till-code';code.placeholder='TILL-01';code.maxLength=20;codeWrap.append(codeLabel,code);
         const floatWrap=h('div');const floatLabel=h('label','Opening float (R)');floatLabel.htmlFor='till-float';const amount=h('input');amount.id='till-float';amount.inputMode='decimal';amount.placeholder='Example: 250.00';amount.maxLength=12;floatWrap.append(floatLabel,amount);
         const btn=h('button','Open my till shift');btn.addEventListener('click',async()=>{
           err('');try{
             const cash=randToCents(amount.value);const till=code.value.trim().toUpperCase();
             if(!/^[A-Z0-9][A-Z0-9_-]{0,19}$/.test(till))throw Error('Enter a till code, e.g. TILL-01.');
             if(pendingShiftAction&&pendingShiftAction.kind!=='open')throw Error('Finish your previous shift action first.');
             if(pendingShiftAction&&(pendingShiftAction.body.opening_float_cents!==cash||pendingShiftAction.body.till_code!==till))throw Error('A previous open attempt may have succeeded. Retry using the same till and float.');
             const body=pendingShiftAction?.body||{request_id:crypto.randomUUID(),branch:selected,till_code:till,opening_float_cents:cash};
             pendingShiftAction={kind:'open',body};btn.disabled=true;
             await postShift('/api/till-shifts/open',body);pendingShiftAction=null;await loadShifts();
           }catch(e){err(e.message);btn.disabled=false;}
         });
         fields.append(codeWrap,floatWrap,btn);form.append(fields);
       }
     }else form.append(h('p','Cash Office view is read-only. Open / close must be performed by the signed-in cashier in Maliks Tills.','muted'));
     container.replaceChildren();
     if(!rows.length){container.append(h('div','No till shifts recorded for this branch.','empty'));return;}
     const table=h('table');const head=h('thead');const tr=h('tr');for(const col of ['Shift','Till','Status','Opened by','Opened at','Opening float','Closing count','Closed at'])cell(tr,col,'th');head.append(tr);table.append(head);
     const tb=h('tbody');for(const row of rows)tb.append(shiftRow(row));table.append(tb);const sc=h('div',undefined,'scroll');sc.append(table);container.append(sc);
   }catch(error){if(branch!==selected)return;container.replaceChildren(h('p','Could not load shifts: '+error.message,'error'));}
 }
 function tillShiftView(){
   const p=panel(APP==='tills'?'My Till Shift Register':'Till Shift Register — Cash Office Review');
   p.append(h('p','OPEN/CLOSE REGISTER ONLY. Opening float and closing count are employee declarations, not reconciled takings. No sales, deposits, invoices or stock balances are posted.','training-warning'));
   const current=h('div');current.id='shift-current';p.append(current);
   const bar=h('div',undefined,'bar');const refresh=h('button','Refresh shift register','secondary');refresh.addEventListener('click',loadShifts);bar.append(refresh);p.append(bar);
   const history=h('div','Loading shifts…');history.id='shift-history';p.append(history);
   const note=h('p',APP==='tills'?'Only your own shifts for the selected branch are visible. One cashier and one till may each have only one open shift.':'The selected branch’s latest 75 shifts are shown for Cash Office review.','tiny');p.append(note);
   return p;
 }

 async function quoteView(){
   const root=E('app-content');
   if(APP==='tills'||APP==='cashoffice'){root.append(tillShiftView());void loadShifts();}
   const lookup=panel('Find quotation by exact number');
   const lookupBar=h('div',undefined,'bar');const lookupField=h('div');
   const lookupLabel=h('label','Quotation number');lookupLabel.htmlFor='quote-number';
   const lookupInput=h('input');lookupInput.id='quote-number';lookupInput.placeholder='Q-00000001';lookupInput.maxLength=14;
   lookupInput.addEventListener('keydown',ev=>{if(ev.key==='Enter')void exactLookup();});
   lookupField.append(lookupLabel,lookupInput);
   const lookupButton=h('button','Find quotation');lookupButton.type='button';lookupButton.addEventListener('click',exactLookup);
   lookupBar.append(lookupField,lookupButton);lookup.append(lookupBar);
   const exactResult=h('div',undefined,'lookup-output');exactResult.id='exact-result';lookup.append(exactResult);
   lookup.append(h('p','Exact lookup can find older quotations that are no longer in the recent-50 list, but only for your assigned branch.','tiny'));
   root.append(lookup);
   const queue=panel(APP==='tills'?'Recent quotations — training mode':'Cash Office — submitted quotations');
   const bar=h('div',undefined,'bar');const field=h('div');const label=h('label','Filter by quote number, customer or contact');label.htmlFor='quote-filter';const search=h('input');search.id='quote-filter';search.placeholder='Search the 50 most recent quotations';
   search.addEventListener('input',()=>{const q=search.value.trim().toLowerCase();renderQuotes('quotes',quoteRows.filter(x=>[x.number,x.customer_name,x.customer_contact,x.status].some(v=>String(v||'').toLowerCase().includes(q))));});
   field.append(label,search);const refresh=h('button','Refresh quotations','secondary');refresh.addEventListener('click',loadQuotes);bar.append(field,refresh);queue.append(bar);
   queue.append(makeQuoteTable('quotes'));
   queue.append(h('p','Read-only handover: quotations are not marked paid, invoiced or approved for dispatch. The cash calculator is a local training preview only.','tiny'));root.append(queue);await loadQuotes();
 }
 async function loadQuotes(){
   err('');const body=E('quotes');if(!body)return;const selected=branch;quoteRows=[];renderQuotes('quotes',[]);
   try{const data=await api('/api/quotes?branch='+encodeURIComponent(selected));if(selected!==branch)return;quoteRows=data.quotes||[];
     const q=E('quote-filter')?.value.trim().toLowerCase()||'';renderQuotes('quotes',quoteRows.filter(x=>[x.number,x.customer_name,x.customer_contact,x.status].some(v=>String(v||'').toLowerCase().includes(q))));}
   catch(e){if(selected!==branch)return;err(e.message);renderQuotes('quotes',[]);}
 }
 function dispatchView(){
   const p=panel('Dispatch will operate here');p.append(h('p','This independent dispatch site is secured and branch-scoped. The production pick, check, stage, load, exit-control and signed POD workflows must be connected before use.','muted'));
   const steps=h('ol');for(const text of ['Paid orders received from Tills','Picker assignment and staging','Checker verification and dispatch bay','Security exit signature or driver POD','Automatic update to Management Hub'])steps.append(h('li',text));p.append(steps);E('app-content').append(p);
 }
 function draw(){E('app-content').replaceChildren();err('');if(APP==='pos')posView();else if(APP==='dispatch')dispatchView();else void quoteView();}
 try{
   const session=await api('/api/session');E('signed-in').textContent=session.user.name+' · '+session.user.role;
   E('access').textContent=session.branches.length+' assigned branch(es)';const select=E('branch');select.replaceChildren();
   for(const b of session.branches){const o=h('option',b);o.value=b;select.append(o);}select.disabled=false;branch=select.value;select.addEventListener('change',selectBranch);draw();
 }catch(e){E('signed-in').textContent='Access unavailable';E('access').textContent='Not authorised';err(e.message+' Contact your Hub administrator to verify department role and branch assignment.');}
 </script></body></html>`;
}
export default {
 async fetch(req,env){
   const kind=String(env.APP_TYPE||'').toLowerCase();
   if(!APPS[kind])return new Response('Misconfigured application.',{status:503});
   const url=new URL(req.url);
   if(url.pathname==='/powerbuild-logo.png' && req.method==='GET')return new Response(POWERBUILD_LOGO_BYTES,{headers:{'content-type':'image/png','cache-control':'public, max-age=3600','x-content-type-options':'nosniff'}});
   if(url.pathname==='/' && req.method==='GET')return new Response(page(kind),{headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer'}});
   const pathMap={'/api/session':'/v1/session','/api/catalogue':'/v1/catalogue','/api/quotes':'/v1/quotes','/api/quotes/find':'/v1/quotes/find',
     '/api/till-shifts':'/v1/till-shifts','/api/till-shifts/open':'/v1/till-shifts/open','/api/till-shifts/close':'/v1/till-shifts/close'};
   const path=pathMap[url.pathname];
   if(!path)return Response.json({error:'Unknown API.'},{status:404});
   if(!['GET','POST'].includes(req.method))return Response.json({error:'Method not allowed.'},{status:405});
   if(req.method==='POST' && !['/api/quotes','/api/till-shifts/open','/api/till-shifts/close'].includes(url.pathname))return Response.json({error:'Method not allowed.'},{status:405});
   // No public CORS. Require same-origin for all browser-initiated writes.
   if(req.method==='POST' && req.headers.get('origin')!==url.origin)return Response.json({error:'Invalid request origin.'},{status:403});
   const token=req.headers.get('cf-access-jwt-assertion');
   if(!token)return Response.json({error:'Cloudflare Access application login required.'},{status:401,headers:{'cache-control':'no-store'}});
   const headers=new Headers({'cf-access-jwt-assertion':token,'x-maliks-app':kind,'x-maliks-original-origin':url.origin});
   if(req.method==='POST'){headers.set('content-type','application/json');headers.set('origin',url.origin);}
   const target=new URL('https://maliks-core.internal'+path+url.search);
   const response=await env.CORE.fetch(new Request(target,{method:req.method,headers,body:req.method==='POST'?req.body:undefined,duplex:req.method==='POST'?'half':undefined}));
   const h=new Headers({'cache-control':'no-store','x-content-type-options':'nosniff','content-type':'application/json'});
   return new Response(response.body,{status:response.status,headers:h});
 }
};

import { POWERBUILD_LOGO_BASE64 } from './powerbuild-logo.mjs';

const POWERBUILD_LOGO_BYTES = Uint8Array.from(atob(POWERBUILD_LOGO_BASE64), c => c.charCodeAt(0));

const APPS={
  pos:{name:'Maliks POS',subtitle:'Sales & Quotations',hint:'Product lookup and quotations only. No till payment or dispatch posting.'},
  tills:{name:'Maliks Tills',subtitle:'Cashier Workstation',hint:'Quotation handover is visible. Payment capture, invoices and drawer functions are not live.'},
  cashoffice:{name:'Maliks Cash Office',subtitle:'Cash Office Workstation',hint:'Review quotations without marking them paid. Cash-up and payment validation are not live.'},
  dispatch:{name:'Maliks Dispatch',subtitle:'Dispatch Workstation',hint:'Dispatch is a separate secured application. Picking, checking, POD and stock posting will be connected in a later phase.'},
};
function page(app){
 const d=APPS[app];
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
 @media(max-width:850px){.shell{grid-template-columns:1fr}aside{padding:15px 20px;display:flex;align-items:center;gap:14px}aside h1{margin:0;font-size:17px}aside .brand-logo{width:56px;height:56px;flex:0 0 56px}aside .nav,aside .foot,aside p{display:none}main{padding:23px 14px}.two{grid-template-columns:1fr}}
 </style></head><body>
 <div class="shell"><aside><img class="brand-logo" src="/powerbuild-logo.png" alt="PowerBuild logo" width="112" height="112"/><div><h1>${d.name}</h1><p>${d.subtitle}</p></div><div class="nav">${d.subtitle}</div><p class="foot">Restricted department workstation. All activity is associated with your approved Maliks account and assigned branch.</p></aside>
 <main><div class="top"><div><h2>${d.name}</h2><div class="muted" id="signed-in">Checking approved user access…</div></div><span class="tag">PHASE 1 — CONTROLLED RELEASE</span></div>
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
 let branch='',basket=[];
 const panel=(title)=>{const p=h('section',undefined,'panel');p.append(h('h3',title));return p;};
 const cell=(row,text,tag='td')=>row.append(h(tag,text));
 function selectBranch(){branch=E('branch').value;basket=[];draw();}
 async function searchProducts(){err('');const q=E('search').value.trim();if(!q){err('Enter a product name or code.');return;}
   E('results').textContent='Searching catalogue…';try{
     const data=await api('/api/catalogue?branch='+encodeURIComponent(branch)+'&q='+encodeURIComponent(q));
     const area=E('results');area.replaceChildren();if(!data.products.length){area.append(h('div','No active priced products found.','empty'));return;}
     for(const p of data.products){const r=h('div',undefined,'item');const info=h('div');info.append(h('strong',p.name),h('small',p.code+' · '+p.unit),h('small',money(p.price_cents),'price'));
       const b=h('button','Add');b.type='button';b.addEventListener('click',()=>{const existing=basket.find(x=>x.product.id===p.id);if(existing)existing.quantity++;else basket.push({product:p,quantity:1});drawBasket();});r.append(info,b);area.append(r);}
   }catch(e){err(e.message);E('results').textContent='';}}
 function drawBasket(){const tbody=E('basket-rows');if(!tbody)return;tbody.replaceChildren();let total=0;for(const line of basket){
   const r=h('tr');cell(r,line.product.code+' — '+line.product.name);
   const q=h('td');const n=h('input');n.type='number';n.min='0.001';n.max='9999';n.step='0.001';n.value=line.quantity;n.setAttribute('aria-label','Quantity for '+line.product.name);
   n.addEventListener('change',()=>{const val=Number(n.value);if(!Number.isFinite(val)||val<=0||val>9999||Math.abs(val*1000-Math.round(val*1000))>0.000001){err('Quantity must be between 0.001 and 9999, at most three decimals.');n.value=line.quantity;return;}line.quantity=val;drawBasket();});q.append(n);r.append(q);
   const cents=Math.round(line.product.price_cents*line.quantity);total+=cents;cell(r,money(cents));tbody.append(r);}
   E('total').textContent=money(total);E('quote-btn').disabled=!basket.length;
 }
 async function sendQuote(){err('');if(!basket.length)return;const customer=E('customer').value.trim()||'Walk-in customer';
   const payload={request_id:crypto.randomUUID(),branch,customer_name:customer,customer_contact:E('contact').value.trim(),notes:E('notes').value.trim(),
   lines:basket.map(x=>({product_id:x.product.id,quantity:x.quantity,expected_price_cents:x.product.price_cents}))};
   // Keep the same ID after a network failure: prevents accidental duplicate quotations.
   const submit=E('quote-btn');submit.disabled=true;try{
     const data=await api('/api/quotes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
     E('confirmation').className='success';E('confirmation').textContent='Quotation '+data.quotation.number+' sent to Cash Office. This is NOT a paid invoice.';
     basket=[];drawBasket();
   }catch(e){err(e.message+' Verify before sending another quotation.');submit.disabled=false;}}
 function posView(){const root=E('app-content');const two=h('div',undefined,'two');const lookup=panel('Product catalogue');
   const bar=h('div',undefined,'bar');const field=h('div');field.append(h('label','Search products'));const input=h('input');input.id='search';input.placeholder='Type product code or product name';input.maxLength=100;
   input.addEventListener('keydown',ev=>{if(ev.key==='Enter')searchProducts();});field.append(input);const b=h('button','Search');b.addEventListener('click',searchProducts);bar.append(field,b);lookup.append(bar);
   const res=h('div','Search for a product.','items');res.id='results';lookup.append(res);
   const checkout=panel('Quotation basket');const table=h('table');const head=h('thead');const hr=h('tr');cell(hr,'Product','th');cell(hr,'Qty','th');cell(hr,'Amount','th');head.append(hr);table.append(head);const body=h('tbody');body.id='basket-rows';table.append(body);const sc=h('div',undefined,'scroll');sc.append(table);checkout.append(sc);
   const total=h('div','R 0.00','total');total.id='total';checkout.append(total);
   for(const [id,label,placeholder] of [['customer','Customer name','Walk-in customer'],['contact','Customer contact','Optional'],['notes','Notes','Optional']]){const l=h('label',label);l.htmlFor=id;const inp=h('input');inp.id=id;inp.placeholder=placeholder;inp.maxLength=id==='notes'?400:id==='customer'?120:80;checkout.append(l,inp);}
   const send=h('button','Create quotation for Cash Office','widebutton');send.id='quote-btn';send.disabled=true;send.addEventListener('click',sendQuote);checkout.append(h('p','Prices are VAT-inclusive. Sending a quotation does not receive payment, reserve stock, issue an invoice or release dispatch.','tiny'),send);
   const confirmation=h('div');confirmation.id='confirmation';checkout.append(confirmation);two.append(lookup,checkout);root.append(two);drawBasket();}
 async function quoteView(){const root=E('app-content');const queue=panel(APP==='tills'?'Quotation lookup — payment disabled':'Cash Office — submitted quotations');
   const bar=h('div',undefined,'bar');const refresh=h('button','Refresh quotations');refresh.addEventListener('click',loadQuotes);bar.append(refresh);queue.append(bar);
   const table=h('table');const th=h('thead');const r=h('tr');for(const name of ['Quote','Customer','Status','Submitted','Amount'])cell(r,name,'th');th.append(r);table.append(th);
   const body=h('tbody');body.id='quotes';table.append(body);const sc=h('div',undefined,'scroll');sc.append(table);queue.append(sc);
   queue.append(h('p','Viewing quotations does not confirm payment or authorise a dispatch release.','tiny'));root.append(queue);await loadQuotes();}
 async function loadQuotes(){err('');const body=E('quotes');if(!body)return;body.replaceChildren(h('tr','Loading…'));
  try{const data=await api('/api/quotes?branch='+encodeURIComponent(branch));body.replaceChildren();for(const q of data.quotes){const r=h('tr');for(const x of [q.number,q.customer_name,q.status,q.created_at?.slice(0,16).replace('T',' '),money(q.total_cents)])cell(r,x);body.append(r);}if(!data.quotes.length)body.append(h('tr','No submitted quotations for this branch.'));}
  catch(e){err(e.message);body.replaceChildren();}}
 function dispatchView(){const p=panel('Dispatch will operate here');p.append(h('p','This independent dispatch site is secured and branch-scoped. The production pick, check, stage, load, exit-control and signed POD workflows must be connected before use.','muted'));
   const steps=h('ol');for(const text of ['Paid orders received from Tills','Picker assignment and staging','Checker verification and dispatch bay','Security exit signature or driver POD','Automatic update to Management Hub'])steps.append(h('li',text));p.append(steps);E('app-content').append(p);}
 function draw(){E('app-content').replaceChildren();E('error').hidden=true;E('confirmation')?.replaceChildren();if(APP==='pos')posView();else if(APP==='dispatch')dispatchView();else quoteView();}
 try{const session=await api('/api/session');E('signed-in').textContent=session.user.name+' · '+session.user.role;
  E('access').textContent=session.branches.length+' assigned branch(es)';const select=E('branch');select.replaceChildren();for(const b of session.branches){const o=h('option',b);o.value=b;select.append(o);}select.disabled=false;branch=select.value;select.addEventListener('change',selectBranch);draw();}
 catch(e){E('signed-in').textContent='Access unavailable';E('access').textContent='Not authorised';err(e.message+' Contact your Hub administrator to verify department role and branch assignment.');}
 </script></body></html>`;
}
export default {
 async fetch(req,env){
   const kind=String(env.APP_TYPE||'').toLowerCase();
   if(!APPS[kind])return new Response('Misconfigured application.',{status:503});
   const url=new URL(req.url);
   if(url.pathname==='/powerbuild-logo.png' && req.method==='GET')return new Response(POWERBUILD_LOGO_BYTES,{headers:{'content-type':'image/png','cache-control':'public, max-age=3600','x-content-type-options':'nosniff'}});
   if(url.pathname==='/' && req.method==='GET')return new Response(page(kind),{headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer'}});
   const pathMap={'/api/session':'/v1/session','/api/catalogue':'/v1/catalogue','/api/quotes':'/v1/quotes'};
   const path=pathMap[url.pathname];
   if(!path)return Response.json({error:'Unknown API.'},{status:404});
   if(!['GET','POST'].includes(req.method))return Response.json({error:'Method not allowed.'},{status:405});
   if(req.method==='POST' && url.pathname!=='/api/quotes')return Response.json({error:'Method not allowed.'},{status:405});
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

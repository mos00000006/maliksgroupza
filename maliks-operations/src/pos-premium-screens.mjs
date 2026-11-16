// Purely presentational management overview and safe, non-posting POS basket.
// Runs only within the existing authenticated Maliks POS management Worker.
export const POS_PREMIUM_CLIENT_SCRIPT = String.raw`
 let premiumDraft=[];
 let premiumSearchSequence=0;
 const premiumIcon=(name,cls='pos-inline-icon')=>{
   const outer=h('span',undefined,cls);
   outer.setAttribute('aria-hidden','true');
   // All markup is from the frozen, locally bundled Lucide icon dictionary.
   outer.innerHTML=SUITE_PREMIUM_ICONS[name]||SUITE_PREMIUM_ICONS['circle-question-mark'];
   return outer;
 };
 const premiumButton=(label,icon,action,cls)=>{
   const b=h('button',undefined,cls);
   b.type='button';b.append(premiumIcon(icon),h('span',label));
   b.addEventListener('click',action);
   return b;
 };
 function posPremiumDashboard(){
   const root=E('app-content');
   const layout=h('div',undefined,'pos-content');root.append(layout);
   const welcome=h('section',undefined,'pos-welcome');
   const intro=h('div');intro.append(h('div','MANAGEMENT WORKSPACE  /  '+(branch||'SELECTED BRANCH'),'pos-eyebrow'),h('h1','Operations Dashboard'),h('p','Your command centre for sales, tills, cash office, stock and dispatch — one clean view for the branch.'));
   welcome.append(intro,premiumButton('OPEN POS SCREEN','shopping-cart',()=>setSuiteView('checkout'),'pos-solid-action'));
   layout.append(welcome);

   const kpiArea=h('section');
   const title=h('div',undefined,'pos-section-heading');title.append(h('h2','Today at a glance'),h('span','Live figures appear only after an authorised connection is configured'));
   kpiArea.append(title);
   const kpiGrid=h('div',undefined,'pos-kpi-grid');
   const kpis=[
     ['Sales Today','chart-column','Turnover not connected','checkout'],
     ['Tills','monitor','Cashier shifts not connected','backoffice'],
     ['Cash Office','wallet','Cash-up reporting not connected','backoffice'],
     ['Dispatch','truck','Release queue not connected','dispatching']
   ];
   for(const [label,icon,note,target] of kpis){
     const card=h('button',undefined,'pos-kpi');card.type='button';
     const top=h('div',undefined,'pos-kpi-top');const iconBox=h('span',undefined,'pos-kpi-icon');iconBox.append(premiumIcon(icon));
     top.append(h('span',label,'pos-kpi-title'),iconBox);
     card.append(top,h('strong','—','pos-kpi-value'),h('span',note,'pos-kpi-note'));
     card.addEventListener('click',()=>setSuiteView(target));kpiGrid.append(card);
   }
   kpiArea.append(kpiGrid);layout.append(kpiArea);

   const work=h('section',undefined,'pos-work-grid');const quick=h('div',undefined,'pos-card');
   const quickHead=h('div',undefined,'pos-section-heading');quickHead.append(h('h2','Quick access'),h('span','Choose a workstation'));
   quick.append(quickHead);const quickGrid=h('div',undefined,'pos-quick-grid');
   const shortcuts=[
     ['POS checkout','shopping-cart','Fast product search','checkout'],
     ['Tills','monitor','Cashier workspace','backoffice'],
     ['Cash office','wallet','Cash-up controls','backoffice'],
     ['Dispatch','truck','Dispatch menu','dispatching'],
     ['Stock / GRVs','package-check','Receiving & stock','stock'],
     ['Head office','building','Branch management','headoffice']
   ];
   for(const [name,icon,note,target] of shortcuts){
     const b=h('button',undefined,'pos-quick-btn');b.type='button';
     const box=h('span',undefined,'pos-quick-icon');box.append(premiumIcon(icon));
     const copy=h('span');copy.append(h('strong',name),h('small',note));
     b.append(box,copy);if(target==='stock')b.title='Open Stock module';b.addEventListener('click',()=>setSuiteView(target));quickGrid.append(b);
   }
   quick.append(quickGrid);work.append(quick);
   const controls=h('div',undefined,'pos-card');
   const cHead=h('div',undefined,'pos-section-heading');cHead.append(h('h2','Operational connections'),h('span','Selected branch'));
   controls.append(cHead);const list=h('div',undefined,'pos-ops-list');
   const stockStatus=h('span','Checking…'),grvStatus=h('span','Checking…');
   function controlRow(label,value){const row=h('div',undefined,'pos-ops-row');row.append(h('strong',label),value);list.append(row);}
   controlRow('Linked stock items',stockStatus);controlRow('Recent GRV records',grvStatus);
   controlRow('Sales / Tills / Cash Office',h('span','Integration pending'));
   controlRow('Dispatch release and POD',h('span','Integration pending'));
   controls.append(list);
   const foot=h('div',undefined,'pos-advisory');foot.append(h('strong','Posting safeguards. '),document.createTextNode('This dashboard never fabricates sales or cash totals. Complete payment, dispatch and accounting integration is required before those figures are shown.'));
   controls.append(foot);work.append(controls);layout.append(work);
   const activeBranch=branch;
   if(!inventoryPermissions.read){stockStatus.textContent='Access restricted';grvStatus.textContent='Access restricted';return;}
   Promise.allSettled([
     api('/api/inventory?branch='+encodeURIComponent(activeBranch)),
     api('/api/receipts?branch='+encodeURIComponent(activeBranch))
   ]).then(results=>{
     if(!layout.isConnected||activeBranch!==branch)return;
     const [stocks,receipts]=results;
     stockStatus.textContent=stocks.status==='fulfilled'&&Number.isFinite(Number(stocks.value.total))?Number(stocks.value.total).toLocaleString('en-ZA'):'Unavailable';
     const rows=receipts.status==='fulfilled'&&Array.isArray(receipts.value.receipts)?receipts.value.receipts:null;
     grvStatus.textContent=rows?'Latest '+rows.length+' records':'Unavailable';
   });
 }
 function posPremiumCheckout(){
   const root=E('app-content');
   const layout=h('div',undefined,'pos-content');root.append(layout);
   const header=h('section',undefined,'pos-checkout-header');
   const heading=h('div');heading.append(h('span','CASHIER-READY WORKSPACE','pos-eyebrow'),h('h1','Point of Sale'),h('p','Branch: '+(branch||'Not selected')+'  |  Product lookup and basket preview only'));
   const back=premiumButton('Back to dashboard','house',()=>setSuiteView('home'),'pos-outline-action');
   header.append(heading,back);layout.append(header);
   const warning=h('div',undefined,'pos-advisory');warning.append(h('strong','CHECKOUT NOT CONNECTED. '),document.createTextNode('This screen can search branch-priced products and prepare a local basket. It cannot take payment, generate tax invoices, deduct stock, park transactions or release dispatch.'));
   layout.append(warning);
   const grid=h('section',undefined,'pos-checkout-grid');layout.append(grid);
   const find=h('div',undefined,'pos-card');const findTitle=h('div',undefined,'pos-section-heading');findTitle.append(h('h2','Find products'),h('span','F2 to focus product search'));find.append(findTitle);
   const searchRow=h('form',undefined,'pos-search-bar');const searchField=h('input');searchField.type='search';searchField.id='pos-catalogue-search';searchField.placeholder='Scan barcode, enter product code or search name…';searchField.autocomplete='off';searchField.setAttribute('aria-label','Product lookup');
   const searchSubmit=h('button','SEARCH');searchSubmit.type='submit';searchRow.append(premiumIcon('scan-line'),searchField,searchSubmit);
   find.append(searchRow,h('p','Prices are read from the published Hub catalogue for this branch. Basket quantities are not reservations.','pos-search-hint'));
   const results=h('div',undefined,'pos-search-results');results.setAttribute('aria-live','polite');find.append(results);grid.append(find);
   let searchTimer=null;const activeBranch=branch;
   async function lookup(q){
     const token=++premiumSearchSequence;
     results.replaceChildren(h('div','Searching authorised product master…','pos-empty'));
     if(!masterPermissions.stock?.read){results.replaceChildren(h('div','Your account has no Stock Master lookup permission.','pos-empty'));return;}
     try{
       const data=await api('/api/master/records?kind=stock&branch='+encodeURIComponent(activeBranch)+'&q='+encodeURIComponent(q)+'&page=1');
       if(token!==premiumSearchSequence||!layout.isConnected||activeBranch!==branch)return;
       const records=Array.isArray(data.records)?data.records.filter(p=>p.active):[];
       results.replaceChildren();
       if(!records.length){results.append(h('div','No products found for this search.','pos-empty'));return;}
       const cap=records.slice(0,12);
       for(const p of cap){
         const price=Number(p.details?.selling_price_cents)||0;
         const row=h('div',undefined,'pos-result-row');
         const meta=h('div',undefined,'pos-result-meta');const sym=h('span',undefined,'pos-product-symbol');sym.append(premiumIcon('boxes'));
         const desc=h('div');desc.style.minWidth='0';desc.append(h('strong',p.name),h('small',p.code+'  ·  '+(p.details?.unit||'EA')));
         meta.append(sym,desc);const right=h('div',undefined,'pos-result-right');right.append(h('b',price>0?money(price):'Unpriced'));
         const add=premiumButton('Add','plus',()=>{
           if(!Number.isSafeInteger(price)||price<=0)return;
           const code=String(p.code||'').trim();if(!code)return;
           const prior=premiumDraft.find(x=>x.branch===activeBranch&&x.code===code);
           if(prior){prior.qty=Math.min(prior.qty+1,999);}else premiumDraft.push({branch:activeBranch,code,name:String(p.name||code),price_cents:price,qty:1});
           updateBasket();
         },'pos-mini-add');
         add.disabled=!Number.isSafeInteger(price)||price<=0;
         add.title=add.disabled?'Published price unavailable':'Add item to local basket';
         right.append(add);row.append(meta,right);results.append(row);
       }
       if(records.length>cap.length)results.append(h('p','Showing first '+cap.length+' results. Refine your search to see more.','pos-search-hint'));
     }catch(error){if(token===premiumSearchSequence&&layout.isConnected)results.replaceChildren(h('div','Catalogue unavailable: '+error.message,'pos-empty'));}
   }
   searchRow.addEventListener('submit',event=>{event.preventDefault();if(searchTimer)clearTimeout(searchTimer);void lookup(searchField.value.trim());});
   searchField.addEventListener('input',()=>{if(searchTimer)clearTimeout(searchTimer);searchTimer=setTimeout(()=>void lookup(searchField.value.trim()),280);});
   const basketCard=h('div',undefined,'pos-card pos-basket');grid.append(basketCard);
   const basketHead=h('div',undefined,'pos-basket-head');const basketTitle=h('h2','Current basket');const clear=h('button','Clear basket','pos-page-link');clear.type='button';
   clear.addEventListener('click',()=>{if(!premiumDraft.length)return;if(!window.confirm('Discard all items in this local basket?'))return;premiumDraft=[];updateBasket();});
   basketHead.append(basketTitle,clear);basketCard.append(basketHead);
   const basketItems=h('div',undefined,'pos-line-list');basketCard.append(basketItems);
   const totals=h('div',undefined,'pos-totals');basketCard.append(totals);
   const methods=h('div',undefined,'pos-methods');for(const [label,icon] of [['Cash','banknote'],['Card','credit-card'],['EFT','wallet']]){
     const btn=premiumButton(label,icon,()=>{},'');btn.disabled=true;btn.title='Payment integration is not enabled';methods.append(btn);
   }
   basketCard.append(methods);
   const checkout=premiumButton('Activate checkout to complete sale','lock-keyhole',()=>{},'pos-checkout-disabled');checkout.disabled=true;
   basketCard.append(checkout,h('p','No payment has been accepted. No tax invoice, stock movement, dispatch release or customer receipt will be created by this preview.','pos-checkout-notice'));
   function updateBasket(){
     const lines=premiumDraft.filter(x=>x.branch===activeBranch);
     basketItems.replaceChildren();totals.replaceChildren();
     basketTitle.textContent='Current basket  ·  '+lines.reduce((n,l)=>n+l.qty,0)+' '+(lines.reduce((n,l)=>n+l.qty,0)===1?'item':'items');
     clear.disabled=!lines.length;
     if(!lines.length)basketItems.append(h('div','No products added yet. Search above to start a basket.','pos-empty'));
     for(const line of lines){
       const entry=h('div',undefined,'pos-line-item');entry.append(h('strong',line.name));
       const row=h('div',undefined,'pos-line-row');const controls=h('div',undefined,'pos-qty-group');
       const dec=h('button',undefined);dec.type='button';dec.title='Decrease quantity';dec.append(premiumIcon('minus'));
       dec.addEventListener('click',()=>{line.qty-=1;if(line.qty===0)premiumDraft=premiumDraft.filter(x=>x!==line);updateBasket();});
       const qty=h('span',String(line.qty));
       const inc=h('button',undefined);inc.type='button';inc.title='Increase quantity';inc.disabled=line.qty>=999;inc.append(premiumIcon('plus'));
       inc.addEventListener('click',()=>{line.qty=Math.min(999,line.qty+1);updateBasket();});controls.append(dec,qty,inc);
       const price=h('strong',money(line.price_cents*line.qty));
       const remove=h('button',undefined,'pos-trash');remove.type='button';remove.title='Remove item';remove.append(premiumIcon('trash'));
       remove.addEventListener('click',()=>{premiumDraft=premiumDraft.filter(x=>x!==line);updateBasket();});
       row.append(controls,price,remove);entry.append(row);basketItems.append(entry);
     }
     const total=lines.reduce((sum,l)=>sum+l.price_cents*l.qty,0);
     const vat=Math.round(total*15/115);
     function amountLine(label,value,grand){const r=h('div',undefined,'pos-total-line'+(grand?' grand':''));r.append(h('span',label),h('strong',money(value)));totals.append(r);}
     amountLine('Subtotal (excl. VAT)',total-vat,false);
     amountLine('VAT component (15%)',vat,false);
     amountLine('TOTAL DUE · VAT INCLUSIVE',total,true);
   }
   updateBasket();void lookup('');
 }
 document.addEventListener('keydown',event=>{
   if(APP!=='pos'||suiteView!=='checkout'||event.key!=='F2')return;
   event.preventDefault();E('pos-catalogue-search')?.focus();
 });
`;

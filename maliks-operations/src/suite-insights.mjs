export const SUITE_INSIGHTS_CLIENT_SCRIPT = String.raw`
 // Read-only branch dashboards and complete, branch-scoped master CSV exports.
 // All data is obtained from existing authenticated same-origin endpoints.
 function suiteOperationalDashboard(mode){
   const isManagement=mode==='management';
   const w=invWorkspace(isManagement?'Management Dashboard — Selected Branch':'Branch Dashboard',
     'Live operational records for this authorised branch only. This is not group consolidation or a financial ledger.');
   w.form.hidden=true;
   const refresh=invButton('Refresh dashboard',()=>void load(),'suite-primary');
   const summary=h('div'),sections=h('div');w.list.append(refresh,summary,sections);
   function section(title,headings,rows){
     const p=h('section',undefined,'panel');p.append(h('h3',title));
     const table=h('div');p.append(table);invTable(table,headings,rows);sections.append(p);
   }
   function statusRows(rows,limit){
     const counts=new Map();
     for(const row of rows){const s=String(row.status||'UNKNOWN');counts.set(s,(counts.get(s)||0)+1);}
     const result=[...counts.entries()].sort((a,b)=>a[0].localeCompare(b[0]));
     if(!result.length)return [['No records',0]];
     return result.map(([s,n])=>[s,n]);
   }
   async function load(){
     const selected=branch,qs='?branch='+encodeURIComponent(selected);
     w.message('');summary.replaceChildren(h('p','Loading authorised branch records…','muted'));sections.replaceChildren();
     const specs=[
       ['stock',!!inventoryPermissions.read,'/api/inventory'+qs],
       ['purchase',!!purchasePermissions.read,'/api/purchase-orders'+qs],
       ['receiving',!!inventoryPermissions.read,'/api/receipts'+qs],
       ['invoices',!!supplierInvoicePermissions.read,'/api/supplier-invoices'+qs]
     ];
     const responses=await Promise.all(specs.map(async ([name,allowed,url])=>{
       if(!allowed)return {name,unavailable:'Your role does not permit access.'};
       try{return {name,data:await api(url)};}
       catch(error){return {name,unavailable:error.message};}
     }));
     if(!w.valid()||selected!==branch)return;
     const data=Object.fromEntries(responses.map(x=>[x.name,x]));
     summary.replaceChildren();
     const stock=data.stock.data;
     if(stock){
       const p=h('section',undefined,'panel');
       p.append(h('h3','Linked stock: '+Number(stock.total||0)+' active SKUs'));
       p.append(h('p','Recent movements returned: '+(stock.movements||[]).length+' · The item preview is limited to the first 150 linked SKUs.','muted'));
       const low=(stock.items||[]).filter(x=>Number(x.reorder_min)>0&&Number(x.qty_milli)<Number(x.reorder_min)*1000);
       p.append(h('p','Below minimum in this preview: '+low.length+' (not a whole-branch low-stock count).','muted'));
       summary.append(p);
     }else summary.append(h('p','Stock data unavailable: '+data.stock.unavailable,'muted'));
     for(const [name,title,key,limit] of [
       ['purchase','Purchase orders','orders',100],
       ['receiving','Receiving / GRV register','receipts',80],
       ['invoices','Supplier invoice matching','invoices',100]
     ]){
       const item=data[name];if(!item.data){
         section(title,['Access','Status'],[['Unavailable',item.unavailable]]);
         continue;
       }
       const rows=Array.isArray(item.data[key])?item.data[key]:[];
       section(title+' — latest '+rows.length+' (maximum '+limit+')',['Status','Records'],statusRows(rows,limit));
     }
     if(stock){
       const rows=(stock.movements||[]).slice(0,20).map(m=>[showDate(m.created_at),m.code||'—',m.movement_type||'—',(m.quantity_delta_milli>0?'+':'')+invQty(m.quantity_delta_milli)]);
       section('Recent stock movements — latest '+rows.length,['Date','Stock code','Movement','Quantity'],rows);
     }
     const note=h('p','This dashboard does not include sales turnover, debtor balances, VAT, general ledger postings or consolidated group results. Those systems are not yet connected.','muted');
     sections.append(note);
   }
   void load();
 }
 function suiteCsvCell(value){
   const raw=String(value===null||value===undefined?'':value).replace(/[\u0000-\u001f\u007f]/g,' ');
   const safe=/^\s*[=+\-@]/.test(raw)?"'"+raw:raw;
   return '"'+safe.replace(/"/g,'""')+'"';
 }
 function suiteMasterExport(kind){
   const names={stock:'Stock Master',supplier:'Suppliers Master',debtor:'Debtors Master'};
   const w=invWorkspace(names[kind]+' CSV Export','Download records for the currently selected authorised branch. This is a read-only export and does not change balances or stock.');
   w.form.hidden=true;
   if(!masterPermissions[kind]?.read){w.message('Your role does not have '+names[kind]+' read permission.');return;}
   const button=invButton('Export complete '+names[kind]+' CSV',()=>void exportCsv(),'suite-primary');
   const status=h('p','Only records visible to your authorised branch will be included.','muted');w.list.append(button,status);
   const moneyValue=value=>Number.isSafeInteger(Number(value))?(Number(value)/100).toFixed(2):'';
   async function exportCsv(){
     const selected=branch;button.disabled=true;w.message('');status.textContent='Loading records…';
     try{
       const base='/api/master/records?kind='+encodeURIComponent(kind)+'&branch='+encodeURIComponent(selected)+'&page=';
       const first=await api(base+'1');
       if(!w.valid())return;
       const pages=Number(first.pages);
       if(!Number.isSafeInteger(pages)||pages<1||pages>100)throw Error('Export exceeds the safe limit of 10,000 records. Ask IT for a server-side export.');
       const records=[...(first.records||[])];
       for(let page=2;page<=pages;page++){
         if(!w.valid())return;
         status.textContent='Loading page '+page+' of '+pages+'…';
         const next=await api(base+page);
         if(!w.valid())return;
         if(next.branch!==selected||next.kind!==kind||!Array.isArray(next.records))throw Error('The export returned inconsistent branch data.');
         records.push(...next.records);
       }
       if(first.branch!==selected||first.kind!==kind||!Array.isArray(first.records))throw Error('Invalid export response.');
       if(records.length!==Number(first.total))throw Error('Records changed during export. Please retry to obtain a complete file.');
       const headings=kind==='stock'?
         ['Branch','Code','Description','Category','Unit','Barcode','Cost ZAR','Selling Price ZAR','Minimum Stock','Linked','Active']:
         kind==='supplier'?
         ['Branch','Code','Supplier','Contact','Phone','Email','VAT Number','Payment Terms Days','Active']:
         ['Branch','Code','Debtor','Contact','Phone','Email','Credit Limit ZAR','Payment Terms Days','Active'];
       const rows=records.map(r=>{
         const d=r.details||{};
         if(kind==='stock')return [selected,r.code,r.name,r.category||d.category,d.unit,d.barcode,r.linked?moneyValue(d.cost_cents):'',moneyValue(d.selling_price_cents),d.reorder_min,r.linked?'Yes':'No',r.active?'Yes':'No'];
         if(kind==='supplier')return [selected,r.code,r.name,d.contact_name,d.phone,d.email,d.vat_number,d.payment_terms_days,r.active?'Yes':'No'];
         return [selected,r.code,r.name,d.contact_name,d.phone,d.email,moneyValue(d.credit_limit_cents),d.payment_terms_days,r.active?'Yes':'No'];
       });
       const csv='\uFEFF'+[headings,...rows].map(row=>row.map(suiteCsvCell).join(',')).join('\r\n')+'\r\n';
       const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});
       const url=URL.createObjectURL(blob);
       const link=h('a');link.href=url;link.download='maliks-'+kind+'-'+selected.replace(/[^A-Za-z0-9_-]/g,'_').slice(0,60)+'.csv';
       document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
       status.textContent='Exported '+records.length+' records from '+selected+'.';
       w.message('CSV ready. No records were modified.',true);
     }catch(error){if(w.valid()){status.textContent='Export not completed.';w.message(error.message);}}
     finally{button.disabled=false;}
   }
 }
 function suiteHelpView(item){
   const w=invWorkspace(item,'Guidance for the Maliks Professional management suite.');w.form.hidden=true;
   const info={
     'Using Maliks Professional':['Select a branch first, then open Stock, Suppliers or Debtors.','Purchase orders, GRVs, stock transfers, stock takes and master files use authorised workflows and audit logs.','Grey menu items without a connected service remain disabled until their complete workflow is implemented.'],
     'Department Access':['Your login is assigned a role and one or more branches.','Sales, Tills, Cash Office, Dispatch and Member Team are separate secure workstations.','Managers can administer staff and branch access in Maliks Member Team.'],
     'Branch Selection':['Choose your authorised branch using the Assigned branch selector near the top of the screen.','Changing branch refreshes the displayed workspace and prevents cross-branch reporting.','You cannot select branches outside your approved access list.'],
     'Contact Administrator':['Ask your store manager or authorised Head Office administrator for account access, permissions or branch assignments.','For failed transactions, provide the module name, branch, approximate time and exact error message. Never send passwords.']
   };
   for(const message of info[item]||[])w.list.append(h('p',message,'muted'));
   if(item==='Department Access')w.list.append(invButton('Open Maliks Member Team',()=>window.location.assign(MEMBER_TEAM_URL),'suite-primary'));
 }
`;

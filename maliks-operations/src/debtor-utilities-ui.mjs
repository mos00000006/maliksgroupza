// Phase 32: plain browser UI source inserted into the existing authenticated POS page.
// All server-authoritative work goes through /api/debtor-utilities and private Core.
export const DEBTOR_UTILITIES_CLIENT_SCRIPT=String.raw`
 function suiteDebtorUtility(menuItem){
   const modes={'Current Agents':'agents','Block Sales':'blocks','Reprint Documents':'documents','Reprint Journals':'journals',
     'Labelling':'labels','Delete Expired Quotations':'expired','Debtors Master CSV File Import':'imports'};
   const mode=modes[menuItem];if(!mode)return;
   const notes={
     agents:'Branch debtor agent directory. This is a contact register; employee login permissions are controlled separately in Member Team.',
     blocks:'Account block/unblock record with an audit trail. IMPORTANT: Sales and Tills do not yet select debtor account codes, so these flags are not enforced at checkout.',
     documents:'Reprint saved quotations (NOT PAID) or internally confirmed pilot invoices. Payment status and tax documentation must be independently verified.',
     journals:'Print captured Debtors journal preparations. These register entries are NOT posted to the General Ledger or debtor account.',
     labels:'Create printable A4 debtor filing labels directly from authorised debtor master records. No database records are modified.',
     expired:'Review quotations older than 90 days. Archiving retains their data and audit history; it does not physically delete quotations or block every legacy checkout path.',
     imports:'Import NEW debtor master accounts only. Existing accounts are never overwritten. Preview CSV rows before creating up to 50 accounts at a time.'};
   const w=invWorkspace(menuItem,notes[mode]);const selectedBranch=branch;
   if(!masterPermissions.debtor?.read){w.message('Debtors master read permission required.');w.form.hidden=true;return;}
   const write=masterPermissions.debtor?.write===true;
   const search=invField(w.list,'Find account, reference or customer','search');search.placeholder='Search within '+selectedBranch;
   const toolbar=h('div',undefined,'suite-master-actions');const refresh=invButton('Refresh',()=>void load(),'suite-primary');
   const audit=invButton('Utility audit trail',()=>void showAudit(),'secondary');toolbar.append(refresh,audit);w.list.append(toolbar);
   const table=h('div');w.list.append(table);
   const status=h('p','','tiny');w.list.append(status);
   const state={rows:[],data:null};let beforeInput=null;
   const valid=()=>w.valid()&&branch===selectedBranch;
   const text=v=>v===null||v===undefined?'':String(v);
   const cash=v=>'R '+new Intl.NumberFormat('en-ZA',{minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(v||0)/100);
   const request=async payload=>{
     if(!write)throw Error('Debtors write permission required.');
     return await invPost('/api/debtor-utilities',{branch:selectedBranch,...payload});
   };
   const detailRequest=async options=>await api('/api/debtor-utilities?'+new URLSearchParams({branch:selectedBranch,...options}));
   const mainForm=h('div',undefined,'suite-master-form');w.form.append(mainForm);
   const formTitle=h('h4',menuItem);w.form.prepend(formTitle);
   function message(s,ok=false){if(valid())w.message(s,ok);}
   async function save(body){refresh.disabled=true;try{await request(body);message('Saved successfully. See Utility audit trail for the change.',true);await load();}catch(e){message(e.message);}finally{refresh.disabled=false;}}
   function clearForm(){mainForm.replaceChildren();}
   function field(label,type='text',value=''){return invField(mainForm,label,type,value);}
   function button(label,fn,cls='suite-primary'){const b=invButton(label,fn,cls);mainForm.append(b);return b;}
   function editAgent(record){clearForm();
     const code=field('Agent code','text',record?.code||''),name=field('Agent name','text',record?.name||''),email=field('Email','email',record?.email||''),phone=field('Telephone','text',record?.phone||'');
     const active=invSelect(mainForm,'Status',[['1','Active'],['0','Inactive']],a=>a[0],a=>a[1]);active.value=record?.active===0?'0':'1';
     const saveButton=button(record?'Save agent changes':'Add agent',async()=>{
       saveButton.disabled=true;try{if(!code.value.trim()||!name.value.trim())throw Error('Agent code and name are required.');
         await save({action:'SAVE_AGENT',id:record?.id,version:record?.version,code:code.value,name:name.value,email:email.value,phone:phone.value,active:active.value==='1'});
       }catch(e){message(e.message);}finally{saveButton.disabled=false;}});
   }
   if(mode==='agents'&&write)editAgent(null);
   if(mode==='expired'){
     const today=new Date(Date.now()-90*86400000).toISOString().slice(0,10);
     beforeInput=invField(mainForm,'Show quotations created before','date',today);beforeInput.max=today;
     button('Preview eligible quotations',()=>void load());
   }
   if(mode==='imports'){
     const intro=h('p','CSV columns: code,name,contact_name,phone,email,credit_limit,payment_terms_days,active. Credit limit is Rands (e.g. 1500.00). Active is true/false. Max 50 rows per batch.','suite-master-note');mainForm.append(intro);
     const template=button('Download CSV template',()=>downloadText('debtor-master-template.csv','code,name,contact_name,phone,email,credit_limit,payment_terms_days,active\r\nACC100,Example Debtor,Contact Person,0111111111,accounts@example.com,1500.00,30,true\r\n'),'secondary');
     template.disabled=false;
     const picker=invField(mainForm,'Choose debtor CSV / TXT file','file');picker.accept='.csv,.txt,text/csv,text/plain';
     const preview=h('div');mainForm.append(preview);
     let parsed=[];
     picker.addEventListener('change',async()=>{
       parsed=[];preview.replaceChildren();
       if(!picker.files?.length)return;
       const file=picker.files[0];if(file.size>100000) {message('File exceeds 100 KB; split it into smaller batches.');return;}
       try{const raw=await file.text();const grid=parseDebtorCSV(raw);parsed=gridToDebtors(grid);
         if(parsed.length>50)throw Error('Import only 50 accounts at once. Split the CSV.');
         const rows=parsed.slice(0,10).map(x=>[x.code,x.name,x.email,cash(x.credit_limit_cents),x.payment_terms_days]);
         invTable(preview,['Code','Name','Email','Credit limit','Terms (days)'],rows);
         preview.prepend(h('p',parsed.length+' new accounts ready to validate and import. A maximum of 10 preview rows are shown.','suite-master-note'));
         message('Preview ready. No database changes have been made.',true);
       }catch(e){parsed=[];message(e.message);}
     });
     if(write){const upload=button('Import new debtor accounts',async()=>{
       if(!parsed.length){message('Choose and preview a valid CSV file first.');return;}
       if(!window.confirm('Create '+parsed.length+' NEW debtor accounts for '+selectedBranch+'? Existing accounts will NOT be replaced.'))return;
       upload.disabled=true;try{const answer=await request({action:'IMPORT_DEBTORS',rows:parsed});
         message(answer.imported+' debtor account(s) imported. No balances or transactions were posted.',true);picker.value='';parsed=[];preview.replaceChildren();await load();
       }catch(e){message(e.message);}finally{upload.disabled=false;}});}
     else mainForm.append(h('p','CSV import requires debtor master write permission.','muted'));
   }
   function parseDebtorCSV(raw){
     let cells=[],rows=[],value='',quoted=false;
     const addCell=()=>{cells.push(value);value='';};
     const addRow=()=>{addCell();if(cells.some(x=>x.trim()))rows.push(cells);cells=[];};
     for(let i=0;i<raw.length;i++){const ch=raw[i];if(ch==='"'){
       if(quoted&&raw[i+1]==='"'){value+='"';i++;}else quoted=!quoted;
     }else if(ch===','&&!quoted)addCell();else if((ch==='\n'||ch==='\r')&&!quoted){addRow();if(ch==='\r'&&raw[i+1]==='\n')i++;}
     else value+=ch;}
     if(quoted)throw Error('Malformed CSV: unclosed quotation mark.');if(value||cells.length)addRow();return rows;
   }
   function gridToDebtors(grid){
     if(grid.length<2)throw Error('CSV must have a header and at least one account.');
     const labels=['code','name','contact_name','phone','email','credit_limit','payment_terms_days','active'];
     const header=grid.shift().map(x=>x.trim().toLowerCase().replace(/^\ufeff/,''));
     if(header.join(',')!==labels.join(','))throw Error('CSV header must match the downloadable template exactly.');
     const codes=new Set();return grid.map((r,i)=>{
       if(r.length!==labels.length)throw Error('Row '+(i+2)+': expected exactly '+labels.length+' columns.');
       const [code,name,contact_name,phone,email,credit,terms,active]=r.map(x=>x.trim());
       const upper=code.toUpperCase(),amount=Number(credit||'0'),days=Number(terms||'0');
       if(!/^[A-Z0-9][A-Z0-9._/-]{0,39}$/.test(upper)||!name||name.length>160)throw Error('Row '+(i+2)+': invalid debtor code/name.');
       if(codes.has(upper))throw Error('Row '+(i+2)+': duplicate code in file.');codes.add(upper);
       if(!Number.isFinite(amount)||amount<0||amount>1000000000||Math.abs(amount*100-Math.round(amount*100))>0.00001)throw Error('Row '+(i+2)+': invalid credit limit.');
       if(!Number.isSafeInteger(days)||days<0||days>365)throw Error('Row '+(i+2)+': invalid payment terms.');
       if(!['true','false','1','0','yes','no',''].includes(active.toLowerCase()))throw Error('Row '+(i+2)+': invalid active flag.');
       return {code:upper,name,contact_name,phone,email,credit_limit_cents:Math.round(amount*100),payment_terms_days:days,active:!['false','0','no'].includes(active.toLowerCase())};
     });
   }
   function downloadText(filename,content){const blob=new Blob([String.fromCharCode(0xfeff)+content],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=h('a');
     a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1200);}
   function printSafe(title,note,header,rows,format='A4 landscape'){
     const popup=window.open('','_blank');if(!popup){message('Allow pop-ups to print from Maliks POS.');return;}
     const d=popup.document;d.title=title;
     const css=d.createElement('style');css.textContent='body{margin:17mm;color:#102942;font:12px Arial,sans-serif}header{display:flex;justify-content:space-between;border-bottom:3px solid #d7aa31;padding-bottom:14px;margin-bottom:16px}h1{font-size:22px}h3{margin:0}table{border-collapse:collapse;width:100%;margin-top:12px}th,td{border:1px solid #d4dce4;padding:8px;text-align:left;overflow-wrap:anywhere}th{background:#eef2f7}.warn{padding:12px;border:1px solid #c6931f;background:#fff8e6;margin:12px 0}footer{margin-top:18px;font-size:10px;color:#64748b}@page{size:'+format+';margin:12mm}';d.head.append(css);
     const e=(tag,value,host=d.body,klass)=>{const x=d.createElement(tag);x.textContent=text(value);if(klass)x.className=klass;host.append(x);return x;};
     const hd=d.createElement('header'),buster=/buster\s*build/i.test(selectedBranch),name=buster?'BUSTER BUILD':'POWERBUILD';
     const img=d.createElement('img');img.alt=name+' logo';img.src=buster?'/busterbuild-logo.png':'/powerbuild-logo.png';
     img.style.cssText='width:100px;height:65px;object-fit:contain';hd.append(img);
     e('h3',name+' · '+selectedBranch,hd);e('span','MALIKS POS PROFESSIONAL',hd);d.body.append(hd);
     e('h1',title);e('p',new Date().toLocaleString('en-ZA')+' · Branch: '+selectedBranch);e('p',note,d.body,'warn');
     const t=d.createElement('table'),hrow=d.createElement('tr');for(const col of header)e('th',col,hrow);t.append(hrow);
     for(const row of rows){const tr=d.createElement('tr');for(const cellValue of row)e('td',cellValue,tr);t.append(tr);}d.body.append(t);
     e('footer','Internal document copy · Source records retained in the Maliks system.');popup.focus();popup.setTimeout(()=>popup.print(),450);
   }
   async function printDocument(row){try{
     const data=await detailRequest({mode:'document',type:row.type,id:String(row.id)});
     if(!valid())return;const doc=data.document;
     const lines=doc.lines.map(x=>[text(x.code||x.product_code||''),text(x.name||x.description||''),text(x.quantity||''),cash(x.price_cents),cash(x.line_total_cents||Number(x.price_cents||0)*Number(x.quantity||0))]);
     lines.push(['','','Net',cash(doc.net_cents),''],['','','VAT',cash(doc.vat_cents),''],['','','TOTAL',cash(doc.total_cents),'']);
     printSafe(doc.number+' · '+doc.customer_name,doc.posting_note+' · Customer: '+doc.customer_name+' · Date: '+doc.issued_at,
       ['Code','Product','Quantity','Unit price','Line total'],lines,'A4 portrait');
   }catch(e){message(e.message);}}
   function printFilingLabels(chosen){
     const popup=window.open('','_blank');if(!popup){message('Allow pop-ups to print debtor labels.');return;}
     const d=popup.document;d.title='Debtor Filing Labels · '+selectedBranch;
     const css=d.createElement('style');css.textContent='@page{size:A4 portrait;margin:10mm}body{font:12px Arial,sans-serif;color:#112c40;margin:0}.page{display:grid;grid-template-columns:1fr 1fr;grid-auto-rows:60mm;gap:3mm;break-after:page;page-break-after:always}.label{border:1px solid #ccd7e0;border-left:4px solid #d4a024;border-radius:5px;padding:8mm 5mm 4mm;overflow:hidden;page-break-inside:avoid}.label img{width:52px;height:27px;object-fit:contain}.label h3{font-size:17px;margin:6mm 0 2mm;overflow-wrap:anywhere}.label small{color:#64748b}.label strong{font-size:15px}.label p{font-size:11px;line-height:1.4}.label footer{font-size:9px;color:#789}';d.head.append(css);
     const isBuster=/buster\s*build/i.test(selectedBranch);
     const put=(tag,value,parent)=>{const e=d.createElement(tag);e.textContent=String(value??'');parent.append(e);return e;};
     for(let i=0;i<chosen.length;i+=8){const page=d.createElement('section');page.className='page';d.body.append(page);
       for(const r of chosen.slice(i,i+8)){const label=d.createElement('div');label.className='label';
         const img=d.createElement('img');img.src=isBuster?'/busterbuild-logo.png':'/powerbuild-logo.png';img.alt=isBuster?'Buster Build':'PowerBuild';label.append(img);
         put('h3',r.name,label);put('strong',r.code,label);put('p',(r.details?.contact_name||'')+' · '+(r.details?.phone||''),label);
         put('small',selectedBranch,label);put('footer','INTERNAL DEBTOR FILING LABEL — NO BALANCE CERTIFIED',label);page.append(label);}
     }
     popup.focus();popup.setTimeout(()=>popup.print(),600);
   }
   function draw(rows){table.replaceChildren();if(!valid())return;
     if(mode==='agents')invTable(table,['Code','Agent','Email','Telephone','Status','Action'],rows.map(r=>{
       const b=invButton('Edit',()=>editAgent(r),'secondary small-btn');b.disabled=!write;
       return [r.code,r.name,r.email||'—',r.phone||'—',r.active?'Active':'Inactive',b];}));
     if(mode==='blocks')invTable(table,['Debtor code','Customer','Account','Sales flag','Reason','Action'],rows.map(r=>{
       const b=invButton(r.blocked?'Unblock':'Block Sales',()=>{
         w.form.hidden=false;clearForm();mainForm.append(h('h4',r.code+' · '+r.name));const reason=field('Mandatory reason','text','');
         button(r.blocked?'Confirm unblock':'Confirm sales block',()=>void save({action:'SET_BLOCK',debtor_code:r.code,blocked:!r.blocked,version:r.version,reason:reason.value}));
       },'secondary small-btn');b.disabled=!write||!r.active;
       return [r.code,r.name,r.active?'Active':'Inactive',r.blocked?'BLOCK FLAG':'Clear',r.reason||'—',b];}));
     if(mode==='documents')invTable(table,['Document','Customer','Date','Total','Status','Action'],rows.map(r=>[r.number,r.customer_name,text(r.created_at).slice(0,10),cash(r.total_cents),r.archived_at?'Archived':r.type==='quote'?'NOT PAID / '+r.status:'Confirmed internal',invButton('Open & Print',()=>void printDocument(r),'secondary small-btn')]));
     if(mode==='journals')invTable(table,['Reference','Date','Debtor','Description','Amount','Status','Action'],rows.map(r=>{
       const btn=invButton('Print copy',()=>printSafe('JOURNAL PREPARATION · '+r.reference,'NOT POSTED — This is a register copy only.',
         ['Date','Debit account','Credit account','Amount','Description'],[[r.event_date,r.details?.debit_account||'—',r.details?.credit_account||'—',cash(r.amount_cents),r.description]]),'secondary small-btn');
       return [r.reference,r.event_date,r.debtor_code||'—',r.description,cash(r.amount_cents),r.status_label,btn];}));
     if(mode==='labels'){
       const selected=new Set();const actions=h('div',undefined,'suite-master-actions');
       const print=invButton('Print selected debtor labels (A4)',()=>{
         const chosen=rows.filter(r=>selected.has(r.code));if(!chosen.length){message('Select at least one debtor account.');return;}
         printFilingLabels(chosen);
       },'suite-primary');actions.append(print);table.append(actions);
       const t=h('div');invTable(t,['Select','Account','Debtor','Contact'],rows.map(r=>{
         const check=h('input');check.type='checkbox';check.style.width='20px';check.addEventListener('change',()=>{if(check.checked)selected.add(r.code);else selected.delete(r.code);});
         return [check,r.code,r.name,r.details?.contact_name||'—'];}));table.append(t);
     }
     if(mode==='expired')invTable(table,['Quotation','Customer','Created','Total','Status','Action'],rows.map(r=>{
       const b=invButton('Archive',async()=>{
         const reason=window.prompt('Why archive this expired quotation? (At least 8 characters)');if(!reason)return;
         if(!window.confirm('Archive quotation Q-'+String(r.id).padStart(8,'0')+'? The original record will be retained.'))return;
         await save({action:'ARCHIVE_EXPIRED',id:r.id,before:beforeInput.value,reason});
       },'secondary small-btn');b.disabled=!write||!!r.archived;
       return ['Q-'+String(r.id).padStart(8,'0'),r.customer_name,text(r.created_at).slice(0,10),cash(r.total_cents),r.archived?'Archived':'Eligible',b];}));
     if(mode==='imports')invTable(table,['Imported at','Accounts','Imported by','Import batch'],rows.map(r=>[text(r.created_at).slice(0,16),r.count,r.actor_email,text(r.request_id).slice(0,10)]));
   }
   async function load(){if(!valid())return;refresh.disabled=true;table.replaceChildren(h('p','Loading '+menuItem+'…','muted'));
     try{const q={mode,search:search.value};if(mode==='expired')q.before=beforeInput.value;
       const data=await detailRequest(q);if(!valid())return;state.rows=data.rows||[];state.data=data;
       draw(state.rows);status.textContent=state.rows.length+' records shown · '+selectedBranch;
       if(data.warning)message(data.warning,false);else message('');
     }catch(e){if(valid()){table.replaceChildren();message(e.message);}}
     finally{refresh.disabled=false;}
   }
   async function showAudit(){try{
     const data=await detailRequest({mode:'audit'});if(!valid())return;
     invTable(table,['Time','Action','Type','Record','User'],data.rows.map(x=>[text(x.created_at).slice(0,16),x.event,x.entity,x.entity_key,x.actor_email]));
     status.textContent='Latest '+data.rows.length+' utility audit entries for '+selectedBranch;
   }catch(e){message(e.message);}}
   refresh.addEventListener('click',()=>void load());
   search.addEventListener('keydown',ev=>{if(ev.key==='Enter'){ev.preventDefault();void load();}});
   if(!['agents','expired','imports'].includes(mode))w.form.hidden=true;
   void load();
 }
`;

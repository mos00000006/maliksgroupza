// Phase 33: inserted into the existing authenticated POS browser UI.
// Server owns all validation, permissions, revisions and reference reservations.
export const STOCK_SETTINGS_CLIENT_SCRIPT=String.raw`
 function suiteStockSettings(menuItem){
   if(!['Settings','Numbering'].includes(menuItem))return;
   const selectedBranch=branch;
   const config=menuItem==='Settings';
   const w=invWorkspace('Stocks · '+menuItem,config?
      'Branch Stocks defaults. Defaults are stored for future integration with stock purchasing; existing accounts remain unchanged. Existing accounts and issued documents remain unchanged; invoice/statement templates are not linked yet.':
      'Reserve distinct, branch-specific reference numbers. Existing stock purchase orders, invoices and transactions keep their current numbering until separately integrated.');
   const valid=()=>w.valid()&&branch===selectedBranch;
   if(!masterPermissions.stock?.read){w.form.hidden=true;w.message('Stocks read access required.');return;}
   const canChange=masterPermissions.stock?.write===true&&['Owner / Admin','Developer / Technical Admin','Operations Manager','Regional Manager','Store Manager','Finance Manager','Stock Controller'].includes(currentUserRole);
   const form=h('div',undefined,'suite-master-form');w.form.append(form);
   const refresh=invButton('Refresh '+menuItem,()=>void load(),'secondary');
   const history=invButton('View Settings audit',()=>void audit(),'secondary');
   const controls=h('div',undefined,'suite-master-actions');controls.append(refresh,history);w.list.append(controls);
   const output=h('div');w.list.append(output);
   const fmt=n=>'R '+new Intl.NumberFormat('en-ZA',{minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(n||0));
   const field=(label,type='text',value='')=>invField(form,label,type,value);
   async function request(action,body){return invPost('/api/stock-settings',{branch:selectedBranch,action,...body});}
   function say(text,ok=false){if(valid())w.message(text,ok);}
   let savedSettings=null,sequences=[];
   async function load(){refresh.disabled=true;
     try{const data=await api('/api/stock-settings?'+new URLSearchParams({branch:selectedBranch,mode:config?'settings':'numbering'}));
       if(!valid())return;
       if(config){savedSettings=data.settings;renderSettings(data.settings);}else{sequences=data.sequences;renderNumbers();}
     }catch(e){say(e.message);}finally{refresh.disabled=false;}}
   function renderSettings(settings){
     form.replaceChildren();
     form.append(h('h4','Branch defaults · '+selectedBranch));
     const terms=field('Default suggested reorder minimum (units)','number',settings.default_reorder_min_units);terms.min='0';terms.max='1000000';terms.step='1';
     const credit=field('Default suggested reorder maximum (units)','number',settings.default_reorder_max_units);credit.min='0';credit.max='1000000';credit.step='1';
     const cutoff=field('Suggested stocktake cycle (days, 1–365)','number',settings.stocktake_cycle_days);cutoff.min='1';cutoff.max='365';cutoff.step='1';
     function longField(label,value){const wrap=h('label');wrap.append(h('span',label));const ta=h('textarea');ta.rows=3;ta.maxLength=500;ta.value=value||'';wrap.append(ta);form.append(wrap);return ta;}
     const invoice=longField('Stocktake instruction note',settings.stocktake_note);
     const statement=longField('Reorder instruction note',settings.reorder_note);
     const note=h('p','These are planning defaults only. They do not alter existing product minimum/maximum, stock on hand, movements, costs or selling prices.','suite-master-note');note.style.gridColumn='1/-1';form.append(note);
     if(!canChange){form.append(h('p','Only an authorised Stocks manager can change these settings.','muted'));return;}
     const save=invButton('Save Stocks settings',async()=>{save.disabled=true;
       try{const creditValue=Number(credit.value),cents=creditValue;
         if(!Number.isSafeInteger(creditValue)||creditValue<0)throw Error('Enter a whole-unit maximum.');
         await request('SAVE_SETTINGS',{version:savedSettings.version,default_reorder_min_units:Number(terms.value),default_reorder_max_units:cents,
           stocktake_cycle_days:Number(cutoff.value),stocktake_note:invoice.value,reorder_note:statement.value});
         say('Stocks defaults saved. Existing stock items, quantities and transactions were not modified.',true);await load();
       }catch(e){say(e.message);}finally{save.disabled=false;}},'suite-primary');form.append(save);
   }
   function renderNumbers(){
     form.replaceChildren();output.replaceChildren();
     form.append(h('h4','Branch numbering controls · '+selectedBranch));
     const kind=invSelect(form,'Document / reference type',sequences,x=>x.kind,x=>x.label);kind.style.maxWidth='100%';
     const pfx=field('Reference prefix (e.g. STA-)'),padding=field('Number width (4–10)','number'),next=field('Next available number','number');
     padding.min='4';padding.max='10';padding.step='1';next.min='1';next.max='999999999';next.step='1';
     const preview=h('p','','suite-master-note');preview.style.gridColumn='1/-1';form.append(preview);
     function selected(){return sequences.find(x=>x.kind===kind.value);}
     function updateForm(){const s=selected();if(!s)return;pfx.value=s.prefix;padding.value=s.width;next.value=s.next_value;updatePreview();}
     function updatePreview(){const pad=Math.max(0,Math.min(10,Number(padding.value)||6));preview.textContent='Next reference preview: '+String(pfx.value||'')+String(next.value||'').padStart(pad,'0')+'. This is not a live stock transaction reference.';}
     kind.addEventListener('change',updateForm);[pfx,padding,next].forEach(el=>el.addEventListener('input',updatePreview));
     updateForm();
     if(canChange){
       const buttons=h('div',undefined,'suite-master-actions');buttons.style.gridColumn='1/-1';
       const save=invButton('Save numbering configuration',async()=>{
         const s=selected();if(!s)return;save.disabled=true;try{
           await request('SAVE_NUMBERING',{kind:s.kind,prefix:pfx.value,width:Number(padding.value),next_value:Number(next.value),version:s.version});
           say('Number sequence configuration saved. Existing references were not changed.',true);await load();
         }catch(e){say(e.message);}finally{save.disabled=false;}},'suite-primary');
       const reserve=invButton('Reserve next reference',async()=>{
         const s=selected();if(!s)return;
         if(pfx.value!==s.prefix||Number(padding.value)!==s.width||Number(next.value)!==s.next_value){say('Save the configuration before reserving a number.');return;}
         if(!window.confirm('Reserve a new '+s.label+' reference for '+selectedBranch+'? This consumes the next reference without creating a transaction.'))return;
         reserve.disabled=true;try{const data=await request('RESERVE_NUMBER',{kind:s.kind});
           say('Reserved '+data.reference+' for '+selectedBranch+'. This is a reservation only, not a posted document.',true);await load();
         }catch(e){say(e.message);}finally{reserve.disabled=false;}},'secondary');
       buttons.append(save,reserve);form.append(buttons);
     }else form.append(h('p','You may view numbering. Only authorised Stocks managers can save changes or reserve references.','muted'));
     const note=h('p','Important: Existing stock movement, purchase order and GRV references are not changed by these settings. Reservations are unique and audited. After reserving a number, record it on the relevant preparation manually until automatic numbering is integrated.','suite-master-note');note.style.gridColumn='1/-1';form.append(note);
     invTable(output,['Reference series','Prefix','Next available','Reserved count'],sequences.map(s=>[s.label,s.prefix,s.next_reference,String(s.reserved_count||0)]));
     output.append(h('p','Existing stock transaction and GRV references remain unchanged. Number reservations are tracked separately for accountability.','tiny'));
   }
   async function audit(){
     try{const data=await api('/api/stock-settings?'+new URLSearchParams({branch:selectedBranch,mode:'audit'}));if(!valid())return;
       output.replaceChildren(h('h4','Settings changes and reserved references'));
       const rows=data.entries.map(r=>[r.created_at,r.action,r.kind,r.actor_email]);
       invTable(output,['Date','Action','Type','Employee'],rows);
       const reserved=h('div');output.append(h('h4','Most recent reserved numbers'),reserved);
       invTable(reserved,['Date','Type','Reference','Reserved by'],data.reserved.map(r=>[r.reserved_at,r.kind,r.reference,r.actor_email]));
     }catch(e){say(e.message);}
   }
   void load();
 }
`;

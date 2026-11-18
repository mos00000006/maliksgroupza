// Browser workflow for Phase 39 operational month-end review (not an AP/GL close).
export const SUPPLIER_MONTH_END_CLIENT_SCRIPT=String.raw`
 function suiteSupplierMonthEnd(menuItem){
   const historyOnly=menuItem==='Suppliers Month End History', selectedBranch=branch;
   const w=invWorkspace('Suppliers · '+menuItem,'Operational sign-off ONLY. This does not close an accounting period, lock invoices, calculate creditor balances, or post to AP/GL.');
   const valid=()=>w.valid()&&branch===selectedBranch;
   if(!masterPermissions.supplier?.read){w.form.hidden=true;w.message('Supplier read access required.');return;}
   const holder=h('div');w.form.append(holder);const output=h('div');w.list.append(output);
   let month=new Date().toISOString().slice(0,7);
   if(!historyOnly){const field=invField(holder,'Review month (YYYY-MM)','month',month);field.addEventListener('change',()=>{month=field.value;void load();});}
   const refresh=invButton('Refresh',()=>void load(),'secondary');holder.append(refresh);
   const label=h('p','This register is for management review of UNPOSTED operational supplier data. No financial period is closed.','suite-master-note');holder.append(label);
   async function load(){refresh.disabled=true;
     try{const params=new URLSearchParams({branch:selectedBranch,mode:historyOnly?'history':'review'});if(!historyOnly)params.set('period',month);
       const data=await api('/api/supplier-month-end?'+params);if(!valid())return;output.replaceChildren();
       if(historyOnly){invTable(output,['Month','Status','Records','Reviewed by','Reviewed at'],(data.history||[]).map(x=>[x.period,'Operational review only',String(x.total_count),x.reviewed_by,x.reviewed_at]));return;}
       output.append(h('h4','Review '+month));
       invTable(output,['Measure','Count'],[['Total supplier preparation records',String(data.total)],['Draft / submitted awaiting resolution',String(data.pending)],...Object.entries(data.counts||{}).map(([s,n])=>[s,String(n)])]);
       if(data.review){output.append(h('p','Review recorded by '+data.review.reviewed_by+' on '+data.review.reviewed_at+'. Note: '+data.review.review_note,'suite-master-note'));return;}
       if(data.pending){output.append(h('p','Cannot record review: resolve pending preparation records first.','suite-master-note'));return;}
       if(!masterPermissions.supplier?.write||!['Owner / Admin','Developer / Technical Admin','Operations Manager','Regional Manager','Store Manager','Finance Manager'].includes(currentUserRole)){
         output.append(h('p','Management approval is required to record a review.','suite-master-note'));return;}
       const form=h('div',undefined,'suite-master-form');output.append(form);
       const wrap=h('label');wrap.append(h('span','Management review note (required)'));const note=h('textarea');note.rows=3;note.maxLength=1000;wrap.append(note);form.append(wrap);
       const checked=h('input');checked.type='checkbox';const checkWrap=h('label');checkWrap.append(checked,h('span','I understand this is NOT an accounting close or posted creditor balance.'));form.append(checkWrap);
       const btn=invButton('Record operational review',async()=>{
         if(!checked.checked){w.message('Confirm the non-posting limitation first.');return;}
         if(!window.confirm('Record an immutable operational review for '+month+'? No accounting period will be closed.'))return;
         btn.disabled=true;try{await invPost('/api/supplier-month-end',{branch:selectedBranch,period:month,review_note:note.value,confirm_unposted:true});w.message('Operational review recorded (not an accounting close).',true);await load();}catch(e){w.message(e.message);}finally{btn.disabled=false;}
       },'suite-primary');form.append(btn);
     }catch(e){if(valid())w.message(e.message);}finally{refresh.disabled=false;}}
   void load();
 }
`;

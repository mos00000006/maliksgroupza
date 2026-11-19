// Phase 54: browser-side Back Office reference master editor.
export const BACKOFFICE_MASTERS_CLIENT_SCRIPT = `
function suiteBackofficeMaster(item){
 const kind=({
  'Tills':'till','Till Drawings Expenses':'drawing_expense','Payment Types':'payment_type',
  'Coinage':'coinage','Cash Sales Transaction Numbers Free Voucher':'free_voucher_reference'
 })[item];
 if(!kind)return;
 const w=invWorkspace(item,'Operational setup only — these records do NOT issue free vouchers, activate till devices, change tender rules, post cash movements, or change VAT/GL.');
 const params=()=>new URLSearchParams({kind,branch});
 const toolbar=h('div',undefined,'suite-master-actions');
 const search=invField(toolbar,'Search code or name','search');search.placeholder='Search '+item.toLowerCase();
 const refresh=invButton('Search / Refresh',()=>void load());
 const newButton=invButton('New master record',()=>edit(null),'suite-primary');
 const auditButton=invButton('Audit history',()=>void audit());
 toolbar.append(refresh,newButton,auditButton);w.form.append(toolbar);
 const guidance={
  till:'Till code directory only; new codes are NOT automatically enabled at a cashier workstation.',
  drawing_expense:'Drawing and expense reason codes only; this DOES NOT withdraw till cash.',
  payment_type:'Tender type catalogue only; existing CASH/CARD checkout logic is unchanged.',
  coinage:'Cash-count denomination descriptions only; no counted cash or bank deposit is posted.',
  free_voucher_reference:'Reference series register only. It does NOT issue cash sale numbers or free vouchers.'
 }[kind];
 const note=h('p',guidance,'suite-master-note');w.form.append(note);
 const editor=h('section',undefined,'suite-master-editor');editor.hidden=true;w.form.append(editor);
 const records=h('section');w.list.append(h('h4','Branch master register'),records);
 const auditBox=h('section');w.list.append(auditBox);
 let rows=[],canWrite=false;
 function edit(row){if(!canWrite)return;
  editor.replaceChildren();editor.hidden=false;editor.append(h('h4',row?'Edit '+row.code:'Create '+item));
  const fields=h('div',undefined,'suite-master-form');editor.append(fields);
  const code=invField(fields,'Code','text',row?.code||'');code.maxLength=32;code.readOnly=!!row;
  const name=invField(fields,kind==='till'?'Till / workstation description':kind==='coinage'?'Coin denomination / name':'Name / description','text',row?.name||'');name.maxLength=120;
  const notes=invField(fields,'Operational notes','text',row?.notes||'');notes.maxLength=250;
  const active=invSelect(fields,'Status',[['true','Active'],['false','Inactive']],x=>x[0],x=>x[1]);active.value=String(row?.active??true);
  const actions=h('div',undefined,'suite-master-actions');editor.append(actions);
  const save=invButton(row?'Save changes':'Create master record',()=>void persist(),'suite-primary');
  const cancel=invButton('Cancel',()=>{editor.hidden=true;editor.replaceChildren();});actions.append(save,cancel);
  async function persist(){save.disabled=true;w.message('');try{
   const data={branch,kind,code:code.value,name:name.value,notes:notes.value,active:active.value==='true'};
   if(row){data.id=row.id;data.version=row.version;}
   await invPost('/api/backoffice-masters',data);
   if(w.valid()){editor.hidden=true;w.message('Master record saved. No tender or accounting posting occurred.',true);await load();}
  }catch(e){if(w.valid())w.message(e.message);}finally{save.disabled=false;}}
 }
 async function load(){try{
  const url='/api/backoffice-masters?'+params()+'&q='+encodeURIComponent(search.value.trim());
  const data=await api(url);if(!w.valid())return;
  rows=data.items||[];canWrite=Boolean(data.writable);newButton.hidden=!canWrite;
  invTable(records,['Code','Name','Notes','Status','Updated','Actions'],rows.map(r=>{
   const actions=h('div',undefined,'suite-master-actions');
   if(canWrite)actions.append(invButton('Edit',()=>edit(r)));
   return [r.code,r.name,r.notes,r.active?'Active':'Inactive',r.updated_at?.slice(0,16)||'',actions];
  }));
 }catch(e){if(w.valid())w.message(e.message);}}
 async function audit(){try{
  const data=await api('/api/backoffice-masters/audit?'+params());if(!w.valid())return;
  auditBox.replaceChildren(h('h4','Recent master changes'));
  invTable(auditBox,['Action','Record','By','When'],(data.items||[]).map(x=>[x.action,x.master_id,x.actor_email,x.created_at?.slice(0,16)||'']));
 }catch(e){if(w.valid())w.message(e.message);}}
 void load();
}
`;

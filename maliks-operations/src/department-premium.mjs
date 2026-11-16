// Visual shell only. Existing branch-scoped workflows, permissions and payment posting are unchanged.
export const DEPARTMENT_PREMIUM_CSS = String.raw`
.maliks-department{--navy:#0A2A3F;--gold:#D4A017;--white:#FFFFFF;--bg:#F5F6F7;--grey:#F0F2F3;--line:#E3E5E7;background:var(--bg);color:var(--navy);font-family:Inter,'Segoe UI',Arial,sans-serif}
.maliks-department .department-header{background:var(--navy);color:var(--white);position:sticky;top:0;z-index:140;box-shadow:0 4px 20px rgba(10,42,63,.14)}
.maliks-department .department-header[hidden]{display:none!important}
.maliks-department .department-brandbar{display:flex;align-items:center;gap:16px;padding:11px clamp(16px,3vw,42px);min-height:85px}
.maliks-department .department-brand{display:flex;align-items:center;gap:13px;border:0;background:transparent;color:var(--white);padding:0;cursor:pointer;text-align:left;flex-shrink:0}
.maliks-department .department-brand-logo{width:66px;height:66px;object-fit:contain;flex-shrink:0}
.maliks-department .department-brand strong{display:block;color:var(--white);font-size:clamp(18px,2vw,26px);letter-spacing:.055em;line-height:1.12;font-weight:900}
.maliks-department .department-brand em{color:var(--gold);font-style:normal}
.maliks-department .department-brand small{display:block;color:var(--white);font-size:9px;font-weight:750;letter-spacing:.09em;margin-top:5px}
.maliks-department .department-brand small b{color:var(--gold)}
.maliks-department .department-secure{display:flex;align-items:center;gap:9px;margin-left:auto;font-size:11px;font-weight:850;letter-spacing:.1em;white-space:nowrap}
.maliks-department .department-secure i{width:9px;height:9px;background:var(--gold);border-radius:50%}
.maliks-department .department-user{font-size:12px;font-weight:750;border:1px solid rgba(255,255,255,.24);border-radius:11px;padding:14px;color:var(--white);max-width:320px;white-space:nowrap;text-overflow:ellipsis;overflow:hidden}
.maliks-department .department-navbar{display:flex;background:var(--navy);padding:0 clamp(12px,2.6vw,40px);border-top:1px solid rgba(255,255,255,.18);overflow-x:auto;scrollbar-color:var(--gold) var(--navy)}
.maliks-department .department-nav-button{flex:1 0 auto;min-width:104px;min-height:83px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;font-size:11px;font-weight:750;color:var(--white);background:transparent;border:0;border-bottom:3px solid transparent;border-radius:0;padding:11px 14px;cursor:pointer}
.maliks-department .department-nav-button:hover,.maliks-department .department-nav-button[aria-pressed="true"]{background:rgba(255,255,255,.09);border-bottom-color:var(--gold)}
.maliks-department .department-nav-icon{display:flex;align-items:center;justify-content:center;color:var(--gold);width:25px;height:25px}
.maliks-department .department-nav-icon svg{height:24px;width:24px;stroke:var(--gold);stroke-width:2;fill:none}
.maliks-department .department-shell{display:block;min-height:calc(100vh - 170px)}
.maliks-department .department-shell>aside{display:none}
.maliks-department .department-shell>main{width:100%;max-width:1660px;margin:0 auto;padding:23px clamp(18px,2.9vw,46px) 70px}
.maliks-department .department-shell .top{margin-bottom:14px;padding:0 0 11px;border-bottom:1px solid var(--line)}
.maliks-department .department-shell .top h2{font-size:19px;color:var(--navy);margin:0 0 4px}
.maliks-department .department-shell .top .muted{color:var(--navy);opacity:.7;font-size:12px}
.maliks-department .department-shell .tag{display:none}
.maliks-department #branch-panel{background:var(--white);border:1px solid var(--line);border-radius:15px;padding:11px 20px;margin-bottom:20px}
.maliks-department #branch-panel .bar{margin:0;gap:20px;align-items:center}
.maliks-department #branch-panel label{font-size:12px;color:var(--navy)}
.maliks-department #branch-panel select{min-height:51px;background:var(--white);border:1px solid var(--line);color:var(--navy);border-radius:11px;font-size:15px}
.maliks-department #branch-panel p{color:var(--navy);margin:8px 0}
.maliks-department .panel{background:var(--white);border:1px solid var(--line);border-radius:17px;box-shadow:0 6px 20px rgba(10,42,63,.055);padding:23px}
.maliks-department .panel h3{color:var(--navy);font-size:19px}
.maliks-department input,.maliks-department select,.maliks-department textarea{background:var(--white);border:1px solid var(--line);border-radius:10px;color:var(--navy);padding:12px 14px;min-height:48px;font-size:14px}
.maliks-department button{border-radius:10px;min-height:43px;background:var(--navy);color:var(--white);font-weight:780}
.maliks-department button:hover:not(:disabled){filter:brightness(1.07)}
.maliks-department button.secondary{background:var(--grey);color:var(--navy);border:1px solid var(--line)}
.maliks-department button:disabled{background:var(--grey);color:var(--navy);opacity:.5}
.maliks-department button:focus-visible,.maliks-department input:focus-visible,.maliks-department select:focus-visible{outline:3px solid var(--gold);outline-offset:2px}
.maliks-department .notice,.maliks-department .training-warning,.maliks-department .cashup-warning{background:var(--grey);border:1px solid var(--line);border-left:4px solid var(--gold);color:var(--navy);border-radius:10px;font-size:13px}
.maliks-department .price,.maliks-department .total,.maliks-department .grand-total{color:var(--navy)}
.maliks-department .review-box,.maliks-department .quote-detail,.maliks-department .tender-prep,.maliks-department .tender-preview{background:var(--bg);border:1px solid var(--line);color:var(--navy);border-radius:11px}
.maliks-department .paid-pill,.maliks-department .success{background:var(--grey);color:var(--navy);border-left:3px solid var(--gold)}
.maliks-department .error{background:var(--grey);color:var(--navy);border:2px solid var(--gold)}
.maliks-department .department-hero{background:var(--navy);border-left:5px solid var(--gold);border-radius:19px;padding:33px clamp(24px,3.8vw,52px);display:flex;align-items:center;justify-content:space-between;gap:30px;box-shadow:0 12px 33px rgba(10,42,63,.15);color:var(--white)}
.maliks-department .department-eyebrow{color:var(--gold);font-size:11px;font-weight:850;letter-spacing:.19em;text-transform:uppercase}
.maliks-department .department-hero h1{color:var(--white);font-size:clamp(29px,3.1vw,44px);margin:9px 0;line-height:1.1}
.maliks-department .department-hero p{color:var(--white);opacity:.86;max-width:660px;line-height:1.55;font-size:14px;margin:0}
.maliks-department .department-hero-mark{display:grid;place-items:center;flex:0 0 105px;height:105px;border:2px solid var(--gold);border-radius:22px}
.maliks-department .department-hero-mark svg{width:57px;height:57px;stroke:var(--gold);fill:none}
.maliks-department .department-section-title{display:flex;justify-content:space-between;align-items:end;gap:12px;margin:29px 0 15px}
.maliks-department .department-section-title h2{font-size:21px;color:var(--navy);margin:0}
.maliks-department .department-section-title span{font-size:12px;color:var(--navy);opacity:.7}
.maliks-department .department-status-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:15px;margin-top:22px}
.maliks-department .department-status-card{background:var(--white);border:1px solid var(--line);border-top:4px solid var(--gold);border-radius:15px;padding:20px;box-shadow:0 4px 18px rgba(10,42,63,.045)}
.maliks-department .department-status-icon{width:44px;height:44px;display:flex;align-items:center;justify-content:center;border-radius:11px;background:var(--grey);margin-bottom:15px}
.maliks-department .department-status-icon svg{width:24px;height:24px;stroke:var(--gold)}
.maliks-department .department-status-card h3{font-size:15px;color:var(--navy);margin:0 0 7px}
.maliks-department .department-status-card p{font-size:12px;line-height:1.5;margin:0;color:var(--navy);opacity:.7}
.maliks-department .department-actions-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:15px}
.maliks-department .department-action-card{display:flex;align-items:center;gap:16px;min-height:113px;text-align:left;background:var(--white);border:1px solid var(--line);border-radius:15px;padding:20px;color:var(--navy);box-shadow:0 4px 16px rgba(10,42,63,.045)}
.maliks-department .department-action-card:hover{background:var(--bg)!important;border-color:var(--gold);filter:none!important}
.maliks-department .department-action-icon{flex-shrink:0;width:49px;height:49px;border-radius:12px;background:var(--grey);display:grid;place-items:center}
.maliks-department .department-action-icon svg{width:26px;height:26px;stroke:var(--gold)}
.maliks-department .department-action-label{display:block;font-size:15px;font-weight:850;color:var(--navy)}
.maliks-department .department-action-sub{display:block;font-size:11px;line-height:1.5;color:var(--navy);font-weight:500;opacity:.72;margin-top:5px}
.maliks-department .department-workspace-bar{display:flex;align-items:center;gap:21px;margin:4px 0 19px;background:var(--white);border:1px solid var(--line);border-radius:14px;padding:15px 20px}
.maliks-department .department-back{background:var(--grey);border:1px solid var(--line);color:var(--navy);white-space:nowrap}
.maliks-department .department-workspace-bar small{font-size:11px;color:var(--navy);opacity:.67}
.maliks-department .department-workspace-bar h2{color:var(--navy);font-size:23px;margin:4px 0}
.maliks-department .department-foot{margin:21px 0;color:var(--navy);font-size:12px;opacity:.7}
.maliks-department table th,.maliks-department table td{border-bottom:1px solid var(--line);color:var(--navy)}
.maliks-department .two{grid-template-columns:minmax(0,1.2fr) minmax(320px,.8fr)}
.maliks-department .scroll{overflow:auto}
.maliks-professional .suite-workspace-bar{display:flex;align-items:center;gap:17px;background:#FFFFFF;border:1px solid #E3E5E7;border-radius:14px;padding:17px 21px;margin:0 0 18px}
.maliks-professional .suite-workspace-back{background:#F0F2F3;color:#0A2A3F;border:1px solid #E3E5E7;min-height:45px;border-radius:10px}
.maliks-professional .suite-workspace-path small{font-size:11px;color:#0A2A3F;opacity:.72}
.maliks-professional .suite-workspace-path h2{font-size:23px;color:#0A2A3F;margin:4px 0}
.maliks-professional #suite-feature-detail.suite-master-workspace{margin-top:0;background:#FFFFFF;color:#0A2A3F;border:1px solid #E3E5E7}
.maliks-professional #suite-feature-detail button:not(.secondary){background:#0A2A3F;color:#FFFFFF;border-radius:9px}
.maliks-professional #suite-feature-detail button.secondary{background:#F0F2F3;color:#0A2A3F;border:1px solid #E3E5E7}
.maliks-professional #suite-feature-detail .suite-master-note,.maliks-professional #suite-feature-detail .suite-master-editor{background:#F0F2F3;color:#0A2A3F;border-color:#E3E5E7}
.maliks-professional #suite-feature-detail input,.maliks-professional #suite-feature-detail select{background:#FFFFFF;color:#0A2A3F;border:1px solid #E3E5E7}
.maliks-professional #suite-feature-detail button:focus-visible{outline:3px solid #D4A017;outline-offset:2px}
.maliks-department .department-shell .top>div{display:flex;align-items:center;gap:14px;flex-wrap:wrap}
.maliks-department .department-shell .top>div .muted{margin-right:auto}
.maliks-department .department-shell .top button{min-height:37px;padding:7px 14px;background:#F0F2F3;color:#0A2A3F;border:1px solid #E3E5E7}

@media(max-width:1150px){.maliks-department .department-status-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.maliks-department .department-actions-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:760px){.maliks-department .department-brandbar{flex-wrap:wrap}.maliks-department .department-secure{margin-left:auto}.maliks-department .department-user{max-width:100%;flex:1 1 100%}.maliks-department .department-shell>main{padding:18px 13px 45px}.maliks-department .department-hero{padding:25px}.maliks-department .department-hero-mark{display:none}.maliks-department .department-status-grid{grid-template-columns:1fr 1fr}.maliks-department .department-actions-grid{grid-template-columns:1fr}.maliks-department .department-workspace-bar,.maliks-professional .suite-workspace-bar{flex-wrap:wrap}.maliks-department .two{grid-template-columns:1fr}}
@media(max-width:450px){.maliks-department .department-status-grid{grid-template-columns:1fr}.maliks-department .department-nav-button{min-width:94px}.maliks-department .department-brand strong{font-size:20px}}
@media print{.maliks-department .department-header,.maliks-department .department-workspace-bar{display:none!important}}
`;
export const DEPARTMENT_PREMIUM_CLIENT_SCRIPT = String.raw`
 const DEPARTMENT_META={
  sales:{title:'Sales Workspace',intro:'Create VAT-inclusive quotations, search branch products and view your quotation history.',hero:'shopping-cart',stats:[
    ['Product catalogue','Search by code or description','boxes'],['Quotation basket','Review items and quantities','shopping-cart'],['VAT-inclusive pricing','Transparent quotation totals','receipt'],['Print quotations','80mm quotation slips','printer']
  ],actions:[['new','Create New Quotation','Search products and submit to Cash Office','shopping-cart'],['history','My Quotations','Recent quotations and reprints','receipt']]},
  tills:{title:'Tills Workspace',intro:'Cashier checkout with controlled till shifts, payment confirmation and paid receipts.',hero:'credit-card',stats:[
    ['Cash / Card','Cashier-confirmed payments','credit-card'],['Till shifts','Open and close your own shift','clock'],['Paid invoices','Review payment status','receipt'],['Receipts','Print 80mm paid slips','printer']
  ],actions:[['checkout','Cashier Checkout','Find quotation and confirm Cash or Card','credit-card'],['shifts','Till Shift Register','Open, close and inspect your shifts','clock'],['payments','Paid Invoices','Confirmed payments and receipt options','receipt'],['quotes','Recent Quotations','Review authorised quotations','clipboard-list'],['preparations','Tender Preparations','View unposted preparation records','wallet']]},
  cashoffice:{title:'Cash Office Workspace',intro:'Review cashier payment evidence, monitor paid invoices and inspect till declarations.',hero:'wallet',stats:[
    ['Paid invoices','Review confirmed receipts','receipt'],['Shift review','Declarations and exceptions','users'],['Provisional cash-up','An estimate, not reconciliation','wallet'],['Payment evidence','Controlled verification','file-text']
  ],actions:[['paid','Paid Invoice Audit','Review and reprint posted invoices','receipt'],['shifts','Shift Reviews','Inspect declarations and flags','users'],['cashup','Provisional Cash-Up','Review estimates and exceptions','wallet'],['evidence','Payment Evidence','Inspect verification records','file-text'],['preparations','Tender Preparations','Proposed, unposted tenders','clipboard-list'],['quotes','Submitted Quotations','Review branch quotations','search']]},
  dispatch:{title:'Dispatch Workspace',intro:'Manage the paid-invoice queue, picker handover and independent checking.',hero:'truck',stats:[
    ['Paid queue','Confirmed invoice jobs only','receipt'],['Picking','Record picking and staging','boxes'],['Independent check','Confirm the picked items','package-check'],['Print slips','A4 picking documents','printer']
  ],actions:[['queue','Open Dispatch Queue','Print slips and record pick/check actions','truck']]}
 };
 function departmentIcon(name,cls){const icon=h('span',undefined,cls);icon.setAttribute('aria-hidden','true');icon.innerHTML=SUITE_PREMIUM_ICONS[name]||SUITE_PREMIUM_ICONS.house;return icon;}
 function departmentDashboard(){
   const info=DEPARTMENT_META[APP],root=E('app-content');
   const hero=h('section',undefined,'department-hero'),copy=h('div');
   copy.append(h('div','MALIKS PROFESSIONAL / '+APP.toUpperCase(),'department-eyebrow'),h('h1',info.title),h('p',info.intro));
   hero.append(copy,departmentIcon(info.hero,'department-hero-mark'));root.append(hero);
   const stats=h('div',undefined,'department-status-grid');
   for(const [title,note,icon] of info.stats){const card=h('article',undefined,'department-status-card');card.append(departmentIcon(icon,'department-status-icon'),h('h3',title),h('p',note));stats.append(card);}root.append(stats);
   const heading=h('div',undefined,'department-section-title');heading.append(h('h2','Open a workspace'),h('span','Select a function to open its own screen'));root.append(heading);
   const cards=h('div',undefined,'department-actions-grid');
   for(const [id,title,detail,icon] of info.actions){const b=h('button',undefined,'department-action-card');b.type='button';
     const wording=h('span');wording.append(h('span',title,'department-action-label'),h('span',detail,'department-action-sub'));
     b.append(departmentIcon(icon,'department-action-icon'),wording);b.addEventListener('click',()=>setDepartmentView(id));cards.append(b);
   }root.append(cards);
   const note=APP==='cashoffice'?'Provisional cash-up is not an approved reconciliation.':APP==='dispatch'?'Picker/checker actions do not release goods or create a POD.':APP==='tills'?'Confirm payments only after receiving cash or seeing APPROVED on the terminal.':'Creating a quotation does not record payment or deduct stock.';
   root.append(h('p',note+' All actions remain restricted to your assigned branch and role.','department-foot'));
 }
 function departmentDraw(){
   const root=E('app-content');root.replaceChildren();err('');
   const meta=DEPARTMENT_META[APP],menu=DEPARTMENT_NAV[APP]||[],active=menu.find(([id])=>id===departmentView);
   E('screen-heading').textContent=departmentView==='home'?meta.title:active?.[1]||meta.title;
   E('workstation-notice').hidden=true;E('workstation-tag').hidden=true;
   for(const button of E('department-navigation').querySelectorAll('[data-department-view]'))if(button.classList.contains('department-nav-button'))button.setAttribute('aria-pressed',String(button.dataset.departmentView===departmentView));
   if(departmentView==='home'){departmentDashboard();return;}
   const bar=h('div',undefined,'department-workspace-bar'),back=h('button','Back to Dashboard','department-back');back.type='button';back.addEventListener('click',()=>setDepartmentView('home'));
   const title=h('div');title.append(h('small',meta.title+' / '+branch),h('h2',active?.[1]||'Workspace'));bar.append(back,title);root.append(bar);
   if(APP==='sales')posView(departmentView==='history'?'history':'new');
   else if(APP==='dispatch')dispatchView();
   else void quoteView(departmentView);
 }
 function setDepartmentView(next){
   if(!DEPARTMENT_NAV[APP]?.some(([id])=>id===next))return;
   if(APP==='sales'&&pendingQuote&&next!==departmentView){err('Resolve the pending quotation before leaving the workspace.');return;}
   departmentView=next;draw();window.scrollTo({top:0,behavior:'instant'});
 }
`;

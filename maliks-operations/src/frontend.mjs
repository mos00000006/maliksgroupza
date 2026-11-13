import { POWERBUILD_LOGO_BASE64 } from './powerbuild-logo.mjs';

const POWERBUILD_LOGO_BYTES = Uint8Array.from(atob(POWERBUILD_LOGO_BASE64), c => c.charCodeAt(0));

const APPS={
  pos:{name:'Maliks POS Professional',subtitle:'Accounting & POS Solutions',hint:'Professional management workspace. Department transactions remain in their own secured applications.'},
  sales:{name:'Maliks Sales',subtitle:'Sales & Quotations',hint:'Product search, VAT-inclusive quotations, quotation history and printing. No till payment or dispatch posting.'},
  tills:{name:'Maliks Tills',subtitle:'Cashier Workstation',hint:'Cash or card: cashier confirms receipt and sends paid internal invoice directly to Dispatch. Bank/terminal integration remains separate.'},
  cashoffice:{name:'Maliks Cash Office',subtitle:'Cash Office Workstation',hint:'Audit cashier-confirmed Cash/Card payments and independently verify legacy or EFT payment requests.'},
  member:{name:'Maliks Member Team',subtitle:'Employee Access & Store Assignments',hint:'Managers may add and deactivate employees only in their authorised stores. Access is audited.'},
  dispatch:{name:'Maliks Dispatch',subtitle:'Dispatch Workstation',hint:'Confirmed paid invoices appear in the dispatch queue. Picking and independent checking are recorded; stock posting, exit release and driver POD are not yet integrated.'},
};
// Phase 14: The Professional accounting suite and Sales are separate Workers.
// This is a navigation inventory; unbuilt functions remain previews, not live postings.
const SUITE_NAV = [
  ['home','Home','⌂'],['debtors','Debtors','◎'],
  ['suppliers','Suppliers','▤'],['stock','Stock','▦'],['backoffice','Back Office','▥'],
  ['dispatching','Dispatching','⇥'],['headoffice','Head Office','◇'],
  ['system','System Settings','⚙'],['widget','Widget','◫'],
  ['help','Help','?'],['lock','Lock','♙'],['exit','Exit','⏻'],
];
const SUITE_MENU_TREE = {
  debtors: {
    'Master Files':['Debtors','Routes','Categories','Classifications','Regions and Areas','Delivery Methods','Debtors Returns Reasons','Debtors Invoicing Classifications','Debtors Invoicing Additional Notes'],
    'Transactions':['Payments and Reversals','Journals','PDC Register','Group Accounts Invoice Settlements'],
    'Reporting':['Master','Transactions','Sales','Ledger','Statements','Control Account','Age Analysis','Debtors PDCs','Audits'],
    'Utilities':['Current Agents','Block Sales','Reprint Documents','Reprint Journals','Labelling','Delete Expired Quotations','Debtors Master CSV/Text File Export','Debtors Master CSV File Import'],
    'Settings':['Settings','Numbering'],
  },
  suppliers: {
    'Master Files':['Suppliers','Categories','Classifications','Claims','Suppliers Returns Reasons','Statements Recon Reasons','Invoices and Debit Notes Details'],
    'Transactions':['Purchase Orders','Invoices and Debit Notes','Payments and Reversals','Journals','Claims','Rebates','Payments Reconciliation'],
    'Reporting':['Master','Transactions','Ledger','Statements','Control Account','Age Analysis','Payments','Suppliers PDC','Purchases','Audits'],
    'Utilities':['Control Agents','Statement Reconciliation','Reprint Documents','Reprint Unallocated Balances to Unpaid Invoices','Housekeeping','Supplier Master CSV File Export'],
    'Settings':['Settings','Numbering'],
    'Suppliers Month End':['Suppliers Month End','Suppliers Month End History'],
  },
  stock: {
    'Master Files':['Stock Master','Departments','Categories','Units','Barcodes','Stock Groups'],
    'Transactions':['Purchase Orders','Goods Received Vouchers (GRV)','Stock Transfers','Stock Adjustments','Stock Returns','Stock Take'],
    'Reporting':['Master','Stock Valuations','Stock Take','Transactions','Sales','Onhands','Re-Order','Audits','Promotions'],
    'Utilities':['Promotions','Labelling','Pricing Utilities','Master Utilities','Minimum / Maximum Stock Levels','Stock Take','Opening Stock Count','Freeze Onhands','Reprint Documents','Link Pictures','Stock Master CSV/Text File Export','Daily Stock Count','Serial Number Tracking','Stock Master CSV File Import','Delete Stock Items','Delete Stock Purchase Orders'],
    'Settings':['Settings','Numbering'],
  },
  backoffice: {
    'Master Files':['Tills','Till Drawings Expenses','Payment Types','Coinage','Cash Sales Transaction Numbers Free Voucher'],
    'Widget':['Back Office Widget'],
    'Reporting':['Tills','Departments','Sales Reps','Transactions','Laybyes','Tills Drawings','Audits','VAT','FoodCourt','Management','Parked Transactions'],
    'Utilities':['Reprint Documents','Housekeeping'],
    'Settings':['Settings','Numbering'],
    'Cash-Up':['Till Cash-Up','Till Transfer','Till Cash Take On'],
    'End of Day':['End of Day','End of Day History'],
    'Sales and Stock Month End':['Sales and Stock Month End','Sales and Stock Month End History'],
    'Housekeeping':['Clear Temporary Spool Folders'],
  },
  dispatching: {
    'Transactions':['Staggered Invoices Dispatch','Staggered Dispatch Credit'],
    'Reporting':['Staggered Invoices Awaiting Dispatch','Staggered Invoices Awaiting Dispatch Quick Valuation','Stock Items Awaiting Dispatch Summary','Staggered Invoices','Delivery Schedule'],
    'Utilities':['Amend Debtors/Laybyes Delivery Dates'],
  },
  headoffice: {
    'Master Files':['Master Files'], 'Transactions':['Transactions'], 'Reporting':['Reporting'],
    'Utilities':['Utilities'], 'Settings':['Settings'],
    'Synchronization':['Branches Synchronization History','Branches Comms Synchronization Status','Head Office Comms Sales Synchronization History'],
  },
  system: {'Administration':['System Settings','User Permissions','Branch Access','Numbering','Audit Log']},
  widget: {'Dashboard':['Management Dashboard','Branch Dashboard','Sales Overview','Stock Overview']},
  help: {'Support':['Using Maliks Professional','Department Access','Branch Selection','Contact Administrator']},
  tills: {'Tills Workstation':['Cash / Card Checkout','Till Shift Open / Close','80mm Paid Receipts']},
  cashoffice: {'Cash Office Workstation':['Payment Verification','Cash-Up','Cash Office Reports']},
};
const SUITE_TITLES = Object.fromEntries(SUITE_NAV.map(([id,label])=>[id,label]));
function suiteHeader(){
  const buttons=SUITE_NAV.map(([id,label,symbol])=>`<button type="button" data-suite-module="${id}" class="suite-nav-button" aria-pressed="false"><span class="suite-nav-icon" aria-hidden="true">${symbol}</span><span>${label}</span></button>`).join('');
  return `<header id="suite-navigation" class="suite-header" hidden>
    <div class="suite-brandbar"><button type="button" class="suite-brand" data-suite-module="home" aria-label="Maliks Professional home"><img class="suite-brand-logo" src="/powerbuild-logo.png" alt="PowerBuild logo" width="66" height="66"/><span class="suite-brand-text"><strong>MALIKS <span>POS</span></strong><small>ACCOUNTING &amp; POS SOLUTIONS <em>PROFESSIONAL</em></small></span></button><span class="suite-system-status">● SECURE WORKSPACE</span><span id="suite-user" class="suite-user">Signed in</span></div>
    <nav class="suite-navbar" aria-label="Maliks Professional modules">${buttons}</nav>
  </header>`;
}
function page(app){
 const d=APPS[app];
 const suiteShell=app==='pos';
 const salesShell=app==='sales';
 const releaseLabel=app==='dispatch'?'PAID INVOICE DISPATCH QUEUE':app==='tills'?'TILLS — PAYMENT WORKFLOW':app==='cashoffice'?'CASH OFFICE — VERIFICATION':app==='member'?'TEAM · STORE ACCESS':salesShell?'SALES · QUOTATIONS':'ACCOUNTING & POS SOLUTIONS';
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
 .login-panel{max-width:520px;margin:36px auto;padding:30px;box-shadow:0 16px 40px #102a4b18}.login-panel input{margin-bottom:16px}.login-panel button{width:100%}.login-logo{display:block;width:76px;height:76px;object-fit:contain;margin:0 auto 16px}
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
 td input[type=number]{min-width:86px;width:95px;padding:8px}.shift-form{display:grid;grid-template-columns:repeat(auto-fit,minmax(185px,1fr));gap:12px;align-items:end}.shift-form button{margin-bottom:1px}.shift-form .info{grid-column:1/-1}.review-flag{color:#991b1b;font-weight:700}.review-check{color:#166534;font-weight:700}.review-pending{color:#92400e;font-weight:700}.review-box{margin:18px 0;padding:17px;border:1px solid #b9cadc;border-radius:10px;background:#f8fafc}.review-box textarea{min-height:85px;resize:vertical}.review-stats{display:flex;gap:10px;flex-wrap:wrap;margin:12px 0}.review-stats span{background:#e9eef6;border-radius:8px;padding:8px 12px;font-weight:700;font-size:13px}.tender-prep{border:2px solid #abc9e5;border-radius:11px;background:#f1f7fe;padding:17px;margin:14px 0}.tender-prep .training-warning{margin-top:0}.tender-rows{display:grid;grid-template-columns:repeat(auto-fit,minmax(175px,1fr));gap:10px}.tender-prep .total{margin:4px 0;padding:4px 0}.cashup-warning{border-left:5px solid #b45309;background:#fff4d6;padding:13px 15px;font-weight:700;border-radius:5px;margin:10px 0 15px}.cashup-diff{color:#991b1b;font-weight:800}.cashup-zero{color:#56616f;font-weight:700}.cashup-stats{display:flex;gap:10px;flex-wrap:wrap;margin:14px 0}.cashup-stats span{border:1px solid #dbe1e9;background:#f3f6fb;border-radius:7px;padding:9px 12px;font-size:13px;font-weight:700}.cashup-table{min-width:1030px}.evidence-table{min-width:980px}.evidence-form{border:1px solid #b8cbdf;background:#f5f9ff;border-radius:10px;padding:17px;margin:15px 0}.evidence-form textarea{min-height:85px}.evidence-form .bar>*{min-width:170px}.evidence-history{margin-top:18px}
 .paid-pill{display:inline-block;background:#dcfce7;color:#166534;font-weight:800;border-radius:6px;padding:5px 9px;letter-spacing:.06em}
 .dispatch-alert-overlay{position:fixed;inset:0;z-index:5000;background:rgba(8,26,48,.62);display:flex;align-items:center;justify-content:center;padding:18px}
 .dispatch-alert-card{width:min(550px,100%);background:white;border-radius:16px;padding:26px;box-shadow:0 20px 65px #0005;border-top:8px solid #e9c400}
 .dispatch-alert-card h2{font-size:25px;margin-bottom:12px}.dispatch-alert-card .bar{margin:14px 0 0}
 .dispatch-alert-card .bar button{min-width:160px}.dispatch-alert-card .paid-pill{margin-bottom:12px}
 .print-sheet{display:none}
 .print-sheet .doc-head{display:flex;align-items:center;justify-content:space-between;gap:20px;border-bottom:4px solid #eaca15;padding-bottom:15px;margin-bottom:22px}
 .print-sheet .doc-head .print-logo{width:140px;max-height:115px;object-fit:contain}
 .print-sheet .doc-right{text-align:right}
 .print-sheet .doc-title{font-size:23pt;font-weight:800;color:#102a4b;margin:3px 0 5px}
 .print-sheet .doc-meta{display:grid;grid-template-columns:1fr 1fr;gap:8px 26px;margin:14px 0 22px}
 .print-sheet .doc-meta p{margin:0;padding:3px 0}
 .print-sheet .doc-paid{display:inline-block;color:#106534;border:3px solid #178149;padding:7px 19px;border-radius:7px;font-weight:900;font-size:20pt;letter-spacing:.1em}
 .print-sheet .doc-totals{width:min(350px,100%);margin:20px 0 0 auto;border-top:3px solid #102a4b}
 .print-sheet .doc-totals p{display:flex;justify-content:space-between;margin:8px 0}
 .print-sheet .doc-totals strong{font-size:15pt;color:#102a4b}
 .print-sheet .doc-foot{margin-top:32px;border-top:1px solid #bcc6d5;padding-top:12px;color:#43536b;font-size:10pt}
 .print-sheet .pick-check{font-size:15pt;font-weight:700}
 .print-sheet .pick-signatures{display:grid;grid-template-columns:1fr 1fr;gap:15px 25px;margin-top:40px}
 .print-sheet .pick-signatures p{border-top:1px solid #345;padding-top:8px}
 

 /* Phase 15 master-file workspace */
 .suite-feature-detail.suite-master-workspace{background:#fff;border:1px solid #dce5ed;color:#21334b;box-shadow:0 5px 20px #102a4b10}
 .suite-master-header{display:flex;flex-direction:column;gap:10px}.suite-master-header h3{font-size:21px;color:#152f4a}
 .suite-master-actions{display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin:12px 0}
 .suite-master-actions input{flex:2 1 230px;min-width:200px}.suite-master-actions button{flex:0 0 auto}
 .suite-master-note{font-size:12px;color:#475f77;background:#f0f5fb;padding:12px;border-radius:7px}
 .suite-master-editor{background:#f7faff;border:1px solid #cad9e8;padding:19px;border-radius:12px;margin:17px 0}
 .suite-master-editor[hidden],.suite-master-catalogue[hidden]{display:none!important}
 .suite-master-form{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px}
 .suite-master-form label{font-size:12px;color:#425770}.suite-master-form label span{display:block;margin-bottom:6px}
 .suite-master-form-buttons{grid-column:1/-1;display:flex;gap:10px;flex-wrap:wrap}
 .suite-master-catalogue{margin-top:28px;padding:16px;border-top:2px solid #e1eaf4}
 .suite-master-catalogue h4{margin:0 0 7px}
 /* Maliks Professional suite: independent visual identity; existing branch receipts remain PowerBuild-branded. */
 .maliks-professional{background:#edf2f7}
 .maliks-sales-workstation aside{background:linear-gradient(150deg,#101e32,#1d4562)}
 .maliks-sales-workstation aside h1{color:#f0c875;font-size:24px}
 .maliks-sales-workstation aside .brand-logo{width:110px;height:110px;object-fit:contain}
 .maliks-sales-workstation aside .nav{background:#ffffff17;border-left:3px solid #e9c46f}
 .suite-header{position:sticky;top:0;z-index:200;background:#101e32;color:#f7fbff;box-shadow:0 5px 22px #0b1d3430}
 .suite-header[hidden]{display:none!important}
 .suite-brandbar{display:flex;align-items:center;gap:18px;padding:13px clamp(16px,3vw,42px);min-height:84px;background:linear-gradient(110deg,#101e32 0%,#193a59 66%,#12465a 100%)}
 .suite-brand{display:flex;align-items:center;gap:12px;border:0;background:transparent;padding:0;color:#fff;text-align:left;flex:none}
 .suite-brand-logo{width:66px;height:66px;object-fit:contain;flex:0 0 66px;filter:drop-shadow(0 4px 8px #0003)}
 .suite-brand-text{display:grid;gap:2px}.suite-brand-text strong{font-size:25px;letter-spacing:.08em;line-height:1.1}.suite-brand-text strong span{color:#eac46f}
 .suite-brand-text small{font-size:10px;letter-spacing:.16em;color:#b9cfe0;font-weight:700}.suite-brand-text em{font-style:normal;color:#f4d78c}
 .suite-system-status{margin-left:auto;color:#8ee0c2;font-size:11px;font-weight:800;letter-spacing:.12em;white-space:nowrap}
 .suite-user{border:1px solid #ffffff28;padding:10px 13px;border-radius:9px;font-size:12px;color:#d6e4f3;max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
 .suite-navbar{display:flex;align-items:stretch;overflow-x:auto;scrollbar-width:thin;background:#182e47;padding:0 20px;gap:2px}
 .suite-nav-button{display:flex;align-items:center;justify-content:center;flex-direction:column;gap:5px;min-width:91px;min-height:76px;border:0;border-radius:0;background:transparent;color:#b8cde1;font-size:11px;font-weight:700;padding:10px 13px;white-space:nowrap;border-bottom:3px solid transparent;transition:background .18s,color .18s}
 .suite-nav-button:hover{background:#ffffff12;color:#fff}.suite-nav-button[aria-pressed="true"]{background:#ffffff13;color:#fff;border-bottom-color:#e9c66f}
 .suite-nav-icon{font-size:23px;line-height:1;font-weight:700;color:#e4bb66}.suite-nav-button:focus-visible{outline:2px solid #f4d78c;outline-offset:-4px}
 .suite-shell{display:block;min-height:calc(100vh - 160px)}.suite-shell>aside{display:none}.suite-shell>main{max-width:1480px;padding:30px clamp(16px,3vw,46px) 60px}
 .suite-shell .top{margin-bottom:16px}.suite-shell .top h2{font-size:25px;color:#152a44}.suite-shell .top .tag{background:#e8f3fa;color:#24607e;border:1px solid #c6dbe9}
 .suite-shell .panel{border-radius:13px;box-shadow:0 4px 16px #102a4b0b}
 .suite-hero{position:relative;overflow:hidden;background:radial-gradient(circle at 90% 5%,#2c657a 0,transparent 43%),linear-gradient(125deg,#12253e,#163653);color:#fff;border-radius:22px;padding:clamp(30px,5vw,64px);margin:20px 0 24px;box-shadow:0 15px 40px #102a4b25}
 .suite-hero:after{content:'';position:absolute;right:3%;bottom:-65px;width:310px;height:310px;background:url('/powerbuild-logo.png') center/contain no-repeat;opacity:.10;pointer-events:none}
 .suite-eyebrow{color:#e4bf70;font-weight:800;letter-spacing:.19em;font-size:12px;margin-bottom:12px}
 .suite-hero-title{font-size:clamp(36px,5vw,66px);font-weight:900;letter-spacing:.03em;line-height:1.06;margin:0 0 13px;position:relative;z-index:1}
 .suite-hero-title span{color:#e9c66f}.suite-hero-subtitle{font-size:clamp(14px,1.5vw,19px);color:#c6d8e8;max-width:700px;margin:0 0 25px;position:relative;z-index:1}
 .suite-primary{background:#e5be65;color:#10263c;border-radius:10px;padding:13px 24px;box-shadow:0 5px 18px #0002}.suite-primary:hover{background:#f3d385}
 .suite-section-head{display:flex;justify-content:space-between;gap:12px;align-items:center;margin:24px 0 12px}.suite-section-head h3{margin:0;color:#172b43}.suite-section-head small{color:#62738b}
 .suite-card-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(225px,1fr));gap:15px}
 .suite-card{border:1px solid #dbe4ee;border-radius:15px;background:#fff;padding:22px;text-align:left;color:#1d2f46;display:flex;flex-direction:column;align-items:flex-start;gap:9px;min-height:170px;box-shadow:0 5px 20px #0f29400b;transition:transform .16s,box-shadow .16s}
 .suite-card:hover{transform:translateY(-2px);box-shadow:0 10px 24px #0f294018}.suite-card .suite-card-icon{font-size:27px;color:#b98b38}.suite-card strong{font-size:18px}.suite-card small{font-size:12px;color:#60718a;font-weight:500;white-space:normal;line-height:1.5}
 .suite-card .suite-card-status{margin-top:auto;font-size:10px;font-weight:900;letter-spacing:.1em;color:#8b6c31}
 .suite-card .suite-card-status.live{color:#12715b}
 .suite-sales-toolbar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:10px 0 18px;padding:12px;background:#fff;border:1px solid #dce5ed;border-radius:12px}
 .suite-sales-toolbar strong{margin-right:9px;color:#1b3a57;font-size:13px}.suite-sales-toolbar button{background:#edf3fa;color:#2c5679;padding:9px 12px;font-size:12px;border-radius:7px}.suite-sales-toolbar button.selected{background:#1b517c;color:#fff}
 .suite-menu-intro{margin:14px 0 20px;padding:18px 20px;border-radius:12px;background:#eaf2fa;border-left:4px solid #386a9b;color:#304d6c;font-size:14px}
 .suite-menu-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(290px,1fr));gap:16px}
 .suite-menu-card{background:#fff;border:1px solid #dce5ed;border-radius:14px;padding:20px;box-shadow:0 5px 18px #132b420a}
 .suite-menu-card h3{font-size:17px;color:#1a344f;border-bottom:1px solid #e5edf5;padding-bottom:12px;margin-bottom:7px}
 .suite-menu-list{display:grid;gap:2px}.suite-menu-action{background:transparent;color:#304a64;text-align:left;font-size:13px;font-weight:600;border-radius:7px;padding:10px 8px;display:flex;justify-content:space-between;gap:10px}
 .suite-menu-action:hover{background:#f0f5fa;color:#135e9e}.suite-menu-action:disabled{background:transparent;color:#8a99aa;cursor:not-allowed;opacity:.7}.suite-menu-action:disabled:after{content:'—';font-size:13px}.suite-menu-action:after{content:'›';font-size:19px;line-height:13px;color:#9aaabd}
 .suite-feature-detail[hidden]{display:none!important}
 .suite-feature-detail{background:#fff9e9;border:1px solid #f1dca6;border-radius:12px;padding:18px 20px;margin:20px 0;color:#6d531e}
 .suite-feature-detail strong{display:block;margin-bottom:5px}.suite-footnote{font-size:12px;color:#6b7c91;margin-top:18px}
 @media(max-width:900px){.suite-brandbar{flex-wrap:wrap}.suite-system-status{display:none}.suite-user{margin-left:auto}.suite-navbar{padding:0 8px}.suite-nav-button{min-width:78px;padding:9px 10px}.suite-shell>main{padding:22px 14px 45px}}
 @media(max-width:540px){.suite-brand-text strong{font-size:20px}.suite-brand-text small{font-size:8px}.suite-brand-logo{width:49px;height:49px;flex-basis:49px}.suite-user{max-width:100%;margin-left:0}.suite-brandbar{gap:9px}.suite-hero{padding:29px 23px}.suite-hero:after{width:220px;height:220px;bottom:-40px;right:-28px}}

 @media print{body{background:#fff}.shell{display:none!important}.suite-header{display:none!important}.print-sheet{display:block!important;color:#111;font:12pt Arial,sans-serif;padding:10mm}
 .print-sheet .print-logo{width:110px;height:auto;object-fit:contain}.print-sheet h1{font-size:21pt}.print-sheet p{margin:6px 0}
 .print-sheet .print-warning{font-weight:bold;border:2px solid #000;padding:9px}.print-sheet .quote-detail{border:0;background:none;padding:0}
 .print-sheet table{font-size:10pt;width:100%}.print-sheet th,.print-sheet td{border-bottom:1px solid #d9e0eb;padding:9px 5px;text-align:left}
 .print-sheet thead th{background:#102a4b!important;color:#fff!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}
 .print-sheet .tiny{font-size:9pt}.print-sheet .doc-paid{color:#106534!important}
 .dispatch-alert-overlay{display:none!important}
 @page{size:A4;margin:12mm}}

 @media(max-width:850px){.shell{grid-template-columns:1fr}aside{padding:15px 20px;display:flex;align-items:center;gap:14px}aside h1{margin:0;font-size:17px}aside .brand-logo{width:56px;height:56px;flex:0 0 56px}aside .nav,aside .foot,aside p{display:none}main{padding:23px 14px}.two{grid-template-columns:1fr}}
 </style></head><body class="${suiteShell?'maliks-professional':salesShell?'maliks-sales-workstation':''}">
 ${suiteShell?suiteHeader():''}
 <div class="shell ${suiteShell?'suite-shell':''}"><aside><img class="brand-logo" src="/powerbuild-logo.png" alt="PowerBuild logo" width="112" height="112"/><div><h1>${d.name}</h1><p>${d.subtitle}</p></div><div class="nav">${d.subtitle}</div><p class="foot">Restricted department workstation. All activity is associated with your approved Maliks account and assigned branch.</p></aside>
 <main><div class="top"><div><h2 id="screen-heading">${d.name}</h2><div class="muted" id="signed-in">Checking approved user access…</div></div><span class="tag" id="workstation-tag">${releaseLabel}</span></div>
 <div class="notice" id="workstation-notice">${d.hint}</div><div id="error" role="alert" hidden></div>
 <div class="panel" id="branch-panel"><div class="bar"><div><label for="branch">Assigned branch</label><select id="branch" disabled><option>Authorising…</option></select></div><div><label>Application access</label><p class="muted" id="access">Verification in progress…</p></div></div></div>
 <div id="app-content"></div>
 </main></div><script type="module">
 const APP=${JSON.stringify(app)};
 const MEMBER_TEAM_URL='https://maliks-member-team.moyanamoses006.workers.dev';
 let currentUserRole='';
 const SUITE_NAV=${JSON.stringify(SUITE_NAV)};
 const SUITE_MENU_TREE=${JSON.stringify(SUITE_MENU_TREE)};
 const SUITE_TITLES=${JSON.stringify(SUITE_TITLES)};
 const E=id=>document.getElementById(id);
 const h=(tag,text='',cls='')=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=String(text);if(cls)el.className=cls;return el;};
 const api=async (url,opts)=>{const r=await fetch(url,{credentials:'same-origin',cache:'no-store',...opts});let data;try{data=await r.json();}catch{const e=Error('The service returned a non-JSON response (HTTP '+r.status+'). Check the Core Worker, Phase 21 D1 migration and Cloudflare Access session.');e.status=r.status;throw e;}if(!r.ok){const e=Error(data.error||'Request failed (HTTP '+r.status+').');e.status=r.status;throw e;}return data;};
 const money=c=>new Intl.NumberFormat('en-ZA',{style:'currency',currency:'ZAR'}).format(c/100);
 const err=message=>{const e=E('error');e.hidden=!message;e.textContent=message||'';e.className='error';};
 const panel=title=>{const p=h('section',undefined,'panel');p.append(h('h3',title));return p;};
 const cell=(row,text,tag='td')=>row.append(h(tag,text));
 const showDate=value=>{if(!value)return '—';const d=new Date(value);return Number.isNaN(d.getTime())?value:new Intl.DateTimeFormat('en-ZA',{dateStyle:'medium',timeStyle:'short',timeZone:'Africa/Johannesburg'}).format(d);};
 const calcBasket=()=>{const total=basket.reduce((s,l)=>s+Math.round(l.product.price_cents*l.quantity),0);const vat=Math.round(total*15/115);return {total,vat,net:total-vat};};
 let branch='',basket=[],pendingQuote=null,recentQuotes=[],quoteRows=[],pendingShiftAction=null,pendingReviewAction=null,pendingTenderAction=null;
 let suiteView='home',currentUserEmail='';
 let suiteSalesDraft={customer:'',contact:'',notes:''};
 function selectBranch(){
   const incoming=E('branch').value;
   if(pendingQuote){E('branch').value=branch;err('Finish or release the pending quotation before changing branch.');return;}
   if(pendingReviewAction){E('branch').value=branch;err('Retry or resolve the pending Cash Office review before changing branch.');return;}
   if(pendingTenderAction){E('branch').value=branch;err('Resolve the pending tender preparation before changing branch.');return;}
   if(basket.length && !window.confirm('Changing branch will clear the quotation basket. Continue?')){E('branch').value=branch;return;}
   branch=incoming;basket=[];recentQuotes=[];quoteRows=[];suiteSalesDraft={customer:'',contact:'',notes:''};pendingShiftAction=null;pendingReviewAction=null;pendingTenderAction=null;draw();
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
     const confirm=E('confirmation');confirm.replaceChildren(h('p','Quotation '+data.quotation.number+' saved. NOT PAID — customer must pay at Tills.'));
     const slip=h('button','Print 80mm quotation slip','secondary small-btn');slip.type='button';
     slip.addEventListener('click',()=>void printQuote(data.quotation).catch(e=>err(e.message)));
     confirm.append(slip);
     pendingQuote=null;basket=[];
     E('customer').value='';E('contact').value='';E('notes').value='';suiteSalesDraft={customer:'',contact:'',notes:''};
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
   wrapper.append(h('p','Quotation details are not payment confirmation. Check the payment queue for the actual status.','tiny'));
   return wrapper;
 }
 // Phase 12: Compact Epson-compatible 80 mm thermal paper (72 mm printable content).
 // The printer driver must be configured for 80 mm rolls, Scale 100%, no headers/footers.
 function thermalDivider(sheet){sheet.append(h('div','--------------------------------','receipt-divider'));}
 function thermalPair(sheet,label,value,cls=''){
   const line=h('div',undefined,'receipt-pair'+(cls?' '+cls:''));
   line.append(h('span',label),h('strong',value));sheet.append(line);
 }
 function thermalHeader(sheet,title,reference,docBranch){
   const logo=h('img');logo.src='/powerbuild-logo.png';logo.alt='PowerBuild logo';logo.className='receipt-logo';sheet.append(logo);
   sheet.append(h('div','POWERBUILD','receipt-brand'),h('div',docBranch,'receipt-branch'));
   thermalDivider(sheet);
   sheet.append(h('div',title,'receipt-title'),h('div',reference,'receipt-reference'));
   thermalDivider(sheet);
 }
 function thermalItems(sheet,lines){
   for(const item of lines||[]){
     const block=h('div',undefined,'receipt-item');block.append(h('div',item.name,'receipt-item-name'));
     block.append(h('div',String(item.code||'')+' · '+String(item.unit||'each'),'receipt-item-code'));
     const q=h('div',undefined,'receipt-pair');
     q.append(h('span',String(item.quantity)+' × '+money(item.price_cents)),h('strong',money(item.line_total_cents)));
     block.append(q);sheet.append(block);
   }
 }
 function thermalTotals(sheet,row,paid){
   thermalDivider(sheet);
   thermalPair(sheet,'Subtotal (excl. VAT)',money(row.net_cents));
   thermalPair(sheet,'VAT included (15%)',money(row.vat_cents));
   thermalPair(sheet,paid?'TOTAL PAID':'QUOTE TOTAL',money(row.total_cents),'receipt-grand');
 }
 function thermalFooter(sheet,lines){
   thermalDivider(sheet);
   for(const line of lines)sheet.append(h('div',line,'receipt-foot'));
   sheet.append(h('div','Thank you for choosing PowerBuild','receipt-thanks'));
 }
 // Use a measured page length: CSS @page size:80mm auto is not valid in Chrome.
 // Add a narrow print rule only for THIS job. A4 documents keep their original layout.
 async function printThermalSheet(sheet){
   E('print-sheet')?.remove();E('thermal-print-style')?.remove();
   sheet.id='print-sheet';sheet.className='print-sheet thermal-sheet';
   const css=h('style');css.id='thermal-print-style';
   css.textContent=\`
   .thermal-sheet{width:72mm!important;min-width:72mm!important;max-width:72mm!important;padding:1mm 1mm 4mm!important;margin:0!important;background:white!important;color:black!important;font:10pt/1.32 Arial,sans-serif!important;letter-spacing:0!important;box-shadow:none!important;overflow:visible!important}
   .thermal-sheet *{box-sizing:border-box!important;color:black!important;background:transparent!important;text-align:left!important;overflow-wrap:anywhere!important}
   .thermal-sheet .receipt-logo{display:block!important;max-width:44mm!important;max-height:27mm!important;width:auto!important;height:auto!important;margin:0 auto 1mm!important;filter:grayscale(1) contrast(2.1)!important}
   .thermal-sheet .receipt-brand{text-align:center!important;font-size:13pt!important;font-weight:900!important;letter-spacing:.9px!important}
   .thermal-sheet .receipt-branch{text-align:center!important;font-size:10pt!important;font-weight:700!important}
   .thermal-sheet .receipt-title{text-align:center!important;font-weight:900!important;font-size:15pt!important;margin:1mm 0!important}
   .thermal-sheet .receipt-reference{text-align:center!important;font-size:11pt!important;font-weight:800!important}
   .thermal-sheet .receipt-divider{white-space:nowrap!important;overflow:hidden!important;font:10pt/1.2 monospace!important;letter-spacing:0!important;margin:2mm 0!important}
   .thermal-sheet .receipt-field{font-size:9pt!important;margin:1mm 0!important;white-space:normal!important}
   .thermal-sheet .receipt-item{border-bottom:1px dashed #666!important;padding:2mm 0!important;break-inside:avoid!important}
   .thermal-sheet .receipt-item-name{font-weight:800!important;font-size:10pt!important;line-height:1.35!important}
   .thermal-sheet .receipt-item-code{font-size:8pt!important;margin:.5mm 0!important}
   .thermal-sheet .receipt-pair{display:flex!important;justify-content:space-between!important;gap:2mm!important;align-items:baseline!important;margin:1mm 0!important;font-size:9.5pt!important}
   .thermal-sheet .receipt-pair span{flex:1 1 auto!important;min-width:0!important}
   .thermal-sheet .receipt-pair strong{flex:0 0 auto!important;white-space:nowrap!important;font-size:10pt!important}
   .thermal-sheet .receipt-grand{border-top:2px solid #000!important;border-bottom:2px solid #000!important;padding:2mm 0!important;margin:2mm 0!important;font-weight:900!important}
   .thermal-sheet .receipt-grand strong,.thermal-sheet .receipt-grand span{font-size:13pt!important;font-weight:900!important}
   .thermal-sheet .receipt-stamp{text-align:center!important;border:2px solid #000!important;font-size:15pt!important;font-weight:900!important;padding:2mm!important;margin:2mm 0!important}
   .thermal-sheet .receipt-foot{text-align:center!important;font-size:8pt!important;line-height:1.4!important;margin:1mm 0!important}
   .thermal-sheet .receipt-thanks{text-align:center!important;font-size:9pt!important;font-weight:800!important;margin:3mm 0 2mm!important}
   @media screen{#print-sheet.thermal-sheet{display:block!important;position:absolute!important;left:-20000px!important;top:0!important;visibility:visible!important}}
   @media print{body{margin:0!important;padding:0!important;background:#fff!important}.shell{display:none!important}#print-sheet.thermal-sheet{display:block!important;position:static!important;left:auto!important;top:auto!important;visibility:visible!important}}
   \`;
   document.head.append(css);document.body.append(sheet);
   try{
     await Promise.all(Array.from(sheet.querySelectorAll('img'),img=>img.decode().catch(()=>{})));
     // CSS pixels are defined as 96 per inch. Add headroom for driver rounding/cutter feed.
     const millimetres=Math.ceil(sheet.getBoundingClientRect().height*25.4/96+10);
     const length=Math.min(3000,Math.max(70,millimetres));
     css.textContent+='\\n@page{size:80mm '+length+'mm;margin:0}';
     window.addEventListener('afterprint',()=>{sheet.remove();css.remove();},{once:true});
     window.print();
   }catch(error){sheet.remove();css.remove();throw error;}
 }
 function printQuote(row){
   if(!row||row.branch!==branch||!Array.isArray(row.lines))throw Error('Only quotations for the selected branch can be printed.');
   const sheet=h('section');thermalHeader(sheet,'QUOTATION',row.number,row.branch);
   for(const value of ['Date: '+showDate(row.created_at),'Sales: '+(row.submitted_by_name||'—'),
     'Customer: '+row.customer_name,'Contact: '+(row.customer_contact||'—')])sheet.append(h('div',value,'receipt-field'));
   thermalDivider(sheet);thermalItems(sheet,row.lines);thermalTotals(sheet,row,false);
   sheet.append(h('div','NOT PAID — QUOTATION ONLY','receipt-stamp'));
   thermalFooter(sheet,['Present this quotation at Tills to make payment.','No goods may be collected using this quotation.']);
   return printThermalSheet(sheet);
 }
 function renderQuotes(target,list){
   const body=E(target);if(!body)return;body.replaceChildren();
   if(!list.length){const r=h('tr');const c=h('td','No quotations found.','empty');c.colSpan=6;r.append(c);body.append(r);return;}
   for(const row of list){
     const r=h('tr');for(const val of [row.number,row.customer_name,row.status,showDate(row.created_at),money(row.total_cents)])cell(r,val);
     const td=h('td',undefined,'row-actions');const view=h('button','Details','secondary small-btn');view.type='button';
     view.setAttribute('aria-expanded','false');
     const print=h('button','Print 80mm quote','secondary small-btn');print.type='button';print.addEventListener('click',()=>void printQuote(row).catch(e=>err(e.message)));
     td.append(view,print);r.append(td);body.append(r);
     const detailRow=h('tr');detailRow.hidden=true;const c=h('td');c.colSpan=6;c.append(quoteDetails(row));detailRow.append(c);body.append(detailRow);
     view.addEventListener('click',()=>{detailRow.hidden=!detailRow.hidden;view.setAttribute('aria-expanded',String(!detailRow.hidden));view.textContent=detailRow.hidden?'Details':'Hide';});
   }
 }
 function posView(){
   const root=E('app-content');
   if(APP==='sales'){
     const tools=h('div',undefined,'suite-sales-toolbar');tools.append(h('strong','Sales · Transactions'));
     const live=h('button','Quotations · LIVE','selected');live.type='button';tools.append(live);
     for(const item of ['Sales Orders','Reprint Documents','Reporting']){
       const b=h('button',item);b.type='button';b.addEventListener('click',()=>{
         const existing=E('suite-sales-preview');if(existing)existing.remove();
         const note=h('div',item+' is included in the Sales menu inventory, but is not connected to a live workflow yet. Quotation creation below remains available.','suite-menu-intro');note.id='suite-sales-preview';tools.after(note);
       });tools.append(b);
     }
     root.append(tools);
   }
   const two=h('div',undefined,'two');const lookup=panel('Product catalogue');
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
     const l=h('label',label);l.htmlFor=id;const inp=h('input');inp.id=id;inp.placeholder=placeholder;inp.maxLength=id==='notes'?400:id==='customer'?120:80;
     if(APP==='sales'){inp.value=suiteSalesDraft[id]||'';inp.addEventListener('input',()=>{suiteSalesDraft[id]=inp.value;});}
     checkout.append(l,inp);
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
     if(!/^(?:0|[1-9]\\d{0,8})(?:\\.\\d{1,2})?$/.test(text)){
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
   const typed=field.value.trim().toUpperCase();output.replaceChildren();
   // Normalise pasted, lowercase, or unhyphenated numbers before lookup.
   const digits=/^(?:Q-?)?(\\d{1,12})$/.exec(typed);
   const id=digits?Number(digits[1]):0;
   if(!Number.isSafeInteger(id)||id<=0){output.append(h('div','Enter a valid quotation number (e.g. Q-00000001, Q00000001 or 1).','error'));return;}
   const number='Q-'+String(id).padStart(8,'0');
   field.value=number;
   const selected=branch;output.append(h('p','Looking up '+number+'…','muted'));
   try{
     const data=await api('/api/quotes/find?branch='+encodeURIComponent(selected)+'&number='+encodeURIComponent(number));
     if(selected!==branch)return;output.replaceChildren();const row=data.quotation;
     output.append(h('h3','Quotation '+row.number),quoteDetails(row));
     const print=h('button','Print 80mm quotation','secondary small-btn');print.addEventListener('click',()=>void printQuote(row).catch(e=>err(e.message)));output.append(print);
     if(APP==='tills'){output.append(paymentCapturePanel(row));const legacy=h('details');legacy.append(h('summary','Old tender-preparation training tools (not payment)'));legacy.append(tenderPreview(row),tenderPreparationPanel(row));output.append(legacy);}
   }catch(error){if(selected!==branch)return;output.replaceChildren(h('div',error.message,'error'));}
 }

 // Tender allocations are non-financial preparation records, NOT payment capture.
 function tenderPreparationPanel(quote){
   const section=h('section',undefined,'tender-prep');section.append(h('h3','Prepare tender allocation — NOT PAYMENT'));
   section.append(h('p','This will save a draft allocation only. It does not receive money, verify a card/EFT, mark the quote paid, issue an invoice or release dispatch. Do not use as proof of payment.','training-warning'));
   section.append(h('p','Quotation: '+quote.number+' · Amount to allocate: '+money(quote.total_cents),'price'));
   const status=h('div','Checking your open till shift…','muted');section.append(status);
   const wrapper=h('div',undefined,'tender-rows');wrapper.hidden=true;
   const entries={};
   for(const [key,label,place] of [
     ['card','Card portion (R)','0.00'],['cardref','Terminal approval reference (not card number)','Required if card > 0'],
     ['eft','EFT portion (R)','0.00'],['eftref','EFT reference (not bank details)','Required if EFT > 0'],
     ['cashreceived','Cash amount for change preview (R)','0.00']]){
     const div=h('div');const l=h('label',label);const input=h('input');input.placeholder=place;input.maxLength=key.endsWith('ref')?60:14;
     input.type='text';input.autocomplete='off';if(!key.endsWith('ref'))input.inputMode='decimal';
     l.append(input);div.append(l);wrapper.append(div);entries[key]=input;
   }
   section.append(wrapper);
   const breakdown=h('p','Cash portion: — · Change: —','detail-total');section.append(breakdown);
   const feedback=h('div');feedback.setAttribute('aria-live','polite');section.append(feedback);
   const btn=h('button','Save preparation only — no payment','widebutton');btn.disabled=true;section.append(btn);
   let shift=null,selectedBranch=branch;
   const recompute=()=>{
     try{
       const card=randToCents(entries.card.value.trim()||'0');
       const eft=randToCents(entries.eft.value.trim()||'0');
       const cash=quote.total_cents-card-eft;
       if(cash<0)throw Error('Card + EFT exceeds the quotation.');
       const received=randToCents(entries.cashreceived.value.trim()||'0');
       if(received<cash)throw Error('Cash preview is less than cash portion.');
       if(!cash&&received)throw Error('Cash preview must be zero if cash portion is zero.');
       breakdown.textContent='Cash portion: '+money(cash)+' · Change preview: '+money(received-cash);
       btn.disabled=!shift;
       return {cash,received,card,eft};
     }catch(error){breakdown.textContent=error.message;btn.disabled=true;return null;}
   };
   for(const input of Object.values(entries))input.addEventListener('input',recompute);
   btn.addEventListener('click',async()=>{
     feedback.replaceChildren();const amounts=recompute();if(!shift||!amounts)return;
     const proposed={request_id:pendingTenderAction?.request_id||crypto.randomUUID(),branch:selectedBranch,shift_id:shift.id,
       quotation_number:quote.number,cash_applied_cents:amounts.cash,cash_received_cents:amounts.received,
       card_cents:amounts.card,card_reference:entries.cardref.value.trim(),
       eft_cents:amounts.eft,eft_reference:entries.eftref.value.trim()};
     if(pendingTenderAction && JSON.stringify(pendingTenderAction)!==JSON.stringify(proposed)){feedback.append(h('p','A save may have succeeded. Restore the same values to retry, or check preparation history.','error'));return;}
     if(!window.confirm('Save an immutable tender PREPARATION? This does not record any payment and cannot be edited.'))return;
     pendingTenderAction=proposed;btn.disabled=true;
     try{
       const response=await api('/api/tender-preparations',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(proposed)});
       pendingTenderAction=null;
       status.replaceChildren(h('p','Preparation #'+response.preparation.id+' saved. NOT PAID — NO INVOICE — NO DISPATCH.','success'));
       wrapper.hidden=true;btn.remove();breakdown.remove();await loadPreparations();
     }catch(error){feedback.append(h('p',error.message+' Retry only with unchanged values and request ID, or refresh the preparation list.','error'));btn.disabled=false;}
   });
   (async()=>{
     try{
       const data=await api('/api/till-shifts?branch='+encodeURIComponent(selectedBranch));
       if(selectedBranch!==branch||!section.isConnected)return;
       shift=(data.shifts||[]).find(x=>x.status==='OPEN')||null;
       if(!shift){status.textContent='You must open your own till shift before saving a preparation.';return;}
       status.textContent='Open shift #'+shift.id+' · '+shift.till_code;
       wrapper.hidden=false;
       const defaultCash=(quote.total_cents/100).toFixed(2);entries.cashreceived.value=defaultCash;
       recompute();
     }catch(error){status.textContent='Could not check open till shift: '+error.message;}
   })();
   return section;
 }
 async function loadPreparations(){
   const target=E('tender-preparations');if(!target)return;
   const b=branch;target.replaceChildren(h('p','Loading saved tender preparations…','muted'));
   try{
     const data=await api('/api/tender-preparations?branch='+encodeURIComponent(b));
     if(branch!==b)return;
     const rows=data.preparations||[];target.replaceChildren();
     if(!rows.length){target.append(h('p','No tender preparations saved for this branch.','muted'));return;}
     const table=h('table'),head=h('thead'),hr=h('tr');
     for(const name of ['Quotation','Cash applied','Card','EFT','Change','Prepared by','Status','Time'])cell(hr,name,'th');
     head.append(hr);table.append(head);const tbody=h('tbody');
     for(const row of rows){const r=h('tr');for(const value of [row.number,money(row.cash_applied_cents),money(row.card_cents),money(row.eft_cents),money(row.change_cents),row.prepared_by_name,'NOT PAID — preparation',showDate(row.created_at)])cell(r,value);tbody.append(r);}
     table.append(tbody);const outer=h('div',undefined,'scroll');outer.append(table);target.append(outer);
   }catch(error){if(branch===b)target.replaceChildren(h('p','Preparation queue unavailable: '+error.message,'error'));}
 }
 // Phase 7: read-only cash-up ESTIMATE. No money is posted by this feature.
 function cashupView(){
   const p=panel('Provisional cash-up & exceptions — NOT RECONCILED');
   p.append(h('p','Training/control worksheet only. The projected cash is opening float PLUS CASH ALLOCATED IN UNVERIFIED TENDER PREPARATIONS, not actual verified takings. Zero difference is NOT proof of a balanced till. Do not bank, invoice or dispatch based on this screen.','cashup-warning'));
   const row=h('div',undefined,'bar');const refresh=h('button','Refresh provisional worksheet','secondary');refresh.type='button';refresh.addEventListener('click',loadCashupPreviews);row.append(refresh);p.append(row);
   const summary=h('div');summary.id='cashup-stats';summary.className='cashup-stats';p.append(summary);
   const target=h('div','Loading provisional cash-up estimates…');target.id='cashup-preview';p.append(target);
   p.append(h('p','Each row covers one cashier shift in the selected branch. A follow-up flag or declaration review remains available in the independent Shift Review panel above. No row is marked reconciled or approved.','tiny'));
   return p;
 }
 async function loadCashupPreviews(){
   const target=E('cashup-preview'),summary=E('cashup-stats');if(!target||!summary)return;
   const selected=branch;target.replaceChildren(h('p','Loading provisional worksheet…','muted'));summary.replaceChildren();
   try{
     const data=await api('/api/cashup-preview?branch='+encodeURIComponent(selected));
     if(branch!==selected)return;
     if(data.verified!==false||data.reconciled!==false||data.mode!=='PROVISIONAL_PREPARATIONS_ONLY')throw Error('Unexpected cash-up state.');
     const rows=data.projections||[];target.replaceChildren();
     if(!rows.length){target.append(h('p','No cashier shifts recorded for this branch.','muted'));return;}
     const closed=rows.filter(r=>r.status==='CLOSED').length;
     const flagged=rows.filter(r=>r.signal==='PROVISIONAL_DIFFERENCE').length;
     const lacking=rows.filter(r=>r.signal==='NO_PREPARATIONS').length;
     for(const label of ['Shifts: '+rows.length,'Closed: '+closed,'Provisional differences: '+flagged,'No preparations: '+lacking])summary.append(h('span',label));
     const t=h('table');t.className='cashup-table';const thead=h('thead'),tr=h('tr');
     for(const title of ['Shift / till','Cashier','Status','Opening float','Prepared quotations','Prepared cash (net)','Prepared card','Prepared EFT','Projected cash*','Declared closing count','Difference*','Review attention'])cell(tr,title,'th');
     thead.append(tr);t.append(thead);
     const body=h('tbody');for(const r of rows){
       const line=h('tr');const status=r.signal==='SHIFT_OPEN'?'Shift open':r.signal==='NO_PREPARATIONS'?'No preparations':r.signal==='PROVISIONAL_ZERO_DIFFERENCE'?'Provisional zero difference':'Provisional difference';
       const difference=r.provisional_variance_cents;
       for(const val of ['#'+r.shift_id+' / '+r.till_code,r.opened_by_name,r.status,money(r.opening_float_cents),String(r.preparation_count),money(r.prepared_cash_cents),money(r.prepared_card_cents),money(r.prepared_eft_cents),r.projected_cash_cents===null?'—':money(r.projected_cash_cents),r.counted_cash_cents===null?'—':money(r.counted_cash_cents),difference===null?'—':money(difference),status])cell(line,val);
       const cells=line.querySelectorAll('td');if(difference!==null)cells[10].className=difference===0?'cashup-zero':'cashup-diff';
       body.append(line);
     }t.append(body);const scroll=h('div',undefined,'scroll');scroll.append(t);target.append(scroll);
     target.append(h('p','* Provisional projected cash = opening float + cash applied in saved preparations. Difference = cashier-declared closing count minus projected cash. Card/EFT amounts are also UNVERIFIED. These totals are not financial balances.','tiny'));
   }catch(error){if(branch===selected)target.replaceChildren(h('p','Provisional worksheet unavailable: '+error.message,'error'));}
 }
 // Phase 8: independent Cash Office observations of card/bank documents only.
 // These records are NOT actual receipts, processor confirmations, paid orders,
 // financial journal entries or instructions to dispatch.
 function evidenceView(){
   const p=panel('Payment evidence & exceptions — NOT SETTLED');
   p.append(h('p','MANUAL DOCUMENT REVIEW ONLY. Card-terminal and EFT statement checks are observations, not verified receipts, settlement, a bank reconciliation or payment posting. Never release goods or issue a paid invoice from this screen.','cashup-warning'));
   const row=h('div',undefined,'bar');const refresh=h('button','Refresh evidence queue','secondary');refresh.addEventListener('click',loadEvidence);row.append(refresh);p.append(row);
   const list=h('div','Loading evidence queue…');list.id='evidence-register';p.append(list);
   const detail=h('div');detail.id='evidence-detail';p.append(detail);
   p.append(h('p','Each record is an append-only observation by Cash Office. The cashier who prepared the allocation cannot review it. A new observation does not erase earlier entries.','tiny'));
   return p;
 }
 async function loadEvidence(){
   const target=E('evidence-register'),detail=E('evidence-detail');if(!target)return;
   const b=branch;target.replaceChildren(h('p','Loading document observations…','muted'));detail?.replaceChildren();
   try{
     const data=await api('/api/payment-evidence?branch='+encodeURIComponent(b));
     if(branch!==b)return;
     if(data.mode!=='MANUAL_EVIDENCE_OBSERVATIONS_ONLY'||data.paid!==false||data.bank_verified!==false)throw Error('Unsafe payment evidence response.');
     const rows=data.observations||[];target.replaceChildren();
     if(!rows.length){target.append(h('p','No card/EFT tender preparations for this branch yet.','muted'));return;}
     const t=h('table');t.className='evidence-table';const th=h('thead'),hr=h('tr');
     for(const text of ['Quotation','Type','Prepared amount','Observed amount','Latest observation','Reviewed by','Time','Action'])cell(hr,text,'th');th.append(hr);t.append(th);
     const tbody=h('tbody');for(const r of rows){
       const tr=h('tr');const state=r.decision==='DOCUMENT_CHECKED'?'Document checked — NOT PAID':r.decision==='FOLLOW_UP_REQUIRED'?'Follow-up required':'Not reviewed';
       for(const value of [r.number,r.method,money(r.expected_amount_cents),r.observed_amount_cents===null?'—':money(r.observed_amount_cents),state,r.reviewed_by_name||'—',showDate(r.observed_at)])cell(tr,value);
       const action=h('td');const btn=h('button','Review / history','secondary small-btn');btn.type='button';btn.addEventListener('click',()=>openEvidenceForm(r));action.append(btn);tr.append(action);tbody.append(tr);
     }t.append(tbody);const sc=h('div',undefined,'scroll');sc.append(t);target.append(sc);
     target.append(h('p','Document checked ≠ bank confirmed, payment recorded or dispatch authorised. Recorded amounts are manually entered and cannot be treated as financial balances.','tiny'));
   }catch(e){if(branch===b)target.replaceChildren(h('p','Evidence register unavailable: '+e.message,'error'));}
 }
 async function openEvidenceForm(row){
   if(APP!=='cashoffice')return;
   const target=E('evidence-detail');if(!target)return;
   target.replaceChildren();const b=branch;
   const section=h('section',undefined,'evidence-form');section.append(h('h3',row.method+' evidence — '+row.number));
   section.append(h('p','Tender preparation #'+row.preparation_id+' · Prepared amount '+money(row.expected_amount_cents)+' · Prepared by '+row.prepared_by_name,'muted'));
   section.append(h('p','This form stores an independent observation only. It does not record money received, verify settlement or change quotation status.','training-warning'));
   const group=h('div',undefined,'bar');
   const choose=(caption,choices)=>{const wrap=h('div'),label=h('label',caption),select=h('select');label.append(select);for(const [value,text] of choices){const opt=h('option',text);opt.value=value;select.append(opt);}wrap.append(label);group.append(wrap);return select;};
   const decision=choose('Observation',[['DOCUMENT_CHECKED','Document checked (NOT PAID)'],['FOLLOW_UP_REQUIRED','Flag for follow-up']]);
   const allowed=row.method==='CARD'?[["TERMINAL_REPORT","Card-terminal settlement report"],["NOT_AVAILABLE","Not available"]]:[["BANK_STATEMENT","Bank statement"],["NOT_AVAILABLE","Not available"]];
   const source=choose('Source document',allowed);
   const input=(labelText,placeholder,max)=>{const wrap=h('div'),label=h('label',labelText),input=h('input');input.type='text';input.autocomplete='off';input.placeholder=placeholder;input.maxLength=max;label.append(input);wrap.append(label);group.append(wrap);return input;};
   const observed=input('Amount appearing on document (R)','0.00',14);observed.inputMode='decimal';observed.value=(row.expected_amount_cents/100).toFixed(2);
   const reference=input('Document reference (not account/card number)','Bank or terminal evidence ID',80);
   section.append(group);
   const l=h('label','Explanation / discrepancy details (10–400 characters)'),note=h('textarea');note.maxLength=400;note.placeholder='Identify the source document and any discrepancy. Do not enter card numbers or bank account details.';l.append(note);section.append(l);
   const submit=h('button','Record observation — no payment posting');submit.type='button';section.append(submit);
   const feedback=h('div');feedback.setAttribute('aria-live','polite');section.append(feedback);
   let pending=null;
   submit.addEventListener('click',async()=>{
     feedback.replaceChildren();let cents;
     try{cents=randToCents(observed.value.trim());}catch(e){feedback.append(h('p',e.message,'error'));return;}
     if(decision.value==='DOCUMENT_CHECKED'&&cents!==row.expected_amount_cents){feedback.append(h('p','Amounts differ: choose Flag for follow-up.','error'));return;}
     const payload={branch:b,preparation_id:row.preparation_id,method:row.method,decision:decision.value,
       source:source.value,source_reference:reference.value.trim(),observed_amount_cents:cents,note:note.value.trim()};
     if(pending&&JSON.stringify(payload)!==JSON.stringify(pending.payload)){
       feedback.append(h('p','A prior request may have saved. Retry the same values or refresh the evidence queue before changing them.','error'));return;
     }
     if(!window.confirm('Save an immutable DOCUMENT OBSERVATION? This does NOT verify payment or authorise dispatch.'))return;
     const request_id=pending?.request_id||crypto.randomUUID();pending={request_id,payload};submit.disabled=true;
     try{
       const data=await api('/api/payment-evidence',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({...payload,request_id})});
       if(data.paid!==false||data.bank_verified!==false)throw Error('Unexpected settlement response.');
       if(branch!==b)return;pending=null;
       feedback.append(h('p','Observation recorded. NOT PAID — no invoice or dispatch release.','success'));
       submit.disabled=true;await loadEvidence();
       const current=E('evidence-detail');if(current)current.replaceChildren(h('p','Observation saved. Reopen the row to see its audit history.','success'));
     }catch(e){if(branch===b){feedback.append(h('p',e.message+' Retry unchanged values, or check the history first.','error'));submit.disabled=false;}}
   });
   const history=h('div',undefined,'evidence-history');history.append(h('h3','Audit history'),h('p','Loading…','muted'));section.append(history);target.append(section);
   try{
     const data=await api('/api/payment-evidence/history?branch='+encodeURIComponent(b)+'&preparation_id='+row.preparation_id+'&method='+encodeURIComponent(row.method));
     if(branch!==b||!target.contains(section))return;
     history.replaceChildren(h('h3','Audit history'));
     if(!data.observations?.length){history.append(h('p','No prior observations.','muted'));return;}
     const table=h('table'),head=h('thead'),hr=h('tr');for(const title of ['Date','Outcome','Document','Observed amount','Reviewer','Note'])cell(hr,title,'th');head.append(hr);table.append(head);
     const body=h('tbody');for(const item of data.observations){const tr=h('tr');for(const val of [showDate(item.created_at),item.decision,item.source+' / '+item.source_reference,money(item.observed_amount_cents),item.reviewed_by_name,item.note])cell(tr,val);body.append(tr);}table.append(body);const sc=h('div',undefined,'scroll');sc.append(table);history.append(sc);
   }catch(e){if(target.contains(section))history.replaceChildren(h('p','Audit history unavailable: '+e.message,'error'));}
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
   if(APP==='cashoffice'){
     const review=h('td',t.review_status==='CHECKED_DECLARATION'?'Declaration checked':
        t.review_status==='FLAGGED_FOR_FOLLOWUP'?'Flagged for follow-up':
        t.review_status==='PENDING_REVIEW'?'Not reviewed':'Awaiting close',
        t.review_status==='FLAGGED_FOR_FOLLOWUP'?'review-flag':t.review_status==='CHECKED_DECLARATION'?'review-check':'review-pending');tr.append(review);
     const action=h('td');if(t.status==='CLOSED'){
       const btn=h('button','Review','secondary small-btn');btn.type='button';btn.addEventListener('click',()=>void openReviewPanel(t));action.append(btn);
     }else action.textContent='—';tr.append(action);
   }
   return tr;
 }
 async function openReviewPanel(shift){
   if(APP!=='cashoffice'||shift.status!=='CLOSED')return;
   const target=E('shift-review-panel');if(!target)return;target.replaceChildren();
   const section=h('section',undefined,'review-box');section.append(h('h3','Independent review — Shift #'+shift.id));
   section.append(h('p','Till '+shift.till_code+' · Opened by '+shift.opened_by_name+' · Opening float '+money(shift.opening_float_cents)+' · Declared closing count '+money(shift.counted_cash_cents),'muted'));
   section.append(h('p','These are declared cash amounts. This review does not confirm payments, sales, a balanced cash-up or a deposit.','training-warning'));
   const decisionLabel=h('label','Review outcome');const decision=h('select');decision.id='review-decision';
   for(const [value,label] of [['CHECKED_DECLARATION','Declaration checked (not reconciled)'],['FLAGGED_FOR_FOLLOWUP','Flag for follow-up']]){
     const opt=h('option',label);opt.value=value;decision.append(opt);
   }
   decisionLabel.htmlFor='review-decision';section.append(decisionLabel,decision);
   const noteLabel=h('label','Review note / follow-up reason');noteLabel.htmlFor='review-note';section.append(noteLabel);
   const note=h('textarea');note.id='review-note';note.maxLength=400;note.placeholder='For a flag, explain the issue in at least 10 characters.';section.append(note);
   const button=h('button','Record review (audit history)');button.type='button';section.append(button);
   const feedback=h('div');feedback.setAttribute('aria-live','polite');section.append(feedback);
   button.addEventListener('click',async()=>{
     err('');feedback.replaceChildren();
     const chosen=decision.value,reason=note.value.trim();
     if(chosen==='FLAGGED_FOR_FOLLOWUP'&&reason.length<10){feedback.append(h('p','A follow-up flag requires at least 10 characters.','error'));return;}
     if(pendingReviewAction && (pendingReviewAction.shift_id!==shift.id || pendingReviewAction.decision!==chosen || pendingReviewAction.note!==reason)){
       feedback.append(h('p','An earlier review attempt may have succeeded. Retry with the same values before changing this form.','error'));return;
     }
     const body=pendingReviewAction||{request_id:crypto.randomUUID(),branch,shift_id:shift.id,decision:chosen,note:reason};
     pendingReviewAction=body;button.disabled=true;
     try{
       await api('/api/till-reviews',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
       pendingReviewAction=null;await loadShifts();
       const output=E('shift-review-panel');if(output)output.replaceChildren(h('p','Review recorded in immutable history. Reopen the shift to see its audit trail.','success'));
     }catch(e){feedback.append(h('p',e.message,'error'));button.disabled=false;}
   });
   const history=h('div');history.append(h('h3','Review history'));history.append(h('p','Loading review history…','muted'));section.append(history);
   target.append(section);
   try{
     const selected=branch;
     const data=await api('/api/till-reviews?branch='+encodeURIComponent(selected)+'&shift_id='+shift.id);
     if(branch!==selected||!target.contains(section))return;
     history.replaceChildren(h('h3','Review history'));
     if(!data.reviews?.length){history.append(h('p','No review records for this shift.','muted'));return;}
     const table=h('table'),head=h('thead'),hr=h('tr');for(const text of ['Date','Review','Reviewer','Note'])cell(hr,text,'th');head.append(hr);table.append(head);
     const rows=h('tbody');for(const item of data.reviews){const tr=h('tr');for(const text of [showDate(item.created_at),item.decision==='CHECKED_DECLARATION'?'Declaration checked':'Flagged for follow-up',item.reviewed_by_name,item.note||'—'])cell(tr,text);rows.append(tr);}table.append(rows);history.append(table);
   }catch(error){if(target.contains(section))history.replaceChildren(h('p','Could not load review history: '+error.message,'error'));}
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
     }else form.append(h('p','Cash Office view is read-only for cashier shifts. Open / close must be performed by the signed-in cashier in Maliks Tills. Closed shift declarations may be reviewed here without changing the count.','muted'));
     container.replaceChildren();
     if(!rows.length){container.append(h('div','No till shifts recorded for this branch.','empty'));return;}
     if(APP==='cashoffice'){
       const closed=rows.filter(row=>row.status==='CLOSED');const flags=closed.filter(row=>row.review_status==='FLAGGED_FOR_FOLLOWUP').length;
       const pending=closed.filter(row=>row.review_status==='PENDING_REVIEW').length;
       const stats=h('div',undefined,'review-stats');for(const summary of [closed.length+' closed shifts',pending+' awaiting review',flags+' flagged for follow-up'])stats.append(h('span',summary));container.append(stats);
     }
     const table=h('table');const head=h('thead');const tr=h('tr');for(const col of ['Shift','Till','Status','Opened by','Opened at','Opening float','Closing count','Closed at',...(APP==='cashoffice'?['Review status','Action']:[])])cell(tr,col,'th');head.append(tr);table.append(head);
     const tb=h('tbody');for(const row of rows)tb.append(shiftRow(row));table.append(tb);const sc=h('div',undefined,'scroll');sc.append(table);container.append(sc);
   }catch(error){if(branch!==selected)return;container.replaceChildren(h('p','Could not load shifts: '+error.message,'error'));}
 }
 function tillShiftView(){
   const p=panel(APP==='tills'?'My Till Shift Register':'Cash Office — Shift Review & Exceptions');
   p.append(h('p',APP==='tills'?'Open your till shift before checkout. Closing cash count is your declaration; Cash Office handles reconciliation.':'OPEN/CLOSE REGISTER ONLY. Opening float and closing count are employee declarations, not reconciled takings. No sales, deposits, invoices or stock balances are posted.','training-warning'));
   const current=h('div');current.id='shift-current';p.append(current);
   const bar=h('div',undefined,'bar');const refresh=h('button','Refresh shift register','secondary');refresh.addEventListener('click',loadShifts);bar.append(refresh);p.append(bar);
   const history=h('div','Loading shifts…');history.id='shift-history';p.append(history);
   if(APP==='cashoffice'){const panel=h('div');panel.id='shift-review-panel';p.append(panel);}
   const note=h('p',APP==='tills'?'Only your own shifts for the selected branch are visible. One cashier and one till may each have only one open shift.':'The selected branch’s latest 75 shifts are shown. Reviews are append-only observations, never payment or cash-up approvals.','tiny');p.append(note);
   return p;
 }

 async function quoteView(){
   const root=E('app-content');
   if(APP==='cashoffice'){root.append(paymentQueuePanel());void loadPaymentQueue();root.append(tillShiftView());void loadShifts();}
   if(APP==='cashoffice'){root.append(cashupView());void loadCashupPreviews();root.append(evidenceView());void loadEvidence();}
   if(APP==='cashoffice'){const preps=panel('Cash Office — Tender preparations (read-only)');preps.append(h('p','These are proposed cash/card/EFT splits, not verified receipts, tax invoices or approved payments. No stock or dispatch release.','training-warning'));const refresh=h('button','Refresh preparations','secondary');refresh.addEventListener('click',loadPreparations);preps.append(refresh);const list=h('div');list.id='tender-preparations';preps.append(list);root.append(preps);void loadPreparations();}
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
   if(APP==='tills'){root.append(tillShiftView());void loadShifts();root.append(paymentQueuePanel());void loadPaymentQueue();const old=h('details');old.append(h('summary','Old preparation history (not payment)'));const preps=panel('My tender preparations — NOT PAID');preps.append(h('p','These are proposed cash/card/EFT splits, not verified receipts, tax invoices or approved payments. No stock or dispatch release.','training-warning'));const refresh=h('button','Refresh preparations','secondary');refresh.addEventListener('click',loadPreparations);preps.append(refresh);const list=h('div');list.id='tender-preparations';preps.append(list);old.append(preps);root.append(old);void loadPreparations();}
   const queue=panel(APP==='tills'?'Recent quotations':'Cash Office — submitted quotations');
   const bar=h('div',undefined,'bar');const field=h('div');const label=h('label','Filter by quote number, customer or contact');label.htmlFor='quote-filter';const search=h('input');search.id='quote-filter';search.placeholder='Search the 50 most recent quotations';
   search.addEventListener('input',()=>{const q=search.value.trim().toLowerCase();renderQuotes('quotes',quoteRows.filter(x=>[x.number,x.customer_name,x.customer_contact,x.status].some(v=>String(v||'').toLowerCase().includes(q))));});
   field.append(label,search);const refresh=h('button','Refresh quotations','secondary');refresh.addEventListener('click',loadQuotes);bar.append(field,refresh);queue.append(bar);
   queue.append(makeQuoteTable('quotes'));
   queue.append(h('p','Quotation records alone are not payment evidence. Check the payment verification queue for confirmed internal invoices and Dispatch release.','tiny'));root.append(queue);await loadQuotes();
 }
 async function loadQuotes(){
   err('');const body=E('quotes');if(!body)return;const selected=branch;quoteRows=[];renderQuotes('quotes',[]);
   try{const data=await api('/api/quotes?branch='+encodeURIComponent(selected));if(selected!==branch)return;quoteRows=data.quotes||[];
     const q=E('quote-filter')?.value.trim().toLowerCase()||'';renderQuotes('quotes',quoteRows.filter(x=>[x.number,x.customer_name,x.customer_contact,x.status].some(v=>String(v||'').toLowerCase().includes(q))));}
   catch(e){if(selected!==branch)return;err(e.message);renderQuotes('quotes',[]);}
 }
 // Phase 10: cashier-attested CASH/CARD checkout for immediate internal invoice and Dispatch queue.
 // EFT and earlier split tenders still use the independent verification path.
 // Cashier-operated Cash/Card checkout: method + amount + single confirm.
 // Cashier must actually receive cash or see the terminal's APPROVED message.
 // No bank/terminal integration; a cashier attestation is recorded for Cash Office audit.
 function paymentCapturePanel(quote){
   const p=panel('Payment — send straight to Dispatch');
   p.append(h('p','Confirm only after you have counted the cash or seen APPROVED on the card terminal. Your name and till shift are recorded.','notice'));
   p.append(h('p','Quotation '+quote.number+' · Total '+money(quote.total_cents),'price'));
   const row=h('div',undefined,'tender-rows');
   const methodWrap=h('div'),methodLabel=h('label','Paid by'),method=h('select');
   for(const [value,label] of [['CASH','Cash'],['CARD','Card']]){const option=h('option',label);option.value=value;method.append(option);}
   methodLabel.append(method);methodWrap.append(methodLabel);row.append(methodWrap);
   const amountWrap=h('div'),amountLabel=h('label','Amount received (R)'),amount=h('input');
   amount.type='text';amount.inputMode='decimal';amount.autocomplete='off';amount.maxLength=14;
   amount.value=(quote.total_cents/100).toFixed(2);amountLabel.append(amount);amountWrap.append(amountLabel);row.append(amountWrap);p.append(row);
   const estimate=h('p','','detail-total');p.append(estimate);
   const status=h('p','Checking your open till shift…','muted');p.append(status);
   const feedback=h('div');feedback.setAttribute('aria-live','polite');p.append(feedback);
   const submit=h('button','Confirm Paid & Send to Dispatch','widebutton');submit.disabled=true;p.append(submit);
   let shift=null,pending=null,selectedBranch=branch,completed=false;
   const compute=()=>{
     try{
       const paid=randToCents(amount.value.trim());
       if(method.value==='CARD'&&paid!==quote.total_cents)throw Error('Card amount must match the quotation total.');
       if(method.value==='CASH'&&paid<quote.total_cents)throw Error('Cash is short by '+money(quote.total_cents-paid));
       if(paid>1_000_000_000||paid-quote.total_cents>100_000_000)throw Error('Amount exceeds permitted limit.');
       estimate.textContent=method.value==='CASH'?'Change to return: '+money(paid-quote.total_cents):'Card payment: '+money(paid);
       submit.disabled=!shift||completed;
       return paid;
     }catch(e){estimate.textContent=e.message;submit.disabled=true;return null;}
   };
   method.addEventListener('change',()=>{if(!pending){amount.value=(quote.total_cents/100).toFixed(2);compute();}});
   amount.addEventListener('input',()=>{if(!pending)compute();});
   submit.addEventListener('click',async()=>{
     const paid=compute();if(paid===null||!shift||completed)return;
     if(!pending){pending={request_id:crypto.randomUUID(),branch:selectedBranch,shift_id:shift.id,quotation_number:quote.number,
       method:method.value,amount_paid_cents:paid,attestation:method.value==='CASH'?'CASH_RECEIVED':'CARD_TERMINAL_APPROVED'};
       method.disabled=true;amount.disabled=true;}
     submit.disabled=true;submit.textContent='Confirming payment…';
     try{
       const data=await api('/api/payments/quick-confirm',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(pending)});
       completed=true;pending=null;
       feedback.replaceChildren(h('p','PAID · '+data.invoice_number+' · Sent to Dispatch. '+(data.change_cents?'Change: '+money(data.change_cents):''),'success'));
       const printReceipt=h('button','Print 80mm PAID receipt','widebutton');printReceipt.type='button';
       printReceipt.addEventListener('click',()=>void printThermalPaidInvoice(data.invoice_id,{
         quotation_number:quote.number,cashier_name:E('signed-in')?.textContent.split(' · ')[0],
         cash_cents:method.value==='CASH'?quote.total_cents:0,
         cash_received_cents:method.value==='CASH'?paid:0,
         card_cents:method.value==='CARD'?quote.total_cents:0,eft_cents:0
       }).catch(e=>err(e.message)));
       feedback.append(printReceipt);
       status.textContent='Cashier confirmation recorded. Cash Office can audit this sale.';
       submit.remove();await loadPaymentQueue();
     }catch(e){
       feedback.replaceChildren(h('p',e.message+' Check My payments before retrying. Retry keeps the same request ID.','error'));
       submit.textContent='Retry same payment confirmation';submit.disabled=false;
     }
   });
   (async()=>{try{
     const data=await api('/api/till-shifts?branch='+encodeURIComponent(selectedBranch));
     if(selectedBranch!==branch||!p.isConnected)return;
     shift=(data.shifts||[]).find(x=>x.status==='OPEN')||null;
     status.textContent=shift?'Open till: '+shift.till_code+' (shift #'+shift.id+')':'Open your own till shift above first.';
     compute();
   }catch(e){status.textContent='Cannot verify till shift: '+e.message;}})();
   return p;
 }
 function paymentQueuePanel(){
   const p=panel(APP==='tills'?'My payments and Dispatch status':'Cash Office — PAID Customer Invoices & Payment Audit');
   const note=APP==='tills'?'Cash/Card confirmations go to Dispatch immediately. Legacy or EFT requests can still await independent verification.':'Audit cashier-confirmed Cash/Card sales here. Older/EFT submissions awaiting verification still require independent Cash Office confirmation.';
   p.append(h('p',note,'cashup-warning'));
   const refresh=h('button','Refresh payment queue','secondary');refresh.addEventListener('click',loadPaymentQueue);p.append(refresh);
   const list=h('div','Loading payment requests…');list.id='p9-payments';p.append(list);
   return p;
 }
 // Print only confirmed, branch-authorised invoices returned by the private Core API.
 function printDocument(sheet){
   E('thermal-print-style')?.remove();
   E('print-sheet')?.remove();sheet.id='print-sheet';document.body.append(sheet);
   window.addEventListener('afterprint',()=>{if(sheet.isConnected)sheet.remove();},{once:true});
   window.print();
 }
 function printHeader(sheet,heading,number,subheading){
   const head=h('div',undefined,'doc-head');
   const logo=h('img');logo.src='/powerbuild-logo.png';logo.alt='PowerBuild';logo.className='print-logo';
   const right=h('div',undefined,'doc-right');right.append(h('h1',heading,'doc-title'),h('p',number,'price'));
   if(subheading)right.append(h('p',subheading,'tiny'));
   head.append(logo,right);sheet.append(head);
 }
 function printMetadata(sheet,pairs){
   const grid=h('div',undefined,'doc-meta');
   for(const [name,value] of pairs)grid.append(h('p',name+': '+String(value??'—')));
   sheet.append(grid);
 }
 function printItems(sheet,items,withPrices){
   const table=h('table'),head=h('thead'),hr=h('tr');
   for(const name of withPrices?['Product code','Description','Qty','Unit price','Total']:['Pick','Product code','Product description','Quantity to pick'])cell(hr,name,'th');
   head.append(hr);table.append(head);const tbody=h('tbody');
   for(const item of items||[]){
     const tr=h('tr');
     const values=withPrices?[item.code,item.name,String(item.quantity)+' '+item.unit,money(item.price_cents),money(item.line_total_cents)]:['☐',item.code,item.name,String(item.quantity)+' '+item.unit];
     for(const val of values)cell(tr,val);
     if(!withPrices)tr.firstChild.className='pick-check';
     tbody.append(tr);
   }
   table.append(tbody);sheet.append(table);
 }
 async function printInternalInvoice(id,payment){
   const selected=branch;
   const data=await api('/api/invoices?branch='+encodeURIComponent(selected)+'&id='+encodeURIComponent(id));
   if(selected!==branch)throw Error('Branch changed while loading invoice. Please try again.');
   const row=data.invoice;
   if(!row||!row.id||row.id!==id)throw Error('The confirmed invoice could not be verified.');
   const sheet=h('section',undefined,'print-sheet');
   printHeader(sheet,'PAID SALES INVOICE',row.number,'CUSTOMER COPY · INTERNAL RECORD');
   const stamp=h('div',undefined,'doc-paid');stamp.textContent='PAID';sheet.append(stamp);
   const methods=payment?([payment.cash_cents?'Cash':'',payment.card_cents?'Card':'',payment.eft_cents?'EFT':''].filter(Boolean).join(' + ')||'Confirmed'):'Confirmed';
   printMetadata(sheet,[['Branch',row.branch],['Invoice number',row.number],['Date',showDate(row.issued_at)],['Quotation',payment?.quotation_number||'—'],['Customer',row.customer_name],['Contact',row.customer_contact||'—'],['Payment method',methods],['Payment status','CONFIRMED IN MALIKS SYSTEM']]);
   printItems(sheet,row.lines,true);
   const totals=h('div',undefined,'doc-totals');
   for(const [label,amount,isGrand] of [['Amount excluding VAT',row.net_cents,false],['VAT included (15%)',row.vat_cents,false],['Total PAID',row.total_cents,true],['Balance due',0,false]]){
     const line=h('p');line.append(h(isGrand?'strong':'span',label),h(isGrand?'strong':'span',money(amount)));totals.append(line);
   }
   sheet.append(totals);
   const foot=h('div',undefined,'doc-foot');foot.append(h('p','Thank you for shopping with PowerBuild. Please keep this document for collection and enquiries.'));
   foot.append(h('p','INTERNAL PAID SALES INVOICE. This is not a statutory VAT tax invoice. Card status reflects staff-recorded confirmation; it is not independent bank settlement. No automatic stock deduction or gate release.'));
   sheet.append(foot);printDocument(sheet);
 }
 // Paid receipts: the authenticated Core must return a CONFIRMED invoice for this branch.
 // Unlike Cash Office's A4 internal invoice, Tills prints an 80 mm monochrome slip.
 async function printThermalPaidInvoice(id,payment){
   const selected=branch;
   const data=await api('/api/invoices?branch='+encodeURIComponent(selected)+'&id='+encodeURIComponent(id));
   if(selected!==branch)throw Error('Branch changed while loading the paid receipt.');
   const invoice=data.invoice;
   if(!invoice||invoice.id!==id||invoice.branch!==selected||!Array.isArray(invoice.lines))throw Error('No confirmed paid invoice available for this branch.');
   const sheet=h('section');thermalHeader(sheet,'PAID INVOICE / RECEIPT',invoice.number,invoice.branch);
   for(const value of ['Date: '+showDate(invoice.issued_at),'Quotation: '+(payment?.quotation_number||'—'),
     'Customer: '+invoice.customer_name,'Cashier: '+(payment?.cashier_name||E('signed-in')?.textContent.split(' · ')[0]||'—')])
     sheet.append(h('div',value,'receipt-field'));
   thermalDivider(sheet);thermalItems(sheet,invoice.lines);thermalTotals(sheet,invoice,true);
   const cash=Number(payment?.cash_cents||0),card=Number(payment?.card_cents||0),eft=Number(payment?.eft_cents||0);
   thermalPair(sheet,'Payment method',[cash?'CASH':'',card?'CARD':'',eft?'EFT':''].filter(Boolean).join(' + ')||'Confirmed');
   if(cash){thermalPair(sheet,'Cash received',money(Number(payment?.cash_received_cents||cash)));thermalPair(sheet,'Change',money(Math.max(0,Number(payment?.cash_received_cents||cash)-cash)));}
   if(card)thermalPair(sheet,'Card',money(card));
   if(eft)thermalPair(sheet,'EFT',money(eft));
   thermalPair(sheet,'Balance due',money(0));
   sheet.append(h('div','PAID','receipt-stamp'));
   thermalFooter(sheet,['INTERNAL PAID SALES RECEIPT — not a statutory VAT tax invoice.',
     'Cash/Card confirmation is cashier-recorded. Keep this slip for enquiries and collection.']);
   return printThermalSheet(sheet);
 }
 // Picker copy is intentionally separate from the priced customer invoice.
 function printPickingSlip(job){
   if(job.branch!==branch)throw Error('Change back to the correct branch before printing.');
   const sheet=h('section',undefined,'print-sheet picking-sheet');
   printHeader(sheet,'DISPATCH PICKING SLIP','Dispatch #'+job.id,'Invoice '+job.invoice_number);
   const stamp=h('div',undefined,'doc-paid');stamp.textContent='PAID IN SYSTEM';sheet.append(stamp);
   printMetadata(sheet,[['Branch',job.branch],['Dispatch number','#'+job.id],['Paid invoice',job.invoice_number],['Quotation',job.quotation_number],['Customer',job.customer_name],['Date',showDate(job.created_at)],['Items to pick',String(job.lines.length)],['Current picking status',job.status]]);
   printItems(sheet,job.lines,false);
   const lines=h('div',undefined,'pick-signatures');
   for(const name of ['Picked by (name & signature)','Pick time / staging location','Checked by (name & signature)','Check time / shortages'])lines.append(h('p',name+': ________________________'));
   sheet.append(lines);
   const foot=h('div',undefined,'doc-foot');foot.append(h('p','PICKING INSTRUCTION ONLY — NO PRICES. An independent checker must verify stock and quantities before goods can be released.'));
   foot.append(h('p','Printing this paper does not deduct stock, authorise vehicle exit or replace a signed delivery note / POD.'));
   sheet.append(foot);printDocument(sheet);
 }
 async function loadPaymentQueue(){
   const p=E('p9-payments');if(!p)return;const selected=branch;p.replaceChildren(h('p','Loading payments…','muted'));
   try{
     const data=await api('/api/payments?branch='+encodeURIComponent(selected));if(selected!==branch)return;
     p.replaceChildren();if(!data.payments.length){p.append(h('p','No submitted payments for this branch.','muted'));return;}
     for(const payment of data.payments){
       const div=h('div',undefined,'review-box');
       div.append(h('strong',payment.quotation_number+' — '+money(payment.total_cents)+' · '+payment.status));
       div.append(h('p','Cashier: '+payment.cashier_name+' · '+showDate(payment.created_at),'tiny'));
       div.append(h('p','Cash '+money(payment.cash_cents)+' / card '+money(payment.card_cents)+' / EFT '+money(payment.eft_cents),'tiny'));
       if(payment.cashier_confirmed)div.append(h('p','Cashier-confirmed '+payment.confirmation_method+' · Subject to Cash Office audit (not bank/processor verified)','tiny'));
       if(payment.invoice_id){
         div.append(h('p','PAID · '+payment.invoice_number+' · Dispatch notified','success'));
         const b=h('button',APP==='tills'?'Reprint 80mm PAID receipt':'Print A4 PAID customer invoice','small-btn');
         b.addEventListener('click',()=>void (APP==='tills'?printThermalPaidInvoice(payment.invoice_id,payment):printInternalInvoice(payment.invoice_id,payment)).catch(e=>err(e.message)));
         div.append(b);
       }
       if(APP==='cashoffice'&&payment.status==='AWAITING_VERIFICATION'){
         const methods=[];
         if(payment.cash_cents)methods.push('cash counted');if(payment.card_cents)methods.push('terminal approved');if(payment.eft_cents)methods.push('bank credit verified');
         const action=h('div');
         action.append(h('p','Independently verify: '+methods.join(' · '),'training-warning'));
         const check=h('input');check.type='checkbox';check.style.width='auto';check.style.marginRight='7px';
         const checkLabel=h('label');checkLabel.append(check,document.createTextNode(' I inspected the evidence myself; this is not based solely on the cashier’s entry.'));action.append(checkLabel);
         const label=h('label','Evidence/reference and additional comments');const notes=h('textarea');notes.placeholder='Record terminal batch/approval or bank statement reference. Never enter card numbers.';notes.maxLength=370;notes.rows=2;action.append(label,notes);
         for(const [decision,text] of [['CONFIRMED','Confirm receipt and send to Dispatch'],['REJECTED','Reject payment request']]){
           const b=h('button',text,decision==='REJECTED'?'secondary small-btn':'small-btn');b.style.margin='6px 7px 0 0';action.append(b);
           b.addEventListener('click',async()=>{
             if(!check.checked){err('Review the independent payment evidence and tick the confirmation first.');return;}
             if(notes.value.trim().length<8){err('Add a meaningful evidence reference or reason.');return;}
             const evidence_note=(decision==='CONFIRMED'?methods.join('; ')+'; ':'')+notes.value.trim();
             if(!window.confirm(decision==='CONFIRMED'?'Confirm RECEIPT and create an internal invoice and Dispatch job?':'Reject this payment request?'))return;
             b.disabled=true;
             try{const res=await api('/api/payments/verify',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({request_id:crypto.randomUUID(),branch:selected,payment_id:payment.id,decision,evidence_note})});
               err('');div.append(h('p',res.status+(res.invoice_number?' · '+res.invoice_number+' queued for Dispatch':''),'success'));await loadPaymentQueue();
             }catch(e){err(e.message+' Do not retry with a new decision until you have refreshed the payment status.');b.disabled=false;}
           });
         }
         div.append(action);
       }
       p.append(div);
     }
   }catch(e){if(selected===branch)p.replaceChildren(h('p',e.message,'error'));}
 }
 // A polling notification works while the Dispatch page is open. No push service is implied.
 const dispatchNotified=new Set();
 let dispatchWatch=null,dispatchSignature='',dispatchLoading=false;
 function dispatchAlert(job){
   if(E('dispatch-alert'))return;
   const overlay=h('div',undefined,'dispatch-alert-overlay');overlay.id='dispatch-alert';
   const dialog=h('section',undefined,'dispatch-alert-card');dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');
   dialog.setAttribute('aria-labelledby','dispatch-alert-title');
   const title=h('h2','New PAID invoice for picking');title.id='dispatch-alert-title';
   dialog.append(h('span','PAID IN SYSTEM','paid-pill'),title,
      h('p',job.invoice_number+' · Dispatch #'+job.id+' · '+money(job.total_cents),'price'),
      h('p',job.customer_name+' · '+job.lines.length+' product line(s)'),
      h('p','Print the picking slip and hand it to the picker. Independent checking and security release still apply.','muted'));
   const bar=h('div',undefined,'bar');
   const print=h('button','Print picking slip');
   const close=h('button','View Dispatch queue','secondary');
   function dismiss(){overlay.remove();}
   print.addEventListener('click',()=>{try{printPickingSlip(job);dismiss();}catch(error){err(error.message);}});
   close.addEventListener('click',dismiss);
   bar.append(print,close);dialog.append(bar);overlay.append(dialog);document.body.append(overlay);print.focus();
 }
 function dispatchQueuePanel(){
   const p=panel('PAID invoices — Dispatch picking queue');
   p.append(h('p','A new paid invoice triggers an alert while this page is open. Print its picking slip for the picker. Printed slips do not deduct stock or authorise gate release.','notice'));
   const refresh=h('button','Refresh paid dispatch jobs','secondary');refresh.addEventListener('click',()=>void loadDispatchQueue());p.append(refresh);
   const status=h('p','Watching for new paid invoices (checks every 20 seconds).','tiny');p.append(status);
   const list=h('div','Loading Dispatch jobs…');list.id='p9-dispatch';p.append(list);return p;
 }
 async function loadDispatchQueue({quiet=false}={}){
   const target=E('p9-dispatch');if(!target||dispatchLoading)return;
   const selected=branch;dispatchLoading=true;
   if(!quiet)target.replaceChildren(h('p','Loading paid invoices…','muted'));
   try{
     const data=await api('/api/dispatch-jobs?branch='+encodeURIComponent(selected));
     if(selected!==branch)return;
     const jobs=Array.isArray(data.jobs)?data.jobs:[];
     const signature=selected+'|'+JSON.stringify(jobs.map(j=>[j.id,j.status,j.notes,j.picker_name,j.checker_name]));
     // Don't erase the picker's handwritten notes while polling if nothing has changed.
     if(quiet&&dispatchSignature===signature)return;
     dispatchSignature=signature;target.replaceChildren();
     if(!jobs.length){target.append(h('p','No paid invoices awaiting picking.','muted'));return;}
     for(const job of jobs){
       const p=h('div',undefined,'review-box');p.append(h('h3','Dispatch #'+job.id+' · '+job.invoice_number+' — '+job.status));
       p.append(h('p',job.customer_name+' · '+job.quotation_number+' · '+money(job.total_cents),'price'));
       const printed=h('button','Print picking slip','secondary small-btn');printed.type='button';printed.addEventListener('click',()=>{try{printPickingSlip(job);}catch(e){err(e.message);}});p.append(printed);
       const table=h('table');const hr=h('tr');for(const v of ['Product','Quantity','Code'])cell(hr,v,'th');table.append(hr);
       for(const item of job.lines){const line=h('tr');for(const v of [item.name,String(item.quantity)+' '+item.unit,item.code])cell(line,v);table.append(line);}p.append(table);
       if(job.picker_name)p.append(h('p','Picked by: '+job.picker_name,'tiny'));
       if(job.checker_name)p.append(h('p','Checked by: '+job.checker_name,'tiny'));
       if(['AWAITING_PICK','PICKED'].includes(job.status)){
         const note=h('input');note.placeholder=job.status==='AWAITING_PICK'?'Picker name / staging location':'Independent checker notes / shortages';note.maxLength=250;
         const btn=h('button',job.status==='AWAITING_PICK'?'Mark picked':'Independent checker sign-off');btn.style.marginTop='8px';
         btn.addEventListener('click',async()=>{
           if(note.value.trim().length<3){err('Enter a note describing the action.');return;}
           if(!window.confirm('Record this Dispatch action? This is not stock posting or gate release.'))return;
           btn.disabled=true;
           try{await api('/api/dispatch-jobs/action',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({request_id:crypto.randomUUID(),branch:selected,job_id:job.id,action:job.status==='AWAITING_PICK'?'PICK':'CHECK',note:note.value.trim()})});err('');await loadDispatchQueue();}
           catch(e){err(e.message);btn.disabled=false;}
         });p.append(note,btn);
       }else p.append(h('p','Checked; waiting for separately controlled goods release and signed POD.','success'));
       target.append(p);
     }
     if(!E('dispatch-alert')){
       // Only unpicked, confirmed items can trigger a pop-up. IDs are not personal information.
       const unpicked=jobs.find(j=>j.status==='AWAITING_PICK'&&!dispatchNotified.has(selected+'#'+j.id));
       if(unpicked){dispatchNotified.add(selected+'#'+unpicked.id);dispatchAlert(unpicked);}
     }
   }catch(e){if(selected===branch){if(!quiet)target.replaceChildren(h('p',e.message,'error'));else err('Dispatch refresh unavailable: '+e.message);}}
   finally{dispatchLoading=false;}
 }
 function dispatchView(){
   E('dispatch-alert')?.remove();dispatchSignature='';
   E('app-content').append(dispatchQueuePanel());void loadDispatchQueue();
   if(!dispatchWatch)dispatchWatch=setInterval(()=>{if(document.visibilityState==='visible'&&E('p9-dispatch'))void loadDispatchQueue({quiet:true});},20000);
 }
 function suiteButton(text,module,cls=''){
   const b=h('button',text,cls);b.type='button';b.addEventListener('click',()=>setSuiteView(module));return b;
 }
 function suiteHome(){
   const root=E('app-content');
   const hero=h('section',undefined,'suite-hero');
   hero.append(h('div','MALIKS PROFESSIONAL · SECURE RETAIL OPERATIONS','suite-eyebrow'));
   const title=h('div',undefined,'suite-hero-title');title.append(h('span','MALIKS '),document.createTextNode('POS'));hero.append(title);
   hero.append(h('p','Accounting & POS Solutions Professional — stock, debtors, suppliers, back office and multi-branch operations in a dedicated management workspace.','suite-hero-subtitle'));
   hero.append(suiteButton('Open Stock module  →','stock','suite-primary'));root.append(hero);
   const head=h('div',undefined,'suite-section-head');head.append(h('h3','Your workspaces'),h('small','Menus based on the supplied system reference'));root.append(head);
   const cards=h('div',undefined,'suite-card-grid');
   const definitions=[
     ['tills','▤','Tills','Cashier checkout, cash/card confirmations and paid receipts.','SEPARATE WORKSTATION'],
     ['cashoffice','◈','Cash Office','Payment verification, cash-up and internal finance controls.','SEPARATE WORKSTATION'],
     ['dispatching','⇥','Dispatching','Paid-order picking, checking and delivery management.','SEPARATE WORKSTATION'],
     ['stock','▦','Stock','Purchase orders, receiving, GRVs, stock-on-hand and transfers.','LIVE STOCK FLOW'],
     ['debtors','◎','Debtors','Branch debtor master records and audit history.','LIVE MASTER FILES'],
     ['suppliers','▤','Suppliers','Supplier master and purchase orders.','LIVE PURCHASING'],
     ['backoffice','▥','Back Office','Tills, end-of-day, VAT, reporting and month-end controls.','MENU INVENTORY'],
     ['headoffice','◇','Head Office','Branches, synchronization and group management.','MENU INVENTORY'],
   ];
   for(const [id,symbol,name,description,status] of definitions){
     const card=suiteButton('',id,'suite-card');card.append(h('span',symbol,'suite-card-icon'),h('strong',name),h('small',description));
     card.append(h('span',status,'suite-card-status'+(status.startsWith('LIVE')?' live':'')));cards.append(card);
   }
   root.append(cards,h('p','Hub catalogue-linked stock, purchase orders, GRVs, transfers and supplier invoice matching are connected. AP, VAT, GL, sales stock deduction and returns are NOT posted.','suite-footnote'));
 }
 const MASTER_LABELS={stock:'Stock Master',supplier:'Suppliers Master',debtor:'Debtors Master'};
 const MASTER_FIELDS={
   stock:[['unit','Unit','text'],['category','Category','text'],['barcode','Barcode','text'],['cost_cents','Cost price (R)','money'],['selling_price_cents','Selling price (R)','money'],['reorder_min','Minimum stock level','integer']],
   supplier:[['contact_name','Contact person','text'],['phone','Phone','text'],['email','Email','email'],['vat_number','VAT number','text'],['payment_terms_days','Payment terms (days)','integer']],
   debtor:[['contact_name','Contact person','text'],['phone','Phone','text'],['email','Email','email'],['credit_limit_cents','Credit limit (R)','money'],['payment_terms_days','Payment terms (days)','integer']]
 };
 let masterPermissions={};
 let purchasePermissions={};
 let inventoryPermissions={};
 let supplierInvoicePermissions={};
 function suiteMasterView(kind,openAudit=false){
   const detail=E('suite-feature-detail');if(!detail)return;
   const selectedBranch=branch;detail.hidden=false;detail.className='suite-feature-detail suite-master-workspace';detail.replaceChildren();
   const header=h('div',undefined,'suite-master-header');header.append(h('h3',MASTER_LABELS[kind]));
   const tools=h('div',undefined,'suite-master-actions');
   const search=h('input');search.type='search';search.placeholder='Search code or name';search.setAttribute('aria-label','Search '+MASTER_LABELS[kind]);
   const searchButton=h('button','Search');searchButton.type='button';
   const newButton=h('button',kind==='stock'?'Link Hub catalogue to branch':'New '+kind);newButton.type='button';
   const auditButton=h('button','Audit history','secondary');auditButton.type='button';
   const refreshButton=h('button','Refresh','secondary');refreshButton.type='button';
   const cancelButton=h('button','Back to list','secondary');cancelButton.type='button';
   tools.append(search,searchButton,refreshButton,auditButton);
   if(masterPermissions[kind]?.write)tools.append(newButton);
   header.append(tools);detail.append(header);
   const notice=h('p',kind==='stock'?'Branch: '+selectedBranch+' · Products come directly from the Group Hub catalogue. Link once to enable purchasing, GRVs and transfers. Opening stock is NOT imported.':'Branch: '+selectedBranch+' · Master records do not post supplier/debtor balances, invoices or GL entries.','suite-master-note');detail.append(notice);
   const feedback=h('div');feedback.setAttribute('role','status');detail.append(feedback);
   const editor=h('section',undefined,'suite-master-editor');editor.hidden=true;detail.append(editor);
   const listArea=h('div');detail.append(listArea);
   const auditArea=h('div');auditArea.hidden=true;detail.append(auditArea);
   const valid=()=>branch===selectedBranch&&detail.isConnected;
   const showMessage=(message,good=false)=>{feedback.textContent=message;feedback.className=good?'success':'error';feedback.hidden=!message;};
   feedback.hidden=true;
   let masterPage=1;const displayValue=(v)=>v===null||v===undefined?'':String(v);
   function openEditor(record){
     if(!masterPermissions[kind]?.write){showMessage('This account has read-only access.');return;}
     editor.hidden=false;editor.replaceChildren();auditArea.hidden=true;listArea.hidden=true;
     const heading=h('h3',record?'Edit '+record.code:'New '+MASTER_LABELS[kind]+' record');editor.append(heading);
     if(kind==='stock')editor.append(h('p','Code, description, department and selling price come from Hub Catalogue / Price Tag Studio. POS only edits branch stock settings.','muted'));
     const form=h('form',undefined,'suite-master-form');const controls={};
     const addField=(key,label,type,value)=>{
       const wrap=h('label');wrap.append(h('span',label));const input=h('input');
       input.name=key;input.type=type==='money'||type==='integer'?'number':type==='email'?'email':'text';
       if(type==='money'){input.step='0.01';input.min='0';}else if(type==='integer'){input.step='1';input.min='0';}
       input.value=displayValue(value);if(key==='code'||key==='name'||key==='unit')input.required=true;
       if(kind==='stock'&&['code','name','category','selling_price_cents'].includes(key))input.readOnly=true;
       wrap.append(input);form.append(wrap);controls[key]=input;
     };
     addField('code','Code','text',record?.code||'');addField('name','Description / name','text',record?.name||'');
     for(const [key,label,type] of MASTER_FIELDS[kind]){
       const fallback=key==='unit'?'each':type==='integer'||type==='money'?0:'';
       const stored=record?.details?.[key]??fallback;
       addField(key,label,type,type==='money'?Number(stored)/100:stored);
     }
     const activeLabel=h('label');activeLabel.append(h('span','Status'));const active=h('select');
     for(const [value,label] of [['true','Active'],['false','Inactive']]){const option=h('option',label);option.value=value;active.append(option);}
     active.value=record?.active===false?'false':'true';activeLabel.append(active);form.append(activeLabel);
     const buttons=h('div',undefined,'suite-master-form-buttons');const save=h('button','Save master record');save.type='submit';
     buttons.append(save,cancelButton);form.append(buttons);editor.append(form);
     let pendingId=null;form.addEventListener('input',()=>{pendingId=null;});
     form.addEventListener('submit',async event=>{
       event.preventDefault();if(!valid()){showMessage('Branch changed. Reopen the master file.');return;}
       const details={};
       for(const [key,label,type] of MASTER_FIELDS[kind]){
         const value=controls[key].value.trim();
         if(type==='money'){
           const n=Number(value);if(!Number.isFinite(n)||n<0||Math.abs(n*100-Math.round(n*100))>0.00001){showMessage(label+' must be a valid amount with two decimals.');return;}
           details[key]=Math.round(n*100);
         }else if(type==='integer'){
           const n=Number(value);if(!Number.isSafeInteger(n)||n<0){showMessage(label+' must be a whole number.');return;}details[key]=n;
         }else details[key]=value;
       }
       pendingId=pendingId||crypto.randomUUID();
       const body={request_id:pendingId,kind,branch:selectedBranch,code:controls.code.value.trim(),
         name:controls.name.value.trim(),active:active.value==='true',details};
       if(record){body.id=record.id;body.version=record.version;}
       save.disabled=true;showMessage('');
       try{
         const response=await api('/api/master/records',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
         if(!valid())return;
         showMessage('Saved '+response.record.code+' successfully. The change is recorded in the audit history.',true);
         editor.hidden=true;listArea.hidden=false;pendingId=null;await loadRecords();
       }catch(e){if(valid())showMessage(e.message);}finally{save.disabled=false;}
     });
   }
   async function loadRecords(){
     if(!valid())return;
     auditArea.hidden=true;listArea.hidden=false;listArea.replaceChildren(h('p','Loading '+(kind==='stock'?'Hub catalogue products':'branch master records')+'…','muted'));
     try{
       const q=search.value.trim();const data=await api('/api/master/records?kind='+encodeURIComponent(kind)+'&branch='+encodeURIComponent(selectedBranch)+'&q='+encodeURIComponent(q)+'&page='+masterPage);
       if(!valid())return;
       listArea.replaceChildren();
       if(!data.records.length){listArea.append(h('p',kind==='stock'?'No active Hub catalogue products match this search.':'No records found. Use New to add a branch master record.','empty'));return;}
       if(kind==='stock')listArea.append(h('p',data.total+' active Hub catalogue items · Page '+data.page+' of '+data.pages+' · '+data.records.filter(r=>r.linked).length+' linked on this page.','muted'));
       const table=h('table');const head=h('tr');for(const label of ['Code','Name','Status','Updated','Action'])cell(head,label,'th');
       const thead=h('thead');thead.append(head);table.append(thead);const tbody=h('tbody');
       for(const record of data.records){
         const tr=h('tr');cell(tr,record.code);cell(tr,record.name);cell(tr,kind==='stock'?(record.linked?(record.active?'Linked / Active':'Linked / Inactive'):'Not yet linked'):record.active?'Active':'Inactive');cell(tr,showDate(record.updated_at));
         const actions=h('td');if(masterPermissions[kind]?.write&&record.id){const edit=h('button',kind==='stock'?'Branch settings':'Edit','small-btn');edit.type='button';edit.addEventListener('click',()=>openEditor(record));actions.append(edit);}else actions.textContent=kind==='stock'&&!record.linked?'Link catalogue to enable':'Read only';
         tr.append(actions);tbody.append(tr);
       }
       table.append(tbody);const scroller=h('div',undefined,'scroll');scroller.append(table);listArea.append(scroller);
       if(kind==='stock'&&data.pages>1){const pager=h('div',undefined,'suite-master-actions');const prev=h('button','Previous','secondary small-btn');const next=h('button','Next','secondary small-btn');prev.disabled=masterPage<=1;next.disabled=masterPage>=data.pages;
         prev.addEventListener('click',()=>{masterPage--;void loadRecords();});next.addEventListener('click',()=>{masterPage++;void loadRecords();});pager.append(prev,h('span','Page '+masterPage+' / '+data.pages),next);listArea.append(pager);}
     }catch(e){if(valid())showMessage(e.message);}
   }
   async function loadAudit(){
     if(!valid())return;editor.hidden=true;listArea.hidden=true;auditArea.hidden=false;auditArea.replaceChildren(h('p','Loading audit history…','muted'));
     try{
       const data=await api('/api/master/audit?kind='+encodeURIComponent(kind)+'&branch='+encodeURIComponent(selectedBranch));
       if(!valid())return;auditArea.replaceChildren(h('h4','Last 50 master-file changes'));
       if(!data.audit.length){auditArea.append(h('p','No audit events yet.','empty'));return;}
       const table=h('table');const head=h('tr');for(const label of ['Date','Action','Code','User','Change'])cell(head,label,'th');const thead=h('thead');thead.append(head);table.append(thead);
       const tbody=h('tbody');for(const entry of data.audit){const tr=h('tr');cell(tr,showDate(entry.created_at));cell(tr,entry.action);cell(tr,entry.after?.code||'—');cell(tr,entry.actor_name+' ('+entry.actor_email+')');
         const change=h('td');change.textContent=entry.before?'Version '+entry.before.version+' → '+entry.after.version:'Created';tr.append(change);tbody.append(tr);}
       table.append(tbody);const scroller=h('div',undefined,'scroll');scroller.append(table);auditArea.append(scroller);
     }catch(e){if(valid())showMessage(e.message);}
   }
   searchButton.addEventListener('click',()=>{masterPage=1;editor.hidden=true;void loadRecords();});
   search.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();masterPage=1;editor.hidden=true;void loadRecords();}});
   refreshButton.addEventListener('click',()=>{editor.hidden=true;void loadRecords();});
   newButton.addEventListener('click',()=>{if(kind!=='stock'){openEditor(null);return;}
     if(!window.confirm('Link all active Group Hub catalogue products to '+selectedBranch+'? Existing branch stock settings will not be overwritten. This does NOT import stock quantities.'))return;
     newButton.disabled=true;showMessage('Linking catalogue products…');
     void api('/api/master/catalogue/sync',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({branch:selectedBranch,request_id:crypto.randomUUID()})})
       .then(async data=>{if(valid()){showMessage('Hub catalogue linked: '+data.linked+' stock items ('+data.newly_linked+' new). Stock-on-hand remains unchanged.',true);masterPage=1;await loadRecords();}})
       .catch(e=>{if(valid())showMessage(e.message);}).finally(()=>{newButton.disabled=false;});
   });
   auditButton.addEventListener('click',()=>void loadAudit());
   cancelButton.addEventListener('click',()=>{editor.hidden=true;void loadRecords();});
   if(openAudit)void loadAudit();else void loadRecords();
 }
 // Phases 16–17: live purchasing and controlled stock operations, all server-authorised.
 const invQty=milli=>new Intl.NumberFormat('en-ZA',{maximumFractionDigits:3}).format(milli/1000);
 const invNum=(value,name,allowZero=false)=>{const n=Number(value);if(!Number.isFinite(n)||n<(allowZero?0:0.001)||Math.abs(n*1000-Math.round(n*1000))>0.000001||n>1000000)throw Error('Invalid '+name+' (maximum three decimals).');return Math.round(n*1000);};
 const invMoney=value=>{const n=Number(value);if(!Number.isFinite(n)||n<=0||Math.abs(n*100-Math.round(n*100))>0.00001)throw Error('Invalid unit cost.');return Math.round(n*100);};
 const invPending=new Map();
 const invPost=async(path,data)=>{const key=path+'#'+JSON.stringify(data);const request_id=invPending.get(key)||crypto.randomUUID();invPending.set(key,request_id);
   const response=await api(path,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({...data,request_id})});invPending.delete(key);return response;};
 function invWorkspace(title,notice){
   const root=E('suite-feature-detail');root.hidden=false;root.className='suite-feature-detail suite-master-workspace';root.replaceChildren();
   root.append(h('h3',title),h('p','Branch: '+branch+' · '+notice,'suite-master-note'));
   const msg=h('div');msg.hidden=true;msg.setAttribute('role','status');root.append(msg);
   const form=h('section',undefined,'suite-master-editor');root.append(form);
   const list=h('section');root.append(list);
   const branchAtOpen=branch;
   return {root,form,list,valid:()=>root.isConnected&&branch===branchAtOpen,
     message:(s,good=false)=>{msg.textContent=s;msg.className=good?'success':'error';msg.hidden=!s;}};
 }
 const invButton=(text,fn,cls='secondary small-btn')=>{const b=h('button',text,cls);b.type='button';b.addEventListener('click',fn);return b;};
 const invField=(parent,label,type='text',value='')=>{const wrap=h('label');wrap.append(h('span',label));const el=h('input');el.type=type;el.value=String(value);if(type==='number'){el.min='0';el.step='0.001';}wrap.append(el);parent.append(wrap);return el;};
 const invSelect=(parent,label,items,getValue,getLabel)=>{const wrap=h('label');wrap.append(h('span',label));const el=h('select');for(const item of items){const o=h('option',getLabel(item));o.value=String(getValue(item));el.append(o);}wrap.append(el);parent.append(wrap);return el;};
 const invTable=(container,headings,rows)=>{
   container.replaceChildren();if(!rows.length){container.append(h('p','No records yet.','empty'));return;}
   const t=h('table'),thead=h('thead'),tr=h('tr');for(const title of headings)cell(tr,title,'th');thead.append(tr);t.append(thead);
   const tb=h('tbody');for(const row of rows){const r=h('tr');for(const item of row){const td=h('td');if(item instanceof Node)td.append(item);else td.textContent=String(item??'');r.append(td);}tb.append(r);}t.append(tb);
   const scroll=h('div',undefined,'scroll');scroll.append(t);container.append(scroll);
 };
 function suitePurchaseOrders(){
   const w=invWorkspace('Purchase Orders','Draft → Submit → Independent approval. Values are estimated cost only; VAT and supplier accounting are not posted.');
   const controls=h('div',undefined,'suite-master-form');w.form.append(h('h4','Create purchase order'),controls);
   const table=h('div');w.list.append(h('h4','Purchase order register'),table);
   if(!purchasePermissions.read){w.form.hidden=true;w.message('Purchasing permission denied.');return;}
   if(!purchasePermissions.write)w.form.hidden=true;
   const supplierSelect=invSelect(controls,'Supplier',[],s=>s.id,s=>s.name);
   const delivery=invField(controls,'Expected delivery','date');const notes=invField(controls,'Notes');
   const lineSection=h('div');lineSection.style.gridColumn='1/-1';controls.append(lineSection);
   const rows=[];let products=[];
   const stockSearch=invField(controls,'Find linked Hub stock by code or description');
   const findStock=invButton('Find stock',()=>void searchStock());controls.append(findStock);
   async function searchStock(){try{const data=await api('/api/master/records?kind=stock&branch='+encodeURIComponent(branch)+'&q='+encodeURIComponent(stockSearch.value.trim()));
     if(!w.valid())return;const found=data.records.filter(x=>x.active&&x.id);const byId=new Map(products.map(p=>[p.id,p]));for(const p of found)byId.set(p.id,p);products=[...byId.values()];
     w.message(found.length+' linked stock items found. Click Add stock line to select one.',true);}
     catch(e){w.message(e.message);}}
   stockSearch.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();void searchStock();}});
   const addLine=()=>{
     if(!products.length){w.message('Link the Group Hub catalogue to this branch, or search for a linked stock item.');return;}
     const row=h('div',undefined,'suite-master-actions');
     const product=invSelect(row,'Stock item',products,p=>p.id,p=>p.code+' · '+p.name);
     const qty=invField(row,'Quantity','number','1');const cost=invField(row,'Unit cost (R)','number',String((products[0].details?.cost_cents||100)/100));cost.step='0.01';
     product.addEventListener('change',()=>{const p=products.find(x=>x.id===Number(product.value));if(p)cost.value=String((p.details?.cost_cents||100)/100);});
     const entry={product,qty,cost,row};row.append(invButton('Remove',()=>{row.remove();rows.splice(rows.indexOf(entry),1);}));rows.push(entry);lineSection.append(row);
   };
   const actions=h('div',undefined,'suite-master-form-buttons');actions.style.gridColumn='1/-1';
   const add=invButton('Add stock line',addLine);const save=invButton('Save draft',()=>void savePO(),'suite-primary');actions.append(add,save);controls.append(actions);
   async function loadMasters(){
     try{const [s,p]=await Promise.all(['supplier','stock'].map(kind=>api('/api/master/records?kind='+kind+'&branch='+encodeURIComponent(branch))));
       if(!w.valid())return;products=p.records.filter(x=>x.active&&x.id);supplierSelect.replaceChildren();
       for(const item of s.records.filter(x=>x.active)){const o=h('option',item.code+' · '+item.name);o.value=item.id;supplierSelect.append(o);}
       if(!rows.length)addLine();
     }catch(e){w.message(e.message);}
   }
   async function savePO(){
     if(!w.valid())return;save.disabled=true;w.message('');
     try{
       const lines=rows.map(x=>({stock_id:Number(x.product.value),quantity_milli:invNum(x.qty.value,'quantity'),unit_cost_cents:invMoney(x.cost.value)}));
       const response=await invPost('/api/purchase-orders',{branch,supplier_master_id:Number(supplierSelect.value),expected_date:delivery.value,notes:notes.value,lines});
       if(!w.valid())return;w.message('Saved '+response.po.number+' as DRAFT. Submit for independent approval.',true);await loadPOs();
     }catch(e){w.message(e.message);}finally{save.disabled=false;}
   }
   async function doAction(po,action){
     let note='';if(action==='REJECT'||action==='CANCEL'){note=window.prompt('Reason for '+action.toLowerCase()+':','')||'';if(!note)return;}
     else if(!window.confirm(action+' '+po.number+'?'))return;
     try{const r=await invPost('/api/purchase-orders/action',{id:po.id,version:po.version,branch,action,note});
       if(w.valid()){w.message(r.po.number+' is now '+r.po.status+'.',true);await loadPOs();}
     }catch(e){if(w.valid())w.message(e.message);}
   }
   async function showAudit(po){
     try{const data=await api('/api/purchase-orders/audit?branch='+encodeURIComponent(branch)+'&id='+po.id);
       if(!w.valid())return;const lines=data.audit.map(a=>showDate(a.created_at)+' · '+a.action+' · '+a.actor_name+' · '+(a.note||''));
       w.message('');window.alert(lines.join('\\n')||'No audit events.');
     }catch(e){w.message(e.message);}
   }
   async function loadPOs(){
     try{const data=await api('/api/purchase-orders?branch='+encodeURIComponent(branch));if(!w.valid())return;
       invTable(table,['PO','Supplier','Status','Amount','Lines','Updated','Actions'],data.orders.map(po=>{
         const buttons=h('div',undefined,'suite-master-actions');
         if(purchasePermissions.write&&po.status==='DRAFT')buttons.append(invButton('Submit',()=>void doAction(po,'SUBMIT')));
         if(purchasePermissions.approve&&po.status==='SUBMITTED'){buttons.append(invButton('Approve',()=>void doAction(po,'APPROVE')),invButton('Reject',()=>void doAction(po,'REJECT')));}
         if(purchasePermissions.write&&['DRAFT','SUBMITTED'].includes(po.status))buttons.append(invButton('Cancel',()=>void doAction(po,'CANCEL')));
         buttons.append(invButton('Audit',()=>void showAudit(po)));
         return [po.number,po.supplier_name,po.status,money(po.total_cents),po.lines.map(l=>l.stock_code+' × '+invQty(l.quantity_milli)).join('; '),showDate(po.updated_at),buttons];
       }));
     }catch(e){if(w.valid())w.message(e.message);}
   }
   void loadMasters();void loadPOs();
 }
 function suiteReceiving(){
   const w=invWorkspace('Receiving and GRV','Receiving Clerk counts accepted/damaged items; a different manager verifies; an independent GRV Clerk posts stock.');
   const controls=h('div',undefined,'suite-master-form');w.form.append(h('h4','Count delivery against approved PO'),controls);
   const poSelect=invSelect(controls,'Approved purchase order',[],p=>p.id,p=>p.number);
   const dn=invField(controls,'Supplier delivery note');const invoice=invField(controls,'Supplier invoice reference');const driver=invField(controls,'Driver name');const notes=invField(controls,'Count notes');
   const lineArea=h('div');lineArea.style.gridColumn='1/-1';controls.append(lineArea);
   const count=invButton('Record blind/count sheet',()=>void recordCount(),'suite-primary');controls.append(count);
   const table=h('div');w.list.append(h('h4','Receiving and GRV register'),table);
   let poList=[];const inputRows=[];
   function linesForPO(){
     inputRows.length=0;lineArea.replaceChildren();const po=poList.find(p=>p.id===Number(poSelect.value));if(!po)return;
     for(const l of po.lines){const row=h('div',undefined,'suite-master-actions');row.append(h('strong',l.stock_code+' · '+l.stock_name));
       const accepted=invField(row,'Accepted qty','number','0');const rejected=invField(row,'Damaged/rejected qty','number','0');
       inputRows.push({l,accepted,rejected});lineArea.append(row);
     }
   }
   poSelect.addEventListener('change',linesForPO);
   async function recordCount(){
     count.disabled=true;w.message('');try{
       const lines=inputRows.map(x=>({stock_id:x.l.stock_id,accepted_milli:invNum(x.accepted.value,'accepted',true),rejected_milli:invNum(x.rejected.value,'rejected',true)})).filter(x=>x.accepted_milli||x.rejected_milli);
       const r=await invPost('/api/receipts',{branch,po_id:Number(poSelect.value),delivery_note:dn.value,supplier_invoice_reference:invoice.value,driver_name:driver.value,notes:notes.value,lines});
       if(w.valid()){w.message('Count saved '+r.receipt.number+'. Manager verification is required.',true);await loadReceipts();}
     }catch(e){w.message(e.message);}finally{count.disabled=false;}
   }
   async function doAction(receipt,action){
     if(!window.confirm(action+' '+receipt.number+'?'+(action==='POST'?' This will INCREASE stock-on-hand.':'')))return;
     try{const r=await invPost('/api/receipts/action',{id:receipt.id,version:receipt.version,branch,action});
       if(w.valid()){w.message(r.receipt.number+' '+r.receipt.status+'.',true);await loadReceipts();}
     }catch(e){w.message(e.message);}
   }
   async function loadPOs(){
     try{const data=await api('/api/purchase-orders?branch='+encodeURIComponent(branch));if(!w.valid())return;
       poList=data.orders.filter(p=>p.status==='APPROVED');poSelect.replaceChildren();
       for(const po of poList){const o=h('option',po.number+' · '+po.supplier_name);o.value=po.id;poSelect.append(o);}linesForPO();
     }catch(e){w.message(e.message);}
   }
   async function loadReceipts(){
     try{const data=await api('/api/receipts?branch='+encodeURIComponent(branch));if(!w.valid())return;
       invTable(table,['Receipt','PO','DN','Status','Counted items','Actions'],data.receipts.map(r=>{
         const buttons=h('div',undefined,'suite-master-actions');
         if(inventoryPermissions.verify&&r.status==='COUNTED')buttons.append(invButton('Verify',()=>void doAction(r,'VERIFY')),invButton('Cancel',()=>void doAction(r,'CANCEL')));
         if(inventoryPermissions.post&&r.status==='VERIFIED')buttons.append(invButton('Post GRV',()=>void doAction(r,'POST')));
         if(inventoryPermissions.post&&r.status==='POSTED'&&!r.labels_printed_by)buttons.append(invButton('Confirm labels printed',()=>void doAction(r,'PRINT_LABELS')));
         if(inventoryPermissions.count&&r.labels_printed_by&&!r.labelled_by)buttons.append(invButton('Mark labelled',()=>void doAction(r,'LABELLED')));
         if(inventoryPermissions.packCheck&&r.labelled_by&&!r.pack_checked_by)buttons.append(invButton('Check GRV pack',()=>void doAction(r,'PACK_CHECK')));
         return [r.number,'PO-'+String(r.po_id).padStart(6,'0'),r.delivery_note,r.status,r.lines.map(l=>l.code+' '+invQty(l.accepted_milli)+' accepted / '+invQty(l.rejected_milli)+' damaged').join('; '),buttons];
       }));
     }catch(e){if(w.valid())w.message(e.message);}
   }
   if(!inventoryPermissions.count)w.form.hidden=true;
   void loadPOs();void loadReceipts();
 }
 function suiteStockBalances(){
   const w=invWorkspace('Stock-on-Hand','Operational quantities include posted GRVs, transfers, independently approved adjustments and stock counts. Sales deductions and returns are not yet integrated.');w.form.hidden=true;
   let stockPage=1;const refresh=invButton('Refresh stock balances',()=>void load(),'suite-primary');
   const pager=h('div',undefined,'suite-master-actions'),prev=invButton('Previous',()=>{if(stockPage>1){stockPage--;void load();}}),next=invButton('Next',()=>{stockPage++;void load();});pager.append(prev,next);w.list.append(refresh,pager);
   const items=h('div'),moves=h('div');w.list.append(h('h4','Branch balances'),items,h('h4','Recent stock movements'),moves);
   async function load(){try{const data=await api('/api/inventory?branch='+encodeURIComponent(branch)+'&page='+stockPage);if(!w.valid())return;
     prev.disabled=stockPage<=1;next.disabled=stockPage>=data.pages;pager.hidden=data.pages<=1;
     invTable(items,['Code','Description','Unit','On-hand','Version'],data.items.map(x=>[x.code,x.name,x.unit||'each',invQty(x.qty_milli),x.stock_version]));
     invTable(moves,['Date','Stock','Type','Document','Change','User'],data.movements.map(x=>[showDate(x.created_at),x.code,x.movement_type,x.document_id,(x.quantity_delta_milli>0?'+':'')+invQty(x.quantity_delta_milli),x.actor_email]));
   }catch(e){if(w.valid())w.message(e.message);}}
   void load();
 }
 function suiteStockControl(initialType='STOCKTAKE'){
   const w=invWorkspace('Stock Control — Adjustments & Stock Takes','Physical count/adjustment is a draft until a DIFFERENT authorised manager approves it. Opening stock is only for items without prior movements. This changes operational stock, NOT the General Ledger.');
   const form=h('div',undefined,'suite-master-form');w.form.append(h('h4','New controlled stock document'),form);
   const type=invSelect(form,'Document type',['STOCKTAKE','ADJUSTMENT','OPENING'],x=>x,x=>({STOCKTAKE:'Physical stock take',ADJUSTMENT:'Stock adjustment (+ / −)',OPENING:'Opening physical count'}[x]));type.value=initialType;
   const reason=invField(form,'Reason / reference');reason.placeholder='Explain the count, damage, correction or opening balance';
   const lookup=invField(form,'Find stock code / description','search');lookup.placeholder='Search the linked Hub stock items';
   const searchButton=invButton('Search stock',()=>void loadItems(),'secondary');form.append(searchButton);
   const lineArea=h('div');lineArea.style.gridColumn='1/-1';form.append(lineArea);
   const actions=h('div',undefined,'suite-master-form-buttons');actions.style.gridColumn='1/-1';form.append(actions);
   const add=invButton('Add stock line',addLine),save=invButton('Save draft for manager',()=>void create(),'suite-primary');actions.append(add,save);
   const docs=h('div'),movements=h('div');w.list.append(h('h4','Documents awaiting approval / history'),docs,h('h4','Stock control movement audit'),movements);
   let products=[];const lines=[];
   function addLine(){if(!products.length){w.message('Link the Group Hub catalogue to this branch first.');return;}
     const row=h('div',undefined,'suite-master-actions');const item=invSelect(row,'Stock item',products,x=>x.stock_id,x=>x.code+' · '+x.name+' (current '+invQty(x.qty_milli)+')');
     const qty=invField(row,type.value==='ADJUSTMENT'?'Change (+ or −)':'Physical count','number',type.value==='ADJUSTMENT'?'1':'0');qty.min=type.value==='ADJUSTMENT'?'-1000000':'0';
     const entry={row,item,qty};row.append(invButton('Remove',()=>{row.remove();lines.splice(lines.indexOf(entry),1);}));lines.push(entry);lineArea.append(row);
   }
   function updateMode(){for(const l of lines){l.qty.parentNode.querySelector('span').textContent=type.value==='ADJUSTMENT'?'Change (+ or −)':'Physical count';l.qty.min=type.value==='ADJUSTMENT'?'-1000000':'0';}
     save.disabled=!(type.value==='ADJUSTMENT'?inventoryPermissions.transfer:inventoryPermissions.count);}
   type.addEventListener('change',updateMode);
   async function create(){save.disabled=true;w.message('');try{
     const entries=lines.map(l=>{
       const n=Number(l.qty.value);if(!Number.isFinite(n)||Math.abs(n)>1000000||Math.abs(n*1000-Math.round(n*1000))>0.000001||
         (type.value==='ADJUSTMENT'&&n===0)||(type.value!=='ADJUSTMENT'&&n<0))throw Error('Invalid stock quantity (maximum three decimals).');
       return type.value==='ADJUSTMENT'?{stock_id:Number(l.item.value),delta_milli:Math.round(n*1000)}:{stock_id:Number(l.item.value),counted_milli:Math.round(n*1000)};
     });
     const data=await invPost('/api/stock-control',{branch,doc_type:type.value,reason:reason.value,lines:entries});
     if(w.valid()){w.message('Draft '+data.document.number+' saved. A DIFFERENT manager must approve before stock changes.',true);await loadDocs();}
   }catch(e){if(w.valid())w.message(e.message);}finally{updateMode();}}
   async function act(doc,action){if(!window.confirm(action+' '+doc.number+'?'+(action==='POST'?' This will change stock quantities.':'')))return;
     try{const data=await invPost('/api/stock-control/action',{branch,id:doc.id,version:doc.version,action});
       if(w.valid()){w.message(data.document.number+' '+data.document.status+'.',true);await loadDocs();await loadItems();}}
     catch(e){if(w.valid())w.message(e.message);}}
   async function loadItems(){try{const data=await api('/api/inventory?branch='+encodeURIComponent(branch)+'&q='+encodeURIComponent(lookup.value.trim()));if(!w.valid())return;products=data.items;
     if(!lines.length)addLine();}catch(e){if(w.valid())w.message(e.message);}}
   async function loadDocs(){try{const data=await api('/api/stock-control?branch='+encodeURIComponent(branch));if(!w.valid())return;
     invTable(docs,['Document','Type / reason','Status','Counted / adjusted items','Creator','Actions'],data.documents.map(d=>{
       const buttons=h('div',undefined,'suite-master-actions');if(inventoryPermissions.approveTransfer&&d.status==='DRAFT'){
         buttons.append(invButton('Approve & post',()=>void act(d,'POST')),invButton('Cancel',()=>void act(d,'CANCEL')));}
       return [d.number,d.doc_type+' · '+d.reason,d.status,d.lines.map(l=>l.code+' '+(d.doc_type==='ADJUSTMENT'?(l.delta_milli>0?'+':'')+invQty(l.delta_milli):'count '+invQty(l.counted_milli)+' / prior '+invQty(l.expected_qty_milli))).join('; '),d.created_by_email,buttons];
     }));
     invTable(movements,['Date','Stock','Type','Change','Approver'],data.movements.map(m=>[showDate(m.created_at),m.code,m.movement_type,(m.quantity_delta_milli>0?'+':'')+invQty(m.quantity_delta_milli),m.actor_email]));
   }catch(e){if(w.valid())w.message(e.message);}}
   if(!inventoryPermissions.count&&!inventoryPermissions.transfer)w.form.hidden=true;
   updateMode();void loadItems();void loadDocs();
 }
 function suiteStockReport(mode){
   const label={valuation:'Indicative Stock Valuation',reorder:'Re-Order Report',transactions:'Stock Movement Register',categories:'Hub Stock Categories',units:'Units & Barcodes',master:'Stock Master Report'}[mode]||'Stock Report';
   const w=invWorkspace(label,'Branch-scoped operational report using linked Group Hub stock and posted POS quantities. Valuations use stored indicative cost prices and are NOT accounting balances.');w.form.hidden=true;
   let reportPage=1;const refresh=invButton('Refresh',()=>void load(),'suite-primary'),table=h('div'),pager=h('div',undefined,'suite-master-actions');
   const prev=invButton('Previous',()=>{if(reportPage>1){reportPage--;void load();}}),next=invButton('Next',()=>{reportPage++;void load();});pager.append(prev,next);w.list.append(refresh,table,pager);
   async function load(){try{const data=await api('/api/inventory?branch='+encodeURIComponent(branch)+'&page='+reportPage);if(!w.valid())return;
     const items=data.items;prev.disabled=reportPage<=1;next.disabled=reportPage>=data.pages;pager.hidden=mode==='transactions'||data.pages<=1;
     if(mode==='transactions')invTable(table,['Date','Stock','Type','Document','Quantity','User'],data.movements.map(m=>[showDate(m.created_at),m.code,m.movement_type,m.document_id,(m.quantity_delta_milli>0?'+':'')+invQty(m.quantity_delta_milli),m.actor_email]));
     else if(mode==='reorder')invTable(table,['Code','Description','On-hand','Minimum','To reorder'],items.filter(i=>i.reorder_min>0&&i.qty_milli<i.reorder_min*1000).map(i=>[i.code,i.name,invQty(i.qty_milli),i.reorder_min,invQty(i.reorder_min*1000-i.qty_milli)]));
     else if(mode==='valuation')invTable(table,['Code','Description','On-hand','Indicative unit cost','Indicative stock value'],items.map(i=>[i.code,i.name,invQty(i.qty_milli),i.cost_cents>0?money(i.cost_cents):'Not set',i.cost_cents>0?money(Math.round(i.qty_milli*i.cost_cents/1000)):'Not valued']));
     else if(mode==='categories')invTable(table,['Code','Description','Hub category'],items.map(i=>[i.code,i.name,i.category||'Uncategorised']));
     else if(mode==='units')invTable(table,['Code','Description','Unit','Barcode'],items.map(i=>[i.code,i.name,i.unit||'each',i.barcode||'—']));
     else invTable(table,['Code','Description','Category','Unit','On-hand','Min. stock'],items.map(i=>[i.code,i.name,i.category||'—',i.unit||'each',invQty(i.qty_milli),i.reorder_min]));
   }catch(e){if(w.valid())w.message(e.message);}}
   void load();
 }
 function suiteTransfers(){
   const w=invWorkspace('Stock Transfers','Create at source → independent manager sends (deducts stock) → destination independently receives (adds stock).');
   const controls=h('div',undefined,'suite-master-form');w.form.append(h('h4','New inter-branch transfer'),controls);
   const dest=invSelect(controls,'Destination branch',[],x=>x,x=>x);const notes=invField(controls,'Transfer notes');
   const stockSearch=invField(controls,'Find stock code / description','search');const stockFind=invButton('Search stock',()=>void loadInventory(),'secondary');controls.append(stockFind);
   const linesArea=h('div');linesArea.style.gridColumn='1/-1';controls.append(linesArea);const lines=[];let products=[];
   function addLine(){if(!products.length){w.message('No active stock items.');return;}
     const row=h('div',undefined,'suite-master-actions');const item=invSelect(row,'Stock item',products,x=>x.stock_id,x=>x.code+' · '+x.name+' · Available '+invQty(x.qty_milli));
     const qty=invField(row,'Transfer qty','number','1');const entry={item,qty,row};row.append(invButton('Remove',()=>{row.remove();lines.splice(lines.indexOf(entry),1);}));lines.push(entry);linesArea.append(row);
   }
   const add=invButton('Add line',addLine),save=invButton('Create transfer',()=>void create(),'suite-primary');controls.append(add,save);
   const table=h('div');w.list.append(h('h4','Outgoing and incoming transfers'),table);
   async function loadInventory(){
     try{const data=await api('/api/inventory?branch='+encodeURIComponent(branch)+'&q='+encodeURIComponent(stockSearch.value.trim()));if(!w.valid())return;
       products=data.items;dest.replaceChildren();for(const name of data.destinations||[]){if(name.toLowerCase()===branch.toLowerCase())continue;const o=h('option',name);o.value=name;dest.append(o);}if(!lines.length)addLine();
     }catch(e){w.message(e.message);}
   }
   async function create(){save.disabled=true;w.message('');try{
     const body={source_branch:branch,destination_branch:dest.value,notes:notes.value,lines:lines.map(l=>({stock_id:Number(l.item.value),qty_milli:invNum(l.qty.value,'transfer quantity')}))};
     const data=await invPost('/api/transfers',body);if(w.valid()){w.message('Created '+data.transfer.number+' as draft. A different manager must send it.',true);await loadTransfers();}
   }catch(e){w.message(e.message);}finally{save.disabled=false;}}
   async function doAction(t,action){if(!window.confirm(action+' '+t.number+'?'+(action==='SEND'?' This deducts stock at the source.':action==='RECEIVE'?' This adds stock at the destination.':'')))return;
     const actionBranch=action==='RECEIVE'?t.destination_branch:t.source_branch;
     try{const r=await invPost('/api/transfers/action',{id:t.id,version:t.version,branch:actionBranch,action});
       if(w.valid()){w.message(r.transfer.number+' is now '+r.transfer.status+'.',true);await loadTransfers();}
     }catch(e){w.message(e.message);}
   }
   async function loadTransfers(){
     try{const data=await api('/api/transfers?branch='+encodeURIComponent(branch));if(!w.valid())return;
       invTable(table,['Transfer','From → To','Status','Items','Actions'],data.transfers.map(t=>{
         const buttons=h('div',undefined,'suite-master-actions');
         if(t.source_branch.toLowerCase()===branch.toLowerCase()&&inventoryPermissions.approveTransfer&&t.status==='DRAFT')buttons.append(invButton('Send',()=>void doAction(t,'SEND')),invButton('Cancel',()=>void doAction(t,'CANCEL')));
         if(t.destination_branch.toLowerCase()===branch.toLowerCase()&&inventoryPermissions.count&&t.status==='IN_TRANSIT')buttons.append(invButton('Receive',()=>void doAction(t,'RECEIVE')));
         return [t.number,t.source_branch+' → '+t.destination_branch,t.status,t.lines.map(l=>l.code+' × '+invQty(l.qty_milli)).join('; '),buttons];
       }));
     }catch(e){if(w.valid())w.message(e.message);}
   }
   if(!inventoryPermissions.transfer)w.form.hidden=true;
   void loadInventory();void loadTransfers();
 }

 // Phase 18: supplier invoice capture + independent three-way verification only.
 // This screen NEVER creates a creditor balance, tax claim, payment or GL journal.
 function suiteSupplierInvoices(){
   const w=invWorkspace('Supplier Invoices — Three-Way Match','Match approved PO + posted GRV + supplier invoice. VERIFIED means checked only; no AP/VAT/GL posting.');
   const controls=h('div',undefined,'suite-master-form');w.form.append(h('h4','Capture supplier invoice'),controls);
   const poSelect=invSelect(controls,'Approved purchase order',[],x=>x.id,x=>x.number+' · '+x.supplier_name);
   const invoiceNumber=invField(controls,'Supplier invoice number');const invoiceDate=invField(controls,'Invoice date','date',new Date().toISOString().slice(0,10));
   const vat=invField(controls,'Declared VAT (R)','number','0');vat.step='0.01';
   const total=invField(controls,'Supplier invoice total incl VAT (R)','number','0');total.step='0.01';
   const linesArea=h('div');linesArea.style.gridColumn='1/-1';controls.append(linesArea);
   const submit=invButton('Capture and match invoice',()=>void capture(),'suite-primary');controls.append(submit);
   const table=h('div');w.list.append(h('h4','Supplier invoice matching register'),table);
   let orders=[];
   function selectedOrder(){return orders.find(p=>p.id===Number(poSelect.value));}
   function drawLines(){linesArea.replaceChildren();const po=selectedOrder();if(!po)return;
     linesArea.append(h('p','Approved PO '+po.number+' · '+po.supplier_name+' · Enter invoiced quantities and unit costs. Quantities must be covered by posted GRVs.','muted'));
     for(const line of po.lines){const row=h('div',undefined,'suite-master-actions');row.append(h('strong',line.stock_code+' · '+line.stock_name));
       const qty=invField(row,'Invoiced quantity','number',String(line.quantity_milli/1000));const cost=invField(row,'Unit cost (R)','number',(line.unit_cost_cents/100).toFixed(2));cost.step='0.01';
       row.dataset.stockId=String(line.stock_id);qty.dataset.invoiceQty='1';cost.dataset.invoiceCost='1';linesArea.append(row);}
   }
   poSelect.addEventListener('change',drawLines);
   async function capture(){submit.disabled=true;w.message('');try{
     const po=selectedOrder();if(!po)throw Error('Select an approved purchase order.');
     const lines=[];for(const row of linesArea.querySelectorAll('[data-stock-id]')){
       const qty=row.querySelector('[data-invoice-qty]');const cost=row.querySelector('[data-invoice-cost]');
       if(!qty||!cost)continue;const n=Number(qty.value);if(n===0)continue;
       lines.push({stock_id:Number(row.dataset.stockId),qty_milli:invNum(qty.value,'invoiced quantity'),unit_cost_cents:invMoney(cost.value)});
     }
     if(!lines.length)throw Error('Enter at least one invoice line.');
     const v=Number(vat.value);if(!Number.isFinite(v)||v<0||Math.abs(v*100-Math.round(v*100))>0.00001)throw Error('Invalid declared VAT.');
     const result=await invPost('/api/supplier-invoices',{branch,po_id:po.id,invoice_number:invoiceNumber.value,invoice_date:invoiceDate.value,
       declared_vat_cents:Math.round(v*100),invoice_total_cents:Math.round(Number(total.value)*100),lines});
     if(w.valid()){w.message(result.invoice.number+' captured: '+result.invoice.status+'. No creditor/VAT/GL posting occurred.',true);await load();}
   }catch(e){w.message(e.message);}finally{submit.disabled=false;}}
   async function act(invoice,action){if(!window.confirm(action+' '+invoice.number+'? This does not post accounting.'))return;
     try{const result=await invPost('/api/supplier-invoices/action',{branch,id:invoice.id,version:invoice.version,action});
       if(w.valid()){w.message(result.invoice.number+' → '+result.invoice.status+'.',true);await load();}}
     catch(e){w.message(e.message);}}
   async function load(){try{
     const [poData,invData]=await Promise.all([api('/api/purchase-orders?branch='+encodeURIComponent(branch)),api('/api/supplier-invoices?branch='+encodeURIComponent(branch))]);
     if(!w.valid())return;
     orders=poData.orders.filter(p=>p.status==='APPROVED');poSelect.replaceChildren();for(const po of orders){const opt=h('option',po.number+' · '+po.supplier_name);opt.value=String(po.id);poSelect.append(opt);}drawLines();
     invTable(table,['Invoice','Supplier / PO','Status','Net / VAT / Total','Exceptions','Actions'],invData.invoices.map(i=>{
       const actions=h('div',undefined,'suite-master-actions');
       if(supplierInvoicePermissions.capture&&i.status==='EXCEPTION')actions.append(invButton('Recheck',()=>void act(i,'RECHECK')));
       if(supplierInvoicePermissions.verify&&i.status==='MATCHED')actions.append(invButton('Verify independently',()=>void act(i,'VERIFY')));
       if(supplierInvoicePermissions.capture&&['MATCHED','EXCEPTION'].includes(i.status))actions.append(invButton('Cancel',()=>void act(i,'CANCEL')));
       return [i.invoice_number,i.supplier_name+' / PO-'+String(i.po_id).padStart(6,'0'),i.status,
         money(i.net_cents)+' / '+money(i.declared_vat_cents)+' / '+money(i.gross_cents),i.exceptions.join(' '),actions];
     }));
   }catch(e){if(w.valid())w.message(e.message);}}
   if(!supplierInvoicePermissions.capture)w.form.hidden=true;
   if(!supplierInvoicePermissions.read){w.message('Supplier invoice access denied.');return;}
   void load();
 }

 function isConnectedSuiteAction(id,item){
   if(id==='stock')return ['Stock Master','Purchase Orders','Goods Received Vouchers (GRV)','Stock Transfers','Stock Adjustments','Stock Take','Daily Stock Count','Opening Stock Count','Onhands','Stock Valuations','Re-Order','Transactions','Master','Categories','Units','Barcodes','Minimum / Maximum Stock Levels','Audits'].includes(item);
   if(id==='suppliers')return ['Suppliers','Purchase Orders','Invoices and Debit Notes','Audits'].includes(item);
   if(id==='debtors')return ['Debtors','Audits'].includes(item);
   if(id==='system')return ['User Permissions','Branch Access'].includes(item);
   return false;
 }
 function suiteModuleView(id){
   const root=E('app-content');const name=SUITE_TITLES[id]||({tills:'Tills',cashoffice:'Cash Office'}[id])||'Module';
   const isSeparate=['tills','cashoffice','dispatching'].includes(id);
   root.append(h('div',isSeparate?'This area is managed by a separate secure department application. Use its approved login and URL for live transactions; these reference menus do not bypass access controls.':['stock','suppliers','debtors'].includes(id)?'Hub-linked stock master, purchasing and controlled stock operations are connected. Financial posting is not yet enabled.':'Only connected operations can be opened. Unimplemented menu entries are disabled rather than opening misleading screens.','suite-menu-intro'));
   const menu=SUITE_MENU_TREE[id]||{};const grid=h('div',undefined,'suite-menu-grid');
   for(const [section,items] of Object.entries(menu)){
     const card=h('section',undefined,'suite-menu-card');card.append(h('h3',section));const list=h('div',undefined,'suite-menu-list');
     for(const item of items){
       const b=h('button',item,'suite-menu-action');b.type='button';
       if(!isConnectedSuiteAction(id,item)){
         b.disabled=true;b.title='Not implemented. Disabled to prevent a misleading transaction.';
         b.setAttribute('aria-label',item+' — not available');list.append(b);continue;
       }
       b.addEventListener('click',()=>{
         if(id==='system'&&['User Permissions','Branch Access'].includes(item)){window.location.assign(MEMBER_TEAM_URL);return;}
         const masterKind=id==='stock'&&item==='Stock Master'?'stock':id==='suppliers'&&item==='Suppliers'?'supplier':id==='debtors'&&item==='Debtors'?'debtor':null;
         if(masterKind){suiteMasterView(masterKind);return;}
         if(item==='Purchase Orders'&&(id==='stock'||id==='suppliers')){suitePurchaseOrders();return;}
         if(id==='suppliers'&&item==='Invoices and Debit Notes'){suiteSupplierInvoices();return;}
         if(id==='stock'&&item==='Goods Received Vouchers (GRV)'){suiteReceiving();return;}
         if(id==='stock'&&item==='Stock Transfers'){suiteTransfers();return;}
         if(id==='stock'&&item==='Onhands'){suiteStockBalances();return;}
         if(id==='stock'&&item==='Stock Adjustments'){suiteStockControl('ADJUSTMENT');return;}
         if(id==='stock'&&item==='Stock Take'){suiteStockControl('STOCKTAKE');return;}
         if(id==='stock'&&item==='Daily Stock Count'){suiteStockControl('STOCKTAKE');return;}
         if(id==='stock'&&item==='Opening Stock Count'){suiteStockControl('OPENING');return;}
         if(id==='stock'&&item==='Stock Valuations'){suiteStockReport('valuation');return;}
         if(id==='stock'&&item==='Re-Order'){suiteStockReport('reorder');return;}
         if(id==='stock'&&item==='Transactions'){suiteStockReport('transactions');return;}
         if(id==='stock'&&item==='Master'){suiteStockReport('master');return;}
         if(id==='stock'&&item==='Categories'){suiteStockReport('categories');return;}
         if(id==='stock'&&['Units','Barcodes'].includes(item)){suiteStockReport('units');return;}
         if(id==='stock'&&item==='Minimum / Maximum Stock Levels'){suiteMasterView('stock');return;}
         if(item==='Audits'&&['stock','suppliers','debtors'].includes(id)){suiteMasterView(id==='suppliers'?'supplier':id==='debtors'?'debtor':'stock',true);return;}
         const detail=E('suite-feature-detail');detail.className='suite-feature-detail';detail.replaceChildren();
         detail.append(h('strong',name+'  /  '+section+'  /  '+item));
         detail.append(h('p',isSeparate?'Open the authorised department workstation for operational access. This suite menu is a reference only.':'This menu has no configured action. Contact the system administrator.'));
         detail.hidden=false;detail.scrollIntoView({block:'nearest',behavior:'smooth'});
       });list.append(b);
     }
     card.append(list);grid.append(card);
   }
   root.append(grid);const detail=h('section',undefined,'suite-feature-detail');detail.id='suite-feature-detail';detail.hidden=true;root.append(detail);
 }
 function updateSuiteUI(){
   if(APP!=='pos')return;
   const title=suiteView==='home'?'Maliks Professional':SUITE_TITLES[suiteView]||({tills:'Tills',cashoffice:'Cash Office'}[suiteView])||'Maliks Professional';
   E('screen-heading').textContent=title;
   E('workstation-notice').hidden=true;E('workstation-tag').hidden=true;
   for(const b of document.querySelectorAll('[data-suite-module]')){
     if(b.classList.contains('suite-nav-button'))b.setAttribute('aria-pressed',String(b.dataset.suiteModule===suiteView));
   }
 }
 function setSuiteView(id){
   if(APP!=='pos')return;
   if(id==='lock'||id==='exit'){
     void api('/api/auth/logout',{method:'POST',headers:{'content-type':'application/json'},body:'{}'}).finally(()=>window.location.assign('/'));return;
   }
   if(!['home',...Object.keys(SUITE_MENU_TREE)].includes(id))return;
   suiteView=id;draw();window.scrollTo({top:0,behavior:'auto'});
 }
 function teamView(){
   const root=E('app-content');
   const main=panel('Employees and store access');
   main.append(h('p','Add staff to their correct branch, or deactivate staff who have left. Deactivation blocks Maliks department API access immediately.','muted'));
   const toolbar=h('div',undefined,'bar');const refresh=h('button','Refresh employees','secondary');
   refresh.addEventListener('click',()=>void loadTeam());toolbar.append(refresh);main.append(toolbar);
   if(currentUserRole==='Owner / Admin'||currentUserRole==='Developer / Technical Admin'){
     const admin=panel('Set my administrator password');
     admin.append(h('p','Use your own permanent password. Your current verified Cloudflare Access administrator identity is used; you cannot set another administrator account password.','muted'));
     const f=h('form');f.autocomplete='off';
     const pw=h('input');pw.type='password';pw.required=true;pw.minLength=14;pw.maxLength=128;pw.autocomplete='new-password';pw.placeholder='At least 14 characters';
     const confirm=h('input');confirm.type='password';confirm.required=true;confirm.minLength=14;confirm.maxLength=128;confirm.autocomplete='new-password';confirm.placeholder='Repeat your password';
     const set=h('button','Set administrator password');set.type='submit';
     const status=h('p','','muted');status.setAttribute('role','status');
     f.append(h('label','New administrator password'),pw,h('label','Confirm administrator password'),confirm,set,status);
     f.addEventListener('submit',async event=>{
       event.preventDefault();err('');status.textContent='';
       if(pw.value!==confirm.value){err('The two passwords do not match.');return;}
       if(pw.value.length<14){err('Use a password of at least 14 characters.');return;}
       if(!window.confirm('Set or reset your administrator password? Existing employee-password sessions for your account will be revoked.'))return;
       set.disabled=true;
       try{
         const saved=await api('/api/auth/bootstrap',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({new_password:pw.value,confirm_password:confirm.value})});
         if(!saved.password_set)throw Error('Administrator password was not confirmed.');
         status.textContent='Administrator password saved for '+saved.employee+'. You can now sign in to Maliks POS Professional using this email and your chosen password.';
       }catch(ex){err(ex.message);}finally{pw.value='';confirm.value='';set.disabled=false;}
     });
     admin.append(f);main.append(admin);
   }
   const form=h('form');form.autocomplete='off';const fields=h('div',undefined,'bar');
   const field=(title,type)=>{const wrap=h('div');const lab=h('label',title);const inp=h('input');inp.type=type;inp.required=true;wrap.append(lab,inp);fields.append(wrap);return inp;};
   const name=field('Employee full name','text');name.maxLength=120;
   const email=field('Employee login email','email');email.maxLength=150;
   const roleWrap=h('div');roleWrap.append(h('label','Department role'));const role=h('select');roleWrap.append(role);fields.append(roleWrap);
   const save=h('button','Add employee');save.type='submit';form.append(fields,save);
   const credentialNotice=h('section',undefined,'panel');credentialNotice.hidden=true;main.append(credentialNotice);
   function showTemporaryPassword(data){
     credentialNotice.hidden=false;credentialNotice.replaceChildren(h('h3','Temporary login password — copy now'),
       h('p','Employee: '+data.employee),h('p','This password is shown once. The employee must change it at first sign-in. Do not send it in a public group.'));
     const pre=h('pre',data.temporary_password);credentialNotice.append(pre);
     const copy=h('button','Copy temporary password','secondary');copy.type='button';copy.addEventListener('click',()=>void navigator.clipboard.writeText(data.temporary_password));credentialNotice.append(copy);
   }
   async function issuePassword(person){
     const data=await api('/api/team/password-reset',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({branch,member_id:person.id,request_id:crypto.randomUUID()})});
     showTemporaryPassword(data);
   }
   form.addEventListener('submit',async e=>{
     e.preventDefault();if(!window.confirm('Add '+name.value+' to '+branch+' with '+role.value+' access?'))return;
     save.disabled=true;err('');
     try{const created=await api('/api/team/change',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'CREATE',branch,name:name.value,email:email.value,role:role.value,request_id:crypto.randomUUID()})});
       name.value='';email.value='';await loadTeam();
       try{await issuePassword({id:created.member_id});}catch(ex){err('Employee created, but password was not issued: '+ex.message+' Use Issue password below.');}}
     catch(ex){err(ex.message);}finally{save.disabled=false;}
   });main.append(form);
   const status=h('p','Loading employees…','muted');status.id='team-status';main.append(status);
   const list=h('div');list.id='team-list';main.append(list);
   const audit=h('div');audit.id='team-audit';main.append(audit);root.append(main);
   async function loadTeam(){
     const selected=branch;status.textContent='Loading employees…';
     try{const data=await api('/api/team?branch='+encodeURIComponent(selected));if(branch!==selected||!E('team-list'))return;
       role.replaceChildren();for(const r of data.can_assign_roles||[]){const o=h('option',r);o.value=r;role.append(o);}
       list.replaceChildren();const tbl=h('table');const head=h('tr');for(const title of ['Name','Email','Role','Status','Action'])cell(head,title,'th');tbl.append(head);
       for(const person of data.staff||[]){const row=h('tr');
         for(const value of [person.name,person.email,person.role,person.active?'Active':'Inactive'])cell(row,value);
         const action=h('td');
         if(person.active&&person.email.toLowerCase()!==currentUserEmail){
           const b=h('button','Deactivate','secondary small-btn');b.addEventListener('click',()=>void changeStatus(person,'DEACTIVATE',b));action.append(b);
         }else if(!person.active&&data.can_reactivate){
           const b=h('button','Reactivate','secondary small-btn');b.addEventListener('click',()=>void changeStatus(person,'REACTIVATE',b));action.append(b);
         }
         if(person.active&&(data.can_reactivate||(data.can_assign_roles||[]).includes(person.role))){
           const pw=h('button','Issue password','secondary small-btn');pw.type='button';pw.addEventListener('click',async()=>{
             if(!window.confirm('Issue a NEW temporary password for '+person.name+'? Existing sessions will be revoked.'))return;
             pw.disabled=true;err('');try{await issuePassword(person);}catch(ex){err(ex.message);}finally{pw.disabled=false;}
           });action.append(pw);
         }
         row.append(action);tbl.append(row);
       }
       const scroll=h('div',undefined,'scroll');scroll.append(tbl);list.append(scroll);
       status.textContent=String((data.staff||[]).length)+' employee records · '+selected;
       audit.replaceChildren(h('h3','Recent staff access changes'));
       const a=h('ul');for(const event of data.audit||[])a.append(h('li',event.action+' · '+event.member_email+' · '+event.actor_email+' · '+showDate(event.created_at)));
       audit.append(a);
     }catch(ex){status.textContent='Could not load employees';err(ex.message);}
   }
   async function changeStatus(person,action,btn){
     if(!window.confirm((action==='DEACTIVATE'?'Remove access for ':'Reactivate ')+person.name+' at '+branch+'?'))return;
     btn.disabled=true;err('');try{
       await api('/api/team/change',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action,branch,member_id:person.id,request_id:crypto.randomUUID()})});
       await loadTeam();
     }catch(ex){err(ex.message);btn.disabled=false;}
   }
   void loadTeam();
 }
 function draw(){
   E('app-content').replaceChildren();err('');
   if(APP==='pos'){
     if(suiteView==='home')suiteHome();else suiteModuleView(suiteView);
     updateSuiteUI();
   }else if(APP==='member')teamView();else if(APP==='sales')posView();else if(APP==='dispatch')dispatchView();else void quoteView();
 }


 function signInView(){
   E('branch-panel').hidden=true;E('signed-in').textContent='Employee sign in';E('access').textContent='Not signed in';
   const root=E('app-content');root.replaceChildren();const p=panel('Sign in to '+(APP==='member'?'Maliks Member Team':APP==='sales'?'Maliks Sales':APP==='pos'?'Maliks POS Professional':'Maliks '+APP));p.classList.add('login-panel');const logo=h('img');logo.src='/powerbuild-logo.png';logo.alt='PowerBuild';logo.className='login-logo';p.prepend(logo);
   p.append(h('p','Enter the email and password issued by your store manager.','muted'));
   const f=h('form');f.autocomplete='on';const email=h('input');email.type='email';email.autocomplete='username';email.required=true;email.placeholder='Employee email';
   const pw=h('input');pw.type='password';pw.autocomplete='current-password';pw.required=true;pw.placeholder='Password';
   const btn=h('button','Sign in');btn.type='submit';const notice=h('p','','muted');
   f.append(h('label','Email address'),email,h('label','Password'),pw,btn,notice);
   f.addEventListener('submit',async event=>{event.preventDefault();btn.disabled=true;notice.textContent='Signing in…';err('');
     try{await api('/api/auth/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:email.value,password:pw.value})});pw.value='';location.reload();}
     catch(ex){notice.textContent='';err(ex.message);}finally{btn.disabled=false;}
   });p.append(f);root.append(p);
 }
 function changePasswordView(){
   E('branch-panel').hidden=true;E('signed-in').textContent='Password change required';E('access').textContent='First login';
   const root=E('app-content');root.replaceChildren();const p=panel('Create your own password');p.classList.add('login-panel');
   p.append(h('p','Your temporary password must be changed before you can use any workstation. Choose at least 14 characters.','muted'));
   const f=h('form');const old=h('input');old.type='password';old.required=true;old.autocomplete='current-password';
   const next=h('input');next.type='password';next.required=true;next.minLength=14;next.autocomplete='new-password';
   const confirm=h('input');confirm.type='password';confirm.required=true;confirm.minLength=14;confirm.autocomplete='new-password';
   const btn=h('button','Save new password');btn.type='submit';f.append(h('label','Temporary password'),old,h('label','New password'),next,h('label','Confirm new password'),confirm,btn);
   f.addEventListener('submit',async event=>{event.preventDefault();err('');if(next.value!==confirm.value){err('Passwords do not match.');return;}
     btn.disabled=true;try{await api('/api/auth/change-password',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({current_password:old.value,new_password:next.value})});
       await api('/api/auth/logout',{method:'POST',headers:{'content-type':'application/json'},body:'{}'});location.reload();}
     catch(ex){err(ex.message);}finally{btn.disabled=false;}
   });p.append(f);root.append(p);
 }
 function addSignOut(){
   const parent=E('screen-heading').parentElement;const b=h('button','Sign out','secondary small-btn');b.type='button';b.addEventListener('click',async()=>{
     try{await api('/api/auth/logout',{method:'POST',headers:{'content-type':'application/json'},body:'{}'});}catch{}location.reload();
   });parent.append(b);
 }
 try{
   const session=await api('/api/session');
   if(session.password_change_required){changePasswordView();}
   else{
     masterPermissions=session.master_permissions||{};purchasePermissions=session.purchase_permissions||{};inventoryPermissions=session.inventory_permissions||{};supplierInvoicePermissions=session.supplier_invoice_permissions||{};currentUserEmail=String(session.user.email||'').toLowerCase();currentUserRole=session.user.role;E('signed-in').textContent=APP==='sales'?session.user.name:session.user.name+' · '+session.user.role;
     E('access').textContent=APP==='sales'?session.branches.join(', '):session.branches.length+' assigned branch(es)'+(['pos','member'].includes(APP)?'':session.live_payment?' · Payment pilot ENABLED':' · Payment pilot DISABLED');const select=E('branch');select.replaceChildren();
     for(const b of session.branches){const o=h('option',b);o.value=b;select.append(o);}select.disabled=APP==='sales'&&session.branches.length===1;branch=select.value;select.addEventListener('change',selectBranch);
     if(APP==='sales'){E('workstation-notice').hidden=true;E('workstation-tag').hidden=true;const label=document.querySelector('label[for=branch]');if(label)label.textContent='Store';}
     if(APP==='pos'){
       E('suite-user').textContent=session.user.name+' · '+session.user.role;
       for(const btn of E('suite-navigation').querySelectorAll('[data-suite-module]'))btn.addEventListener('click',()=>setSuiteView(btn.dataset.suiteModule));
       E('suite-navigation').hidden=false;
     }
     addSignOut();draw();
   }
 }catch(e){if(e.status===401){signInView();}else{E('signed-in').textContent='Access unavailable';E('access').textContent='Not authorised';err(e.message+' Contact your Hub administrator to verify department role and branch assignment.');}}
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
     '/api/till-shifts':'/v1/till-shifts','/api/till-shifts/open':'/v1/till-shifts/open','/api/till-shifts/close':'/v1/till-shifts/close','/api/till-reviews':'/v1/till-reviews','/api/tender-preparations':'/v1/tender-preparations','/api/cashup-preview':'/v1/cashup-preview',
     '/api/payment-evidence':'/v1/payment-evidence','/api/payment-evidence/history':'/v1/payment-evidence/history','/api/payments':'/v1/payments','/api/payments/quick-confirm':'/v1/payments/quick-confirm','/api/payments/verify':'/v1/payments/verify','/api/invoices':'/v1/invoices','/api/dispatch-jobs':'/v1/dispatch-jobs','/api/dispatch-jobs/action':'/v1/dispatch-jobs/action',
     '/api/master/records':'/v1/master/records','/api/master/audit':'/v1/master/audit','/api/master/catalogue':'/v1/master/catalogue','/api/master/catalogue/sync':'/v1/master/catalogue/sync',
     '/api/purchase-orders':'/v1/purchase-orders','/api/purchase-orders/action':'/v1/purchase-orders/action','/api/purchase-orders/audit':'/v1/purchase-orders/audit',
     '/api/stock-control':'/v1/stock-control','/api/stock-control/action':'/v1/stock-control/action',
     '/api/inventory':'/v1/inventory','/api/receipts':'/v1/receipts','/api/receipts/action':'/v1/receipts/action','/api/transfers':'/v1/transfers','/api/transfers/action':'/v1/transfers/action','/api/supplier-invoices':'/v1/supplier-invoices','/api/supplier-invoices/action':'/v1/supplier-invoices/action',
     '/api/team':'/v1/team','/api/team/change':'/v1/team/change','/api/team/password-reset':'/v1/team/password-reset',
     '/api/auth/login':'/v1/auth/login','/api/auth/logout':'/v1/auth/logout','/api/auth/change-password':'/v1/auth/change-password','/api/auth/bootstrap':'/v1/auth/bootstrap'};
   const path=pathMap[url.pathname];
   if(!path)return Response.json({error:'Unknown API.'},{status:404});
   if(!['GET','POST'].includes(req.method))return Response.json({error:'Method not allowed.'},{status:405});
   if((path==='/v1/team'&&req.method!=='GET')||(['/v1/team/change','/v1/team/password-reset','/v1/auth/login','/v1/auth/logout','/v1/auth/change-password','/v1/auth/bootstrap'].includes(path)&&req.method!=='POST'))return Response.json({error:'Method not allowed.'},{status:405});
   if(req.method==='POST' && !['/api/quotes','/api/till-shifts/open','/api/till-shifts/close','/api/till-reviews','/api/tender-preparations','/api/payment-evidence','/api/payments','/api/payments/quick-confirm','/api/payments/verify','/api/dispatch-jobs/action','/api/master/records','/api/master/catalogue/sync','/api/purchase-orders','/api/purchase-orders/action','/api/receipts','/api/receipts/action','/api/stock-control','/api/stock-control/action','/api/transfers','/api/transfers/action','/api/supplier-invoices','/api/supplier-invoices/action','/api/team/change','/api/team/password-reset','/api/auth/login','/api/auth/logout','/api/auth/change-password','/api/auth/bootstrap'].includes(url.pathname))return Response.json({error:'Method not allowed.'},{status:405});
   // The Professional suite cannot submit Sales transactions through its old POS origin.
   if(kind==='pos' && path!=='/v1/session' && !path.startsWith('/v1/auth/') && !path.startsWith('/v1/master/') && !path.startsWith('/v1/purchase-orders') && !['/v1/inventory','/v1/stock-control','/v1/stock-control/action','/v1/receipts','/v1/receipts/action','/v1/transfers','/v1/transfers/action','/v1/supplier-invoices','/v1/supplier-invoices/action'].includes(path))return Response.json({error:'This function belongs to a separate secured application.'},{status:403});
   if(kind==='pos' && path==='/v1/master/catalogue' && req.method!=='GET')return Response.json({error:'Read-only catalogue lookup.'},{status:405});
   // The Member Team Worker is isolated from POS, payments and sales.
   if(kind==='member' && !['/v1/session','/v1/team','/v1/team/change','/v1/team/password-reset','/v1/auth/login','/v1/auth/logout','/v1/auth/change-password','/v1/auth/bootstrap'].includes(path))return Response.json({error:'Team app only.'},{status:403});
   if(kind!=='member' && path.startsWith('/v1/team'))return Response.json({error:'Team app only.'},{status:403});
   // The dedicated Sales Worker may only access the quotation/catalogue APIs.
   if(kind==='sales' && !['/v1/session','/v1/catalogue','/v1/quotes','/v1/quotes/find','/v1/auth/login','/v1/auth/logout','/v1/auth/change-password','/v1/auth/bootstrap'].includes(path))return Response.json({error:'Department access denied.'},{status:403});
   // Department rules enforced here as an early deny and again by the private Core.
   if((url.pathname.startsWith('/api/dispatch-jobs') && kind!=='dispatch') ||
      (url.pathname==='/api/payments/verify' && kind!=='cashoffice') ||
      (url.pathname==='/api/payments/quick-confirm' && kind!=='tills') ||
      (url.pathname==='/api/payments' && !['tills','cashoffice'].includes(kind)) ||
      (url.pathname==='/api/payments' && req.method==='POST' && kind!=='tills') ||
      (url.pathname==='/api/invoices' && !['tills','cashoffice','dispatch'].includes(kind)) ||
      (url.pathname==='/api/till-reviews' && kind!=='cashoffice') ||
      (url.pathname.startsWith('/api/payment-evidence') && kind!=='cashoffice') ||
      (url.pathname==='/api/cashup-preview' && kind!=='cashoffice') ||
      (url.pathname==='/api/tender-preparations' && !['tills','cashoffice'].includes(kind)) ||
      (url.pathname==='/api/tender-preparations' && req.method==='POST' && kind!=='tills') ||
      (url.pathname.startsWith('/api/till-shifts') && req.method==='POST' && kind!=='tills'))
      return Response.json({error:'Department access denied.'},{status:403});
   // No public CORS. Require same-origin for all browser-initiated writes.
   if(req.method==='POST' && req.headers.get('origin')!==url.origin)return Response.json({error:'Invalid request origin.'},{status:403});
   const token=req.headers.get('cf-access-jwt-assertion');
   const sessionToken=(req.headers.get('cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('__Host-maliks_session='))?.split('=')[1]||'';
   if(!token&&!sessionToken&&!['/v1/auth/login','/v1/auth/logout'].includes(path))return Response.json({error:'Employee sign in required.'},{status:401,headers:{'cache-control':'no-store'}});
   // Both public Workers use the existing verified POS Access audience. Core receives
   // 'pos' only for the dedicated Sales Worker, preserving its current Sales-only roles.
   const coreApp=kind==='sales'?'pos':kind==='pos'?'management':kind;
   const headers=new Headers({'x-maliks-app':coreApp,'x-maliks-original-origin':url.origin});
   if(token)headers.set('cf-access-jwt-assertion',token);
   if(sessionToken)headers.set('x-maliks-session',sessionToken);
   if(path==='/v1/auth/login')headers.set('x-maliks-client-ip',req.headers.get('cf-connecting-ip')||'unknown');
   if(req.method==='POST'){headers.set('content-type','application/json');headers.set('origin',url.origin);}
   const target=new URL('https://maliks-core.internal'+path+url.search);
   let response;
   try{response=await env.CORE.fetch(new Request(target,{method:req.method,headers,body:req.method==='POST'?req.body:undefined,duplex:req.method==='POST'?'half':undefined}));}
   catch(error){
     console.error('Maliks Core service binding failed:',String(error?.message||'Unknown error').slice(0,200));
     return Response.json({error:'Core service unavailable. Check the private Core Worker deployment and logs.'},{status:503,headers:{'cache-control':'no-store'}});
   }
   const h=new Headers({'cache-control':'no-store','x-content-type-options':'nosniff','content-type':'application/json'});
   if(path==='/v1/auth/login'&&response.ok){
     const data=await response.json();
     if(!/^[A-Za-z0-9_-]{43}$/.test(data.token||''))return Response.json({error:'Login service failed.'},{status:503});
     h.set('set-cookie','__Host-maliks_session='+data.token+'; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=28800');
     return Response.json({ok:true,password_change_required:!!data.password_change_required},{headers:h});
   }
   if(path==='/v1/auth/logout')h.set('set-cookie','__Host-maliks_session=; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=0');
   return new Response(response.body,{status:response.status,headers:h});
 }
};

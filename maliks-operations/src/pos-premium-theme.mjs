// Dashboard and POS preview theme. Only the approved palette is used:
// #0A2A3F navy, #D4A017 gold, white and neutral light greys.
export const POS_PREMIUM_CSS = String.raw`
.maliks-professional{
 --maliks-navy:#0A2A3F;--maliks-gold:#D4A017;--maliks-white:#FFFFFF;
 --maliks-bg:#F5F6F7;--maliks-line:#E3E5E7;--maliks-soft:#F0F2F3;
 background:var(--maliks-bg);color:var(--maliks-navy);font-family:Inter,'Segoe UI',Arial,sans-serif;
}
.maliks-professional .suite-header{background:var(--maliks-navy);box-shadow:0 5px 22px rgba(10,42,63,.12)}
.maliks-professional .suite-brandbar{background:var(--maliks-navy);padding:12px clamp(16px,3vw,42px);min-height:84px;gap:16px}
.maliks-professional .suite-brand{background:transparent;color:#FFFFFF;gap:14px}
.maliks-professional .suite-brand-logo{width:65px;height:65px;flex-basis:65px;filter:none;object-fit:contain}
.maliks-professional .suite-brand-text strong{font-size:25px;letter-spacing:.05em;color:#FFFFFF}
.maliks-professional .suite-brand-text strong span{color:#D4A017}
.maliks-professional .suite-brand-text small{color:#FFFFFF;font-size:9px;letter-spacing:.12em;opacity:.85}
.maliks-professional .suite-brand-text em{color:#D4A017;font-style:normal}
.maliks-professional .suite-system-status{color:#FFFFFF;font-size:11px;font-weight:800;letter-spacing:.1em;display:flex;align-items:center;gap:7px}
.maliks-professional .suite-secure-dot{width:8px;height:8px;border-radius:50%;background:#D4A017;flex-shrink:0}
.maliks-professional .suite-user{border:1px solid rgba(255,255,255,.21);color:#FFFFFF;background:rgba(255,255,255,.06);border-radius:11px;padding:11px 15px;font-weight:650}
.maliks-professional .suite-navbar{background:#0A2A3F;gap:0;padding:0 clamp(12px,2vw,32px);border-top:1px solid rgba(255,255,255,.13);scrollbar-color:#D4A017 #0A2A3F}
.maliks-professional .suite-nav-button{min-height:82px;min-width:92px;flex:1 0 auto;padding:10px 13px;background:transparent;border-radius:0;border-bottom:3px solid transparent;color:#FFFFFF;opacity:.82;gap:7px;font-size:11px;font-weight:650}
.maliks-professional .suite-nav-button:hover{background:rgba(255,255,255,.08);opacity:1}
.maliks-professional .suite-nav-button[aria-pressed="true"]{background:rgba(255,255,255,.09);opacity:1;border-bottom-color:#D4A017;color:#FFFFFF}
.maliks-professional .suite-nav-icon{width:25px;height:25px;color:#D4A017;display:flex;align-items:center;justify-content:center}
.maliks-professional .suite-nav-icon svg{width:24px;height:24px;display:block;stroke:#D4A017}
.maliks-professional .suite-nav-button:focus-visible,.maliks-professional button:focus-visible,.maliks-professional input:focus-visible{outline:3px solid #D4A017;outline-offset:2px}
.maliks-professional .suite-shell{background:var(--maliks-bg)}
.maliks-professional .suite-shell>main{max-width:1640px;padding:25px clamp(18px,2.8vw,42px) 65px}
.maliks-professional .suite-shell .top{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:13px;padding:0 0 9px;border-bottom:1px solid var(--maliks-line)}
.maliks-professional .suite-shell .top>div{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.maliks-professional .suite-shell .top h2{font-size:17px;color:#0A2A3F;letter-spacing:.01em;margin:0}
.maliks-professional .suite-shell .top .muted{font-size:11px;color:rgba(10,42,63,.7)}
.maliks-professional .suite-shell .top button{background:var(--maliks-soft);border:1px solid var(--maliks-line);color:#0A2A3F;padding:9px 14px}
.maliks-professional #branch-panel{border:1px solid var(--maliks-line);border-radius:13px;background:#FFFFFF;padding:8px 17px;margin-bottom:16px}
.maliks-professional #branch-panel .bar{margin:0;align-items:center;gap:15px}
.maliks-professional #branch-panel select{border-radius:9px;min-height:42px}
.maliks-professional .panel{background:#FFFFFF;border:1px solid var(--maliks-line);box-shadow:0 5px 18px rgba(10,42,63,.045);border-radius:16px}
.maliks-professional button{transition:background .13s,transform .13s,box-shadow .13s}
.maliks-professional .pos-content{display:grid;gap:19px}
.maliks-professional .pos-welcome{background:#0A2A3F;color:#FFFFFF;border-radius:18px;padding:30px clamp(23px,3vw,40px);display:flex;align-items:center;justify-content:space-between;gap:20px;box-shadow:0 12px 30px rgba(10,42,63,.11);position:relative;overflow:hidden;border-left:5px solid #D4A017}
.maliks-professional .pos-welcome:after{content:'';position:absolute;width:260px;height:260px;right:-100px;bottom:-140px;border:2px solid rgba(212,160,23,.23);border-radius:50%;pointer-events:none}
.maliks-professional .pos-eyebrow{font-size:11px;letter-spacing:.18em;font-weight:850;color:#D4A017;text-transform:uppercase}
.maliks-professional .pos-welcome h1{font-size:clamp(24px,2.7vw,38px);color:#FFFFFF;margin:8px 0 8px;line-height:1.15}
.maliks-professional .pos-welcome p{max-width:600px;font-size:13px;color:#FFFFFF;opacity:.85;margin:0}
.maliks-professional .pos-solid-action{display:inline-flex;align-items:center;justify-content:center;gap:9px;background:#D4A017!important;color:#0A2A3F!important;border:1px solid #D4A017!important;font-size:14px;font-weight:850;border-radius:12px;padding:16px 24px;min-height:54px;white-space:nowrap;box-shadow:0 6px 13px rgba(10,42,63,.15)}
.maliks-professional .pos-solid-action:hover{transform:translateY(-1px);box-shadow:0 9px 20px rgba(10,42,63,.17)}
.maliks-professional .pos-solid-action .pos-inline-icon,.maliks-professional .pos-solid-action .pos-inline-icon svg{color:#0A2A3F;stroke:#0A2A3F}
.maliks-professional .pos-inline-icon{width:20px;height:20px;flex:0 0 20px;display:inline-flex;align-items:center;justify-content:center;color:#D4A017}
.maliks-professional .pos-inline-icon svg{width:20px;height:20px;stroke:#D4A017}
.maliks-professional .pos-section-heading{display:flex;justify-content:space-between;align-items:center;gap:12px;margin:0 0 14px}
.maliks-professional .pos-section-heading h2{font-size:17px;color:#0A2A3F;margin:0;font-weight:850}
.maliks-professional .pos-section-heading span{font-size:12px;color:rgba(10,42,63,.7)}
.maliks-professional .pos-kpi-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:15px}
.maliks-professional .pos-kpi{background:#FFFFFF;border:1px solid var(--maliks-line);border-top:4px solid #D4A017;border-radius:15px;padding:20px 20px 17px;min-height:169px;box-shadow:0 4px 14px rgba(10,42,63,.045);display:flex;flex-direction:column;gap:7px;align-items:stretch;text-align:left;color:#0A2A3F}
.maliks-professional .pos-kpi-top{display:flex;justify-content:space-between;align-items:center;gap:12px}
.maliks-professional .pos-kpi-title{font-size:12px;font-weight:780;color:#0A2A3F}
.maliks-professional .pos-kpi-icon{width:40px;height:40px;border-radius:11px;background:#F0F2F3;display:flex;align-items:center;justify-content:center}
.maliks-professional .pos-kpi-icon svg{width:21px;height:21px;stroke:#D4A017}
.maliks-professional .pos-kpi-value{font-size:29px;font-weight:900;letter-spacing:-.025em;line-height:1.05}
.maliks-professional .pos-kpi-note{font-size:11px;color:rgba(10,42,63,.64);margin-top:auto}
.maliks-professional .pos-work-grid{display:grid;grid-template-columns:minmax(0,1.65fr) minmax(300px,.9fr);gap:18px}
.maliks-professional .pos-card{background:#FFFFFF;border:1px solid var(--maliks-line);border-radius:16px;padding:21px;box-shadow:0 4px 16px rgba(10,42,63,.045)}
.maliks-professional .pos-quick-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
.maliks-professional .pos-quick-btn{display:flex;align-items:center;gap:12px;min-height:85px;padding:14px 13px;border:1px solid var(--maliks-line);background:#FFFFFF;color:#0A2A3F;border-radius:12px;text-align:left;font-weight:750;font-size:13px;box-shadow:none}
.maliks-professional .pos-quick-btn:hover{background:#F5F6F7;transform:translateY(-1px);border-color:#D4A017}
.maliks-professional .pos-quick-btn .pos-quick-icon{width:42px;height:42px;min-width:42px;border-radius:11px;background:#F0F2F3;color:#D4A017;display:flex;align-items:center;justify-content:center}
.maliks-professional .pos-quick-icon svg{width:23px;height:23px;stroke:#D4A017}
.maliks-professional .pos-quick-btn small{display:block;margin-top:5px;font-size:10px;font-weight:500;color:rgba(10,42,63,.65)}
.maliks-professional .pos-ops-list{display:grid;gap:11px}
.maliks-professional .pos-ops-row{padding:11px 0;border-bottom:1px solid var(--maliks-line);display:flex;align-items:center;justify-content:space-between;gap:14px;font-size:12px}
.maliks-professional .pos-ops-row:last-child{border-bottom:0}
.maliks-professional .pos-ops-row strong{font-weight:800;color:#0A2A3F}
.maliks-professional .pos-ops-row span{color:rgba(10,42,63,.68);text-align:right}
.maliks-professional .pos-advisory{background:#F0F2F3;border:1px solid var(--maliks-line);border-left:3px solid #D4A017;border-radius:11px;padding:14px 17px;font-size:12px;color:rgba(10,42,63,.84);line-height:1.5}
.maliks-professional .pos-advisory strong{color:#0A2A3F}
.maliks-professional .pos-checkout-header{display:flex;justify-content:space-between;align-items:center;gap:16px}
.maliks-professional .pos-checkout-header h1{margin:7px 0 5px;font-size:clamp(25px,2.4vw,34px)}
.maliks-professional .pos-checkout-header p{margin:0;font-size:12px;color:rgba(10,42,63,.68)}
.maliks-professional .pos-outline-action{background:#FFFFFF;border:1px solid #E3E5E7;border-radius:11px;color:#0A2A3F;font-weight:800;font-size:12px;padding:13px 16px;min-height:47px}
.maliks-professional .pos-outline-action:hover{background:#F0F2F3;border-color:#D4A017}
.maliks-professional .pos-checkout-grid{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(340px,.87fr);gap:19px;align-items:start}
.maliks-professional .pos-checkout-grid .pos-card{padding:23px}
.maliks-professional .pos-search-bar{display:grid;grid-template-columns:42px minmax(0,1fr) 110px;align-items:center;border:2px solid #E3E5E7;border-radius:13px;background:#FFFFFF;overflow:hidden}
.maliks-professional .pos-search-bar:focus-within{border-color:#D4A017}
.maliks-professional .pos-search-bar>.pos-inline-icon{margin-left:14px;width:24px;height:24px}
.maliks-professional .pos-search-bar input{min-height:56px;border:0;outline:0;padding:9px 7px;font-size:15px;background:#FFFFFF;box-shadow:none}
.maliks-professional .pos-search-bar input:focus-visible{outline:0}
.maliks-professional .pos-search-bar button{height:100%;border-radius:0;background:#0A2A3F;color:#FFFFFF;border:0;min-height:56px;padding:0 14px;font-size:13px}
.maliks-professional .pos-search-hint{margin:11px 0 14px;font-size:11px;color:rgba(10,42,63,.7)}
.maliks-professional .pos-search-results{display:grid;gap:8px;max-height:530px;overflow-y:auto}
.maliks-professional .pos-result-row{display:flex;gap:13px;align-items:center;justify-content:space-between;border:1px solid #E3E5E7;background:#FFFFFF;border-radius:12px;padding:12px 13px;min-height:72px}
.maliks-professional .pos-result-row:hover{background:#F5F6F7}
.maliks-professional .pos-result-meta{display:flex;align-items:center;gap:12px;min-width:0;flex:1}
.maliks-professional .pos-product-symbol{height:42px;width:42px;min-width:42px;border-radius:10px;background:#F0F2F3;display:flex;align-items:center;justify-content:center;color:#D4A017}
.maliks-professional .pos-product-symbol svg{width:21px;height:21px;stroke:#D4A017}
.maliks-professional .pos-result-row strong{font-size:13px;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.maliks-professional .pos-result-row small{color:rgba(10,42,63,.6);font-size:11px;display:block;margin-top:3px}
.maliks-professional .pos-result-right{display:flex;align-items:center;gap:14px;flex-shrink:0}
.maliks-professional .pos-result-right b{font-size:14px}
.maliks-professional .pos-mini-add{height:41px;min-width:77px;display:inline-flex;align-items:center;justify-content:center;gap:6px;background:#D4A017;color:#0A2A3F;font-size:12px;padding:8px 12px;border-radius:9px}
.maliks-professional .pos-mini-add:disabled{background:#F0F2F3;color:rgba(10,42,63,.55);cursor:not-allowed}
.maliks-professional .pos-mini-add .pos-inline-icon,.maliks-professional .pos-mini-add svg{stroke:#0A2A3F;color:#0A2A3F}
.maliks-professional .pos-basket{position:sticky;top:192px;min-height:460px}
.maliks-professional .pos-basket-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding-bottom:12px;border-bottom:1px solid var(--maliks-line)}
.maliks-professional .pos-basket-head h2{font-size:17px;margin:0}
.maliks-professional .pos-line-list{display:grid;max-height:330px;overflow:auto}
.maliks-professional .pos-line-item{padding:13px 0;border-bottom:1px solid var(--maliks-line);display:grid;gap:9px}
.maliks-professional .pos-line-item strong{font-size:12px;line-height:1.35}
.maliks-professional .pos-line-row{display:flex;align-items:center;justify-content:space-between;gap:10px}
.maliks-professional .pos-qty-group{display:flex;align-items:center;border:1px solid var(--maliks-line);border-radius:9px;overflow:hidden}
.maliks-professional .pos-qty-group button{width:35px;height:35px;padding:6px;border-radius:0;background:#F0F2F3;color:#0A2A3F}
.maliks-professional .pos-qty-group button svg{stroke:#D4A017;width:16px;height:16px}
.maliks-professional .pos-qty-group span{font-size:13px;font-weight:800;min-width:38px;text-align:center}
.maliks-professional .pos-trash{background:transparent;color:#0A2A3F;padding:8px;border-radius:8px}
.maliks-professional .pos-trash svg{stroke:#D4A017;width:17px;height:17px}
.maliks-professional .pos-totals{padding:16px 0;display:grid;gap:10px}
.maliks-professional .pos-total-line{display:flex;justify-content:space-between;align-items:center;gap:16px;font-size:12px}
.maliks-professional .pos-total-line span{color:rgba(10,42,63,.72)}
.maliks-professional .pos-total-line strong{font-size:13px}
.maliks-professional .pos-total-line.grand{border-top:1px solid var(--maliks-line);padding-top:16px;font-size:16px}
.maliks-professional .pos-total-line.grand strong{font-size:26px;color:#0A2A3F}
.maliks-professional .pos-methods{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.maliks-professional .pos-methods button{padding:12px 8px;min-height:68px;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:4px;background:#F0F2F3;border:1px solid var(--maliks-line);color:#0A2A3F;font-size:12px}
.maliks-professional .pos-methods button svg{width:22px;height:22px;stroke:#D4A017}
.maliks-professional .pos-methods button:disabled{opacity:.65;cursor:not-allowed}
.maliks-professional .pos-checkout-disabled{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;margin-top:13px;min-height:56px;background:#0A2A3F;border-radius:11px;color:#FFFFFF;font-size:14px}
.maliks-professional .pos-checkout-disabled:disabled{opacity:.60;cursor:not-allowed}
.maliks-professional .pos-checkout-notice{font-size:11px;color:rgba(10,42,63,.7);line-height:1.5;margin:12px 0 0}
.maliks-professional .pos-empty{border:1px dashed var(--maliks-line);border-radius:11px;padding:26px 15px;text-align:center;color:rgba(10,42,63,.65);font-size:13px;background:#F5F6F7}
.maliks-professional .pos-page-link{background:transparent;border:0;color:#0A2A3F;font-size:12px;text-decoration:underline;text-decoration-color:#D4A017;padding:8px 0}
.maliks-professional .pos-status-note{font-size:10px;letter-spacing:.08em;font-weight:800;color:#0A2A3F;background:#F0F2F3;border:1px solid var(--maliks-line);padding:8px 11px;border-radius:50px;white-space:nowrap}
.maliks-professional .pos-inline-hint{display:flex;gap:9px;align-items:center;color:rgba(10,42,63,.7);font-size:11px}
@media(max-width:1150px){.maliks-professional .pos-kpi-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.maliks-professional .pos-work-grid{grid-template-columns:1fr}.maliks-professional .pos-quick-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.maliks-professional .pos-checkout-grid{grid-template-columns:minmax(0,1fr) 340px}}
@media(max-width:850px){.maliks-professional .suite-brandbar{min-height:72px;flex-wrap:wrap}.maliks-professional .suite-navbar{padding:0 5px}.maliks-professional .suite-nav-button{min-width:80px;min-height:75px}.maliks-professional .suite-shell>main{padding:18px 14px 45px}.maliks-professional .pos-checkout-grid{grid-template-columns:1fr}.maliks-professional .pos-basket{position:static}.maliks-professional .pos-welcome{align-items:stretch;flex-direction:column}.maliks-professional .pos-solid-action{align-self:flex-start}}
@media(max-width:570px){.maliks-professional .pos-kpi-grid{grid-template-columns:1fr 1fr;gap:9px}.maliks-professional .pos-kpi{padding:13px;min-height:145px}.maliks-professional .pos-kpi-value{font-size:22px}.maliks-professional .pos-quick-grid{grid-template-columns:1fr 1fr}.maliks-professional .pos-checkout-header{align-items:flex-start;flex-direction:column}.maliks-professional .pos-search-bar{grid-template-columns:35px minmax(0,1fr) 78px}.maliks-professional .pos-search-bar input{font-size:12px}.maliks-professional .pos-result-right{gap:7px}.maliks-professional .pos-result-row{padding:8px}.maliks-professional .pos-result-row b{font-size:12px}.maliks-professional .pos-mini-add{min-width:54px;padding:8px}.maliks-professional .pos-product-symbol{height:34px;width:34px;min-width:34px}.maliks-professional .pos-result-meta{gap:6px}}
`;

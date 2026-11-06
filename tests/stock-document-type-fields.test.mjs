import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
// Use the project's declared TypeScript devDependency. Never hardcode a Node/npm installation path.
import ts from 'typescript';

const root=new URL('../',import.meta.url);
const source=readFileSync(new URL('app/stock-operations/stock-operations.tsx',root),'utf8');
const css=readFileSync(new URL('app/stock-operations/stock-operations.module.css',root),'utf8');

// Execute actual TSX print/detail components with a tiny JSX adapter so the
// content checks are behavioural, not mere regular-expression assertions.
const labelSource=source.slice(source.indexOf('/** Shared, document-type-specific'),source.indexOf('const moneyCount=',source.indexOf('/** Shared, document-type-specific')));
const components=source.slice(source.indexOf('/** The live detail view'));
const isolated=ts.transpileModule(labelSource+'\n'+components,{compilerOptions:{jsx:ts.JsxEmit.React,jsxFactory:'h',jsxFragmentFactory:'Fragment',target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None},reportDiagnostics:true});
assert.equal(isolated.diagnostics?.length||0,0);
const make=(type,props,...children)=>({type,props:props||{},children});
const scope={h:make,Fragment:'fragment',styles:new Proxy({}, {get:(_,p)=>String(p)}), moneyCount:n=>String(n),date:()=> '06 Nov 2026'};
const loaded=vm.runInNewContext(isolated.outputText+'\n({StockPrintSheet,StockDocumentLines,StockDocumentEvidence,STOCK_DOCUMENT_LAYOUT})',scope);
function flatten(node){if(node===null||node===undefined||node===false)return '';if(Array.isArray(node))return node.map(flatten).join(' ');if(typeof node!=='object')return String(node);return node.children.map(flatten).join(' ');}
function thCount(node){if(!node||typeof node!=='object')return 0;if(Array.isArray(node))return node.reduce((a,x)=>a+thCount(x),0);return (node.type==='th'?1:0)+node.children.reduce((a,x)=>a+thCount(x),0);}
function document(kind){return {kind,document_number:'ST-'+kind+'-001',branch_name:'PowerBuild Branch',destination_branch:'Buster Build',status:'Draft',created_by:'operator@example.com',created_at:'2026-11-06T11:21:00Z',supplier:'Example supplier',external_reference:'DN-123',driver_name:'Moses',time_in:'08:45',time_out:'11:00',labelled:'Yes',labelled_by:'Sally',notes:'Reason / count note',lines:[{product_code:'PC01',product_name:'Product X',document_quantity:5,expected_quantity:7,rejected_quantity:1}],audit:[]};}
for(const kind of ['GRV','COUNT','ADJUSTMENT','SUPPLIER_RETURN','TRANSFER']){
 test(`${kind}: printable and on-screen fields are specific to the department`,()=>{
  const d=document(kind);
  const print=flatten(loaded.StockPrintSheet({document:d,typeTitle:'Unused'}));
  const live=flatten(loaded.StockDocumentEvidence({document:d}));
  const table=loaded.StockDocumentLines({document:d});
  assert.match(print,/POWERBUILD · MALIKS GROUP HUB/);
  assert.match(print,/Reason \/ count note/);
  assert.match(print,/Signature \/ date/);
  assert.match(print,/Approval history/);
  if(kind==='GRV'){
   assert.match(print,/Driver name/);assert.match(print,/Receiving manager/);assert.match(print,/Rejected/);
   assert.match(live,/Driver/);assert.equal(thCount(table),5);
  }else{
   assert.doesNotMatch(print,/Driver|Receiving manager|Time in|Time out|Items labelled|Rejected/i);
   assert.doesNotMatch(live,/Driver|Receiving manager|Time in|Time out|Labelled|Rejected/i);
   assert.doesNotMatch(flatten(table),/Rejected/);
  }
  if(['COUNT','ADJUSTMENT'].includes(kind)){
   assert.match(print,/Variance/);assert.match(print,/System quantity/);assert.equal(thCount(table),5);
  }
  if(['SUPPLIER_RETURN','TRANSFER'].includes(kind))assert.equal(thCount(table),4);
 });
}
test('stock count uses counter and verifier, not receiving or driver',()=>{
 const txt=flatten(loaded.StockPrintSheet({document:document('COUNT'),typeTitle:''}));assert.match(txt,/Counted by/);assert.match(txt,/Verified by/);
});
test('stock adjustment has request and independent manager signatures',()=>{
 const txt=flatten(loaded.StockPrintSheet({document:document('ADJUSTMENT'),typeTitle:''}));assert.match(txt,/Requested by/);assert.match(txt,/Authorised by/);
});
test('transfer records sending and receiving branch sign-off',()=>{
 const txt=flatten(loaded.StockPrintSheet({document:document('TRANSFER'),typeTitle:''}));assert.match(txt,/Issued by/);assert.match(txt,/Received by/);
});
test('supplier return uses return-appropriate sign-off without driver information',()=>{
 const txt=flatten(loaded.StockPrintSheet({document:document('SUPPLIER_RETURN'),typeTitle:''}));assert.match(txt,/Return prepared by/);assert.match(txt,/Authorised by/);
});
test('previous one-page A4 and last-column safety fix are preserved',()=>{
 assert.match(css,/@page\{size:A4 portrait;margin:11mm\}/);
 assert.match(css,/col:nth-child\(5\)\{width:14%!important\}/);
 assert.match(css,/\.printItemsFour colgroup col:nth-child\(4\)\{width:16%!important\}/);
 assert.match(css,/width:calc\(100% - 2mm\)!important/);
 assert.match(source,/Print register copy · PowerBuild A4/);
});

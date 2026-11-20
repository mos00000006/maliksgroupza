import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const ts=require('typescript');
const src=new URL('../app/lib/staff-id-a4.ts',import.meta.url);
const content=readFileSync(src,'utf8');
const converted=ts.transpileModule(content,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022},reportDiagnostics:true});
assert.equal(converted.diagnostics?.filter(d=>d.category===ts.DiagnosticCategory.Error).length,0);
const {staffIdSheetSlots,STAFF_ID_A4}=await import('data:text/javascript;base64,'+Buffer.from(converted.outputText).toString('base64'));
function bounds(arr){for(const v of arr){assert(v.xMm>=10);assert(v.yMm>=10);assert(v.xMm+v.widthMm<=200);assert(v.yMm+v.heightMm<=287)}}
test('exact ID-1 card sizes and A4 geometry in both orientations',()=>{
 assert.deepEqual([STAFF_ID_A4.widthMm,STAFF_ID_A4.heightMm],[210,297]);
 for(const orientation of ['portrait','landscape']){
  const slots=staffIdSheetSlots(orientation);assert.equal(slots.length,5);bounds(slots);
  for(const v of slots)assert.deepEqual([v.widthMm,v.heightMm],orientation==='portrait'?[53.98,85.60]:[85.60,53.98]);
  for(let i=0;i<slots.length;i++)for(let j=i+1;j<slots.length;j++){
   const a=slots[i],b=slots[j];assert(a.xMm+a.widthMm<=b.xMm||b.xMm+b.widthMm<=a.xMm||a.yMm+a.heightMm<=b.yMm||b.yMm+b.heightMm<=a.yMm,'cards must not overlap');
  }
 }
});
test('back cards mirror columns in duplex mode without changing row or position dimensions',()=>{
 for(const orientation of ['portrait','landscape']){
  const front=staffIdSheetSlots(orientation),back=staffIdSheetSlots(orientation,true);
  for(let i=0;i<5;i++){
   assert.equal(front[i].row,back[i].row);
   assert.equal(front[i].yMm,back[i].yMm);
   assert.equal(front[i].col+back[i].col,1);
   assert.equal(front[i].widthMm,back[i].widthMm);
  }
 }
});
test('generator keeps verification cards and adds branch selector, five-card queue and A4 PDF downloads',()=>{
 const text=readFileSync(new URL('../app/price-tags/staff-id-generator.tsx',import.meta.url),'utf8');
 const original=readFileSync(new URL('../app/lib/staff-id-export.ts',import.meta.url),'utf8');
 for(const phrase of ['priceTagResponse','/api/workspaces','Add to A4','Download A4 FRONT PDF','Download A4 BACK PDF','/p/staff/','staffIdSheetSlots','jpegPagePdf','BackArtwork'])assert(text.includes(phrase),phrase);
 assert(original.includes('width:53.98,height:85.60'));
 assert(original.includes('width:85.60,height:53.98'));
});
test('TSX and CSS parse without syntax errors',()=>{
 const file=readFileSync(new URL('../app/price-tags/staff-id-generator.tsx',import.meta.url),'utf8');
 const sf=ts.createSourceFile('staff-id-generator.tsx',file,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 assert.deepEqual(sf.parseDiagnostics.map(d=>ts.flattenDiagnosticMessageText(d.messageText,'\n')),[]);
 const css=readFileSync(new URL('../app/price-tags/staff-id-generator.module.css',import.meta.url),'utf8');
 for(const phrase of ['.idA4Sheet','.idBack','.busterBack','.sheetExportStage'])assert(css.includes(phrase));
});

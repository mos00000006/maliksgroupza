import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {REFERENCE_KINDS,saveReference,listReferences,referenceAudit} from '../src/reference-master-domain.mjs';
const kinds=['supplier_claim','supplier_return_reason','supplier_statement_recon_reason'];
const sql=name=>readFileSync(new URL('../sql/'+name,import.meta.url),'utf8');
class D1{constructor(){this.db=new DatabaseSync(':memory:');for(const name of ['phase27_reference_master_files.sql','phase29_debtor_extended_masters.sql','phase34_supplier_extended_masters.sql'])this.db.exec(sql(name));}prepare(q){const db=this.db;let a=[];return {bind(...args){a=args;return this;},first:async()=>db.prepare(q).get(...a)||null,all:async()=>({results:db.prepare(q).all(...a)}),run:async()=>({meta:{changes:Number(db.prepare(q).run(...a).changes)}})};}async batch(q){this.db.exec('BEGIN');try{const r=[];for(const i of q)r.push(await i.run());this.db.exec('COMMIT');return r;}catch(e){this.db.exec('ROLLBACK');throw e;}}}
const actor={role:'Developer / Technical Admin',active:1,email:'manager@example.test',name:'Manager',access_scope:'Full company'};
const ctx=(branches=['Branch A'],app='management')=>({app,branches,member:actor});
const url='https://maliks-core.internal/v1/reference-masters';
const post=(data)=>new Request(url,{method:'POST',headers:{origin:'https://maliks-pos.test','x-maliks-original-origin':'https://maliks-pos.test'},body:JSON.stringify({request_id:crypto.randomUUID(),branch:'Branch A',active:true,description:'',...data})});
const get=(kind,branch='Branch A')=>new Request(url+'?'+new URLSearchParams({kind,branch}));
test('supplier master registration and menu wiring',()=>{const f=readFileSync(new URL('../src/frontend.mjs',import.meta.url),'utf8');for(const kind of kinds){assert.equal(REFERENCE_KINDS[kind],'supplier');assert.ok(f.includes(kind));}for(const name of ['Claims','Suppliers Returns Reasons','Statements Recon Reasons'])assert.ok(f.includes(name));});
test('safe additive migration and independent registers, audit and branch isolation',async()=>{const db=new D1();db.db.exec(sql('phase34_supplier_extended_masters.sql'));for(const kind of kinds){const r=await saveReference(post({kind,code:'TEST',name:'Test reason'}),{DB:db},ctx());assert.equal(r.status,200,JSON.stringify(await r.clone().json()));const data=await r.json();assert.equal(data.record.kind,kind);const l=await(await listReferences(get(kind),{DB:db},ctx())).json();assert.equal(l.records.length,1);assert.equal((await (await referenceAudit(get(kind),{DB:db},ctx())).json()).audit[0].action,'CREATE');assert.equal((await saveReference(post({kind,code:'TEST',name:'Duplicate'}),{DB:db},ctx())).status,409);assert.equal((await listReferences(get(kind,'Branch B'),{DB:db},ctx())).status,403);}assert.equal(db.db.prepare('SELECT count(*) AS n FROM maliks_pos_reference_masters').get().n,0);});

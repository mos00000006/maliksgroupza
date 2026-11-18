import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {getDebtorReport,DEBTOR_REPORT_MODES} from '../src/debtor-report-domain.mjs';
const B='Active Build Carletonville',X='Other Branch';
class D1 {
 constructor(){
  this.db=new DatabaseSync(':memory:');this.db.exec(`
    CREATE TABLE maliks_pos_master_records(kind TEXT,branch TEXT,code TEXT,name TEXT,active INTEGER,details_json TEXT,updated_at TEXT);
    CREATE TABLE till_quotation_submissions(id INTEGER PRIMARY KEY,branch TEXT,customer_name TEXT,customer_contact TEXT,submitted_by_name TEXT,created_at TEXT,total_cents INTEGER,status TEXT);
    CREATE TABLE maliks_p9_payments(id INTEGER PRIMARY KEY,status TEXT);
    CREATE TABLE maliks_p9_invoices(id INTEGER PRIMARY KEY,payment_id INTEGER,quotation_id INTEGER,branch TEXT,total_cents INTEGER,net_cents INTEGER,vat_cents INTEGER,issued_at TEXT);
    CREATE TABLE maliks_p9_journal_lines(id INTEGER PRIMARY KEY,invoice_id INTEGER,account TEXT,side TEXT,amount_cents INTEGER);
  `);this.db.exec(readFileSync(new URL('../sql/phase30_debtor_transaction_registers.sql',import.meta.url),'utf8'));
  this.db.prepare('INSERT INTO maliks_pos_master_records VALUES(?,?,?,?,?,?,?)').run('debtor',B,'AC101','Moses Trade',1,JSON.stringify({credit_limit_cents:500000,payment_terms_days:30,contact_name:'Moses',email:'accounts@example.com'}),'2026-11-18');
  this.db.prepare('INSERT INTO maliks_pos_master_records VALUES(?,?,?,?,?,?,?)').run('debtor',X,'AC200','Secret Other',1,JSON.stringify({credit_limit_cents:90000000,payment_terms_days:60}),'2026-11-18');
  this.db.exec(`
    INSERT INTO till_quotation_submissions VALUES(11,'${B}','Moses Trade','0781234567','Sales Person','2026-11-18T10:00:00Z',142900,'AWAITING_CASH_OFFICE');
    INSERT INTO till_quotation_submissions VALUES(12,'${B}','Moses Trade','0781234567','Sales Person','2026-11-18T11:00:00Z',100000,'REVIEWED');
    INSERT INTO till_quotation_submissions VALUES(13,'${X}','Secret Other','0781234567','Secret','2026-11-18T11:00:00Z',999000,'REVIEWED');
    INSERT INTO maliks_p9_payments VALUES(1,'CONFIRMED');
    INSERT INTO maliks_p9_payments VALUES(2,'AWAITING_VERIFICATION');
    INSERT INTO maliks_p9_payments VALUES(3,'CONFIRMED');
    INSERT INTO maliks_p9_invoices VALUES(51,1,12,'${B}',100000,86956,13044,'2026-11-18T12:00:00Z');
    INSERT INTO maliks_p9_invoices VALUES(52,2,11,'${B}',142900,124261,18639,'2026-11-18T12:00:00Z');
    INSERT INTO maliks_p9_invoices VALUES(53,3,13,'${X}',999000,868696,130304,'2026-11-18T12:00:00Z');
    INSERT INTO maliks_p9_journal_lines VALUES(1,51,'CASH_CONTROL','DR',100000);
    INSERT INTO maliks_p9_journal_lines VALUES(2,51,'SALES_REVENUE','CR',86956);
    INSERT INTO maliks_p9_journal_lines VALUES(3,51,'OUTPUT_VAT','CR',13044);
    INSERT INTO maliks_p9_journal_lines VALUES(4,52,'CASH_CONTROL','DR',142900);
    INSERT INTO maliks_p9_journal_lines VALUES(5,53,'CASH_CONTROL','DR',999000);
  `);
  this.db.prepare(`INSERT INTO maliks_pos_debtor_transaction_register (kind,branch,reference,debtor_code,amount_cents,event_date,description,details_json,status,version,posted,created_by_email,created_by_name,created_at,updated_at,create_request_id,create_payload_hash,last_request_id)
   VALUES(?,?,?,?,?,?,?,?,?,1,0,'staff@test','Staff','2026-11-18','2026-11-18',?,?,?)`).run('PDC',B,'PDC-001','AC101',20000,'2026-11-18','Future cheque',JSON.stringify({cheque_date:'2026-12-01',bank:'FNB',cheque_number:'CH999'}),'SUBMITTED','requestPDC001','hash','requestPDC001');
  this.db.prepare(`INSERT INTO maliks_pos_debtor_transaction_register (kind,branch,reference,debtor_code,amount_cents,event_date,description,details_json,status,version,posted,created_by_email,created_by_name,created_at,updated_at,create_request_id,create_payload_hash,last_request_id)
   VALUES(?,?,?,?,?,?,?,?,?,1,0,'staff@test','Staff','2026-11-18','2026-11-18',?,?,?)`).run('PAYMENT',X,'SECRET-001','AC200',999000,'2026-11-18','Private data',JSON.stringify({method:'EFT'}),'DRAFT','requestSecret001','hash2','requestSecret001');
 }
 prepare(sql){let args=[];const db=this.db;return {bind(...a){args=a;return this;},async all(){return {results:db.prepare(sql).all(...args)};},async first(){return db.prepare(sql).get(...args)||null;}};}
}
const ctx=(role='Store Manager',branches=[B])=>({app:'management',branches,member:{role,active:1,department:B,email:'manager@example.com'}});
const read=async(mode,params={},context=ctx(),db=new D1())=>{
 const qs=new URLSearchParams({branch:B,mode,...params});const res=await getDebtorReport(new Request('https://core.test/v1/debtor-reports?'+qs),{DB:db},context);return {res,json:await res.json()};
};
test('all eight reporting modes are reachable, explicitly non-posting, branch scoped and read-only',async()=>{
 assert.equal(DEBTOR_REPORT_MODES.length,8);
 for(const mode of DEBTOR_REPORT_MODES){const {res,json}=await read(mode);assert.equal(res.status,200,mode+' '+JSON.stringify(json));
  assert.equal(json.branch,B);assert.equal(json.mode,mode);assert.equal(json.accounting_complete,false);
  assert.equal(json.financial_posting,false);assert.ok(json.disclaimer.length>30,mode);
  assert.ok(json.sections.length>0);assert.ok(json.sections.every(s=>Array.isArray(s.rows)&&s.columns.length),mode);
  assert.ok(!JSON.stringify(json).includes('Secret Other'),mode);assert.ok(!JSON.stringify(json).includes('999000'),mode);
 }
});
test('master returns debtor accounts and credit limits without pretending they are balances',async()=>{
 const {json}=await read('master');assert.deepEqual(json.sections[0].rows[0].slice(0,3),['AC101','Moses Trade','Active']);
 assert.match(json.sections[0].rows[0][3],/5\s000/);assert.match(json.disclaimer,/NOT current balances/);
});
test('sales labels quotations as NOT revenue and only includes confirmed pilot invoices',async()=>{
 const {json}=await read('sales');assert.equal(json.sections.length,2);
 assert.equal(json.sections[0].rows.length,1);assert.match(JSON.stringify(json.sections[0].rows),/INV-00000051/);
 assert.equal(json.sections[1].rows.length,2);assert.match(json.sections[1].name,/NOT revenue/);
 assert.equal(/1\s000/.test(json.summary[2].value),true);assert.match(json.disclaimer,/Quotations are NOT sales/);
});
test('pilot ledger/control show only confirmed invoice journals and never call them a reconciled debtor account',async()=>{
 const l=(await read('ledger')).json;assert.equal(l.sections[0].rows.length,3);assert.match(l.disclaimer,/not an imported General Ledger/i);
 const c=(await read('control')).json;assert.equal(c.sections[0].rows.length,3);assert.match(c.summary[2].value,/0.00/);
 assert.match(c.disclaimer,/Not a reconciled Debtors Control Account/);assert.match(c.disclaimer,/zero difference does not establish/i);
});
test('statement and age analysis refuse to generate fake outstanding balances or age buckets',async()=>{
 for(const mode of ['statements','age']){const {json}=await read(mode);const content=JSON.stringify(json.sections);
 assert.match(content,/Not available/);assert.match(json.disclaimer,/Opening balances/);assert.doesNotMatch(content,/999,000/);
 }
});
test('PDCs show cheque due dates without falsely claiming bank clearance',async()=>{
 const p=(await read('pdcs')).json;assert.equal(p.sections[0].rows.length,1);
 assert.equal(p.sections[0].rows[0][3],'2026-12-01');assert.equal(p.sections[0].rows[0].at(-1),'NOT CLEARED');
});
test('invalid date, pagination and search inputs are rejected, and search is parameterized',async()=>{
 for(const params of [{from:'2026-02-30'},{from:'2026-12-01',to:'2026-11-01'},{page:'-1'},{search:'x'.repeat(70)}]){
  const {res}=await read('transactions',params);assert.equal(res.status,400,JSON.stringify(params));
 }
 const ok=await read('transactions',{search:"' OR 1=1 --"});assert.equal(ok.res.status,200);assert.equal(ok.json.sections[0].rows.length,0);
 const narrow=await read('sales',{from:'2026-11-19'});assert.equal(narrow.json.sections[0].rows.length,0);
});
test('reports cannot be requested from Sales/Member workers, unassigned branches or unauthorised roles',async()=>{
 const db=new D1();let o=await read('master',{}, {...ctx(),app:'pos'},db);assert.equal(o.res.status,403);
 o=await read('master',{}, ctx('Sales'),db);assert.equal(o.res.status,403);
 o=await read('master',{branch:X},ctx(),db);assert.equal(o.res.status,403);
 o=await read('ledger',{},ctx('Debtors Clerk'),db);assert.equal(o.res.status,200);
});

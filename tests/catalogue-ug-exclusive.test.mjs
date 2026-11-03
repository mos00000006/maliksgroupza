import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cataloguePdfCategory } from '../app/catalogue-pdf-grouping.ts';
import { correctUgCategory } from '../app/catalogue-ug-category.ts';
const ugProducts = [
  'PIPE UG 110MMX6M','UG 110MMX90 DEG LONG RADIUS BEND',
  'UG 110MMX45 DEG PLAIN Y JUNCTION','UG 110MM SINGLE SOCKET',
  '110MM UG DOUBLE RR SOCKET','PIPE UNDERGROUND 110MMX6M',
  '110MM UG-45DEG BEND'
];
for (const name of ugProducts) {
  test(`dedicated UG PDF section: ${name}`, () => assert.equal(cataloguePdfCategory({name,category:'Plumbing'}),'Underground (UG)'));
  test(`dedicated UG saved department: ${name}`, () => assert.equal(correctUgCategory(name,'Plumbing'),'Underground (UG)'));
}
test('pipe UG overrules old Plumbing Pipes category',()=>assert.equal(cataloguePdfCategory({name:'PIPE UG 110MMX6M',category:'Plumbing Pipes'}),'Underground (UG)'));
test('stored UG category is normalized',()=>assert.equal(correctUgCategory('110MM DOUBLE RR SOCKET','UG'),'Underground (UG)'));
test('non-UG pipe remains plumbing',()=>assert.equal(cataloguePdfCategory({name:'PIPE HDPE 20MMX100M C10',category:'Plumbing'}),'Plumbing Pipes'));
test('does not confuse PLUG or MUG for UG',()=>{
  assert.equal(correctUgCategory('GALVANISED PLUG 1/2 INCH','Plumbing'),'Plumbing');
  assert.equal(correctUgCategory('MUG CERAMIC','Homeware'),'Homeware');
});
test('SV remains independent of UG',()=>assert.equal(cataloguePdfCategory({name:'SV 110MMX45 DEG PLAIN BEND',category:'Plumbing'}),'Soil & Vent (SV)'));
test('D1 script does not contain manual transaction statements',()=>{
 const sql=readFileSync(new URL('../drizzle/CATALOGUE_UG_DEDICATED_DEPARTMENT.sql',import.meta.url),'utf8');
 assert.doesNotMatch(sql,/^\s*(?:BEGIN|COMMIT|SAVEPOINT)\s*;/mi);
 assert.match(sql,/category = 'Underground \(UG\)'/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = path => readFileSync(path,'utf8');
test('safety signs has representative, separate safety groups and export',()=>{
 const s=read('app/price-tags/safety-warning-signs.tsx');
 for(const x of ['forklift','smoking','hardhat','extinguisher','firstaid','exit','custom'])assert.match(s,new RegExp(x));
 assert.match(s,/signagePdf\(/);assert.match(s,/toJpeg\(/);
 assert.match(s,/not certified regulatory signs/);
});
test('existing studio contains a direct safety signs tab and preserves other menus',()=>{
 const s=read('app/price-tags/price-tag-generator.tsx');
 for(const x of ['Single product tag','Create a combo','Store signage','Safety &amp; Warning Signs','Staff ID cards'])assert.ok(s.includes(x),`Missing ${x}`);
 assert.match(s,/mode === "safety-signs"/);
});

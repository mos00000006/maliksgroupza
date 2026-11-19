import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {STOCK_LABEL_CLIENT_SCRIPT} from '../src/stock-labelling-ui.mjs';
import {STOCK_LABEL_QR_JS} from '../src/stock-label-qr.mjs';
const frontend=readFileSync(new URL('../src/frontend.mjs',import.meta.url),'utf8');
const inventory=readFileSync(new URL('../src/inventory-domain.mjs',import.meta.url),'utf8');
test('Stock Labelling uses its own workstation, not debtor or generic label register',()=>{
 assert.match(frontend,/if\(item==='Labelling'\)\{suiteStockLabelling\(\);return;\}/);
 assert.match(frontend,/\/stock-label-qr\.js/);
 assert.match(STOCK_LABEL_CLIENT_SCRIPT,/function suiteStockLabelling\(/);
 assert.match(STOCK_LABEL_CLIENT_SCRIPT,/GK420d/);
 assert.doesNotMatch(STOCK_LABEL_CLIENT_SCRIPT,/\/api\/debtor/i);
 new vm.Script(STOCK_LABEL_CLIENT_SCRIPT);
});
test('real QR renderer creates SVG encoding a published card URL',()=>{
 const context={window:{}};vm.runInNewContext(STOCK_LABEL_QR_JS,context);
 const qr=context.window.MALIKS_LABEL_QR(0,'M');
 qr.addData('https://maliks.co.za/p/12345678-1234-1234-1234-123456789abc?branch=Example');
 qr.make();assert.match(qr.createSvgTag(2,0),/<svg/);
});
test('branch published QR token and live pricing are read securely from inventory',()=>{
 assert.match(inventory,/tag\.token AS label_qr_token/);
 assert.match(inventory,/price_tag_branch_prices/);
 assert.match(inventory,/tag\.published=1/);
 assert.match(inventory,/matchingBranch\(c\.branches/);
 assert.match(STOCK_LABEL_CLIENT_SCRIPT,/No published Hub QR token/);
 assert.match(STOCK_LABEL_CLIENT_SCRIPT,/busterbuild-logo\.png/);
 assert.match(STOCK_LABEL_CLIENT_SCRIPT,/powerbuild-logo\.png/);
});
test('GK420d preserves single 40x24 / 50x30 choices and adds a separate two-up portrait roll mode',()=>{
 assert.match(STOCK_LABEL_CLIENT_SCRIPT,/\['40x24','Single 40 × 24 mm sticker'\]/);
 assert.match(STOCK_LABEL_CLIENT_SCRIPT,/\['50x30','Single 50 × 30 mm sticker'\]/);
 assert.match(STOCK_LABEL_CLIENT_SCRIPT,/\['two-up','Two portrait stickers side by side/);
 assert.match(STOCK_LABEL_CLIENT_SCRIPT,/function labelGeometry\(\)/);
 assert.match(STOCK_LABEL_CLIENT_SCRIPT,/width:2\*labelW\+gap,height:labelH/);
 assert.match(STOCK_LABEL_CLIENT_SCRIPT,/function makeTwoUpPdf\(/);
 assert.match(STOCK_LABEL_CLIENT_SCRIPT,/Maximum 500 labels/);
 assert.match(STOCK_LABEL_CLIENT_SCRIPT,/makeStickerPdf/);
 assert.doesNotMatch(STOCK_LABEL_CLIENT_SCRIPT,/window\.print\(/);
 assert.doesNotMatch(STOCK_LABEL_CLIENT_SCRIPT,/invPost\(/);
});

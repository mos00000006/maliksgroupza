// Run from repository root: node maliks-operations/scripts/apply-phase54.mjs
// Surgical, idempotent edits: never replace existing POS/Core source with an old snapshot.
import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const dir=path.dirname(fileURLToPath(import.meta.url));
const project=path.resolve(dir,'..');
const repo=path.resolve(project,'..');
function patch(file,changes){
 const p=path.resolve(repo,file);let contents=readFileSync(p,'utf8');
 for(const {anchor,insertion,guard,action='before'} of changes){
  if(contents.includes(guard))continue;
  const at=contents.indexOf(anchor);
  if(at<0||contents.indexOf(anchor,at+anchor.length)>=0)throw Error('Phase54 cannot locate unique anchor in '+file+': '+anchor.slice(0,75));
  contents=contents.slice(0,at)+(action==='before'?insertion+anchor:anchor+insertion)+contents.slice(at+anchor.length);
 }
 writeFileSync(p,contents);
 console.log('Phase54 checked',file);
}
patch('maliks-operations/src/core.mjs',[
 {anchor:"import {listReferences,saveReference,referenceAudit} from './reference-master-domain.mjs';",guard:'from \'./backoffice-master-domain.mjs\'',action:'after',insertion:"\nimport {listBackofficeMasters,listBackofficeMasterAudit,saveBackofficeMaster} from './backoffice-master-domain.mjs';"},
 {anchor:"      if(path==='/v1/reference-masters'&&req.method==='GET')",guard:"if(path==='/v1/backoffice-masters'&&req.method==='GET')",insertion:"      if(path==='/v1/backoffice-masters'&&req.method==='GET')return await listBackofficeMasters(req,env,context);\n      if(path==='/v1/backoffice-masters'&&req.method==='POST')return await saveBackofficeMaster(req,env,context);\n      if(path==='/v1/backoffice-masters/audit'&&req.method==='GET')return await listBackofficeMasterAudit(req,env,context);\n"}
]);
patch('maliks-operations/src/frontend.mjs',[
 {anchor:"import { SUITE_INSIGHTS_CLIENT_SCRIPT } from './suite-insights.mjs';",guard:'from \'./backoffice-master-ui.mjs\'',action:'after',insertion:"\nimport { BACKOFFICE_MASTERS_CLIENT_SCRIPT } from './backoffice-master-ui.mjs';"},
 {anchor:' ${SUITE_INSIGHTS_CLIENT_SCRIPT}',guard:' ${BACKOFFICE_MASTERS_CLIENT_SCRIPT}',action:'after',insertion:'\n ${BACKOFFICE_MASTERS_CLIENT_SCRIPT}'},
 {anchor:"   if(id==='backoffice')return item==='Till Cash-Up';",guard:"   if(id==='backoffice')return ['Till Cash-Up'",insertion:"   if(id==='backoffice')return ['Till Cash-Up','Tills','Till Drawings Expenses','Payment Types','Coinage','Cash Sales Transaction Numbers Free Voucher'].includes(item);",action:'before'},
 {anchor:"         suiteWorkspaceStart(item);",guard:"if(id==='backoffice'&&section==='Master Files')",action:'after',insertion:"\n         if(id==='backoffice'&&section==='Master Files'){suiteBackofficeMaster(item);return;}"},
 {anchor:"'/api/reference-masters':'/v1/reference-masters'",guard:"'/api/backoffice-masters':'/v1/backoffice-masters'",insertion:"'/api/backoffice-masters':'/v1/backoffice-masters','/api/backoffice-masters/audit':'/v1/backoffice-masters/audit',",action:'before'},
 {anchor:"'/api/reference-masters','/api/debtor-settings'",guard:"'/api/backoffice-masters','/api/reference-masters'",insertion:"'/api/backoffice-masters',",action:'before'},
 {anchor:"!path.startsWith('/v1/reference-masters')",guard:"!path.startsWith('/v1/backoffice-masters')",insertion:"!path.startsWith('/v1/backoffice-masters') && ",action:'before'},
 {anchor:"   if((url.pathname.startsWith('/api/dispatch-jobs') && kind!=='dispatch') ||",guard:"(url.pathname.startsWith('/api/backoffice-masters') && kind!=='pos')",insertion:"   if(url.pathname.startsWith('/api/backoffice-masters') && kind!=='pos')return Response.json({error:'Back Office management app only.'},{status:403});\n",action:'before'}
]);
// Replace one legacy exact line, preserving the rest of the source as it is today.
{
 const p=path.join(project,'src/frontend.mjs');let c=readFileSync(p,'utf8');
 const old="   if(id==='backoffice')return item==='Till Cash-Up';";
 if(c.includes(old))c=c.replace(old,'');
 writeFileSync(p,c);
}
patch('maliks-operations/package.json',[
 {anchor:'    "deploy:core":',guard:'"migrate:phase54"',insertion:'    "migrate:phase54": "wrangler d1 execute maliks-group-hub-db --remote --yes --file sql/phase54_backoffice_masters.sql --config .generated/core.json",\n'}
]);
patch('.github/workflows/deploy-maliks-operations.yml',[
 {anchor:'      - name: Deploy central API — private Worker',guard:'Apply Back Office master-file schema (Phase 54)',insertion:'      - name: Apply Back Office master-file schema (Phase 54)\n        run: npm run migrate:phase54\n'}
]);
console.log('Phase 54 wiring applied. Review git diff, run npm test, then commit and deploy.');

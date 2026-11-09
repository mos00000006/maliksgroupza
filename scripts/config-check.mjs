import {readFileSync} from 'node:fs';
const source=readFileSync('wrangler.jsonc','utf8').replace(/^\s*\/\/.*$/gm,'');
const config=JSON.parse(source);
const issues=[];
if(config.name!=='maliks-pos')issues.push('Worker name must remain maliks-pos');
if(!config.d1_databases?.[0]?.database_id||config.d1_databases[0].database_id.startsWith('REPLACE'))issues.push('Set the existing Hub D1 database_id');
if(!config.vars?.CF_ACCESS_AUD||config.vars.CF_ACCESS_AUD.startsWith('REPLACE'))issues.push('Set this new POS Cloudflare Access application AUD');
if(config.vars?.CF_ACCESS_TEAM_DOMAIN?.includes('YOUR-TEAM'))issues.push('Set your real Cloudflare Access team domain');
if(issues.length){console.error('CONFIG NOT READY FOR LIVE DEPLOY:\n'+issues.map(x=>' • '+x).join('\n'));process.exitCode=1;}
else console.log('Deployment settings present. Confirm Access policy on the POS domain before deployment.');

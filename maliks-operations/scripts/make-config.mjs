import { mkdir,writeFile } from 'node:fs/promises';
import path from 'node:path';

const uuid=process.env.MALIKS_GROUP_D1_DATABASE_ID?.trim();
// Accept either the bare Cloudflare team domain or its full HTTPS URL.
// Never print the actual domain or GitHub secret to CI logs.
const rawTeamDomain=process.env.CF_ACCESS_TEAM_DOMAIN?.trim() || '';
if(!rawTeamDomain){
  throw Error('CF_ACCESS_TEAM_DOMAIN is empty in this GitHub Actions run. Check Repository secrets and the workflow env mapping.');
}
const normalizedHost=rawTeamDomain.replace(/^https:\/\//i,'').replace(/\/+$/,'');
if(!/^[a-z0-9-]+\.cloudflareaccess\.com$/i.test(normalizedHost)){
  const hint=rawTeamDomain.includes('...') || rawTeamDomain.includes('…')
    ? ' The value looks truncated: copy the complete Team domain from Cloudflare (not the shortened display).'
    : rawTeamDomain.startsWith('http://')
      ? ' Use an HTTPS domain rather than HTTP.'
      : ' Copy the exact Team domain from Cloudflare; do not include an extra https://, path, spaces, or example text.';
  throw Error('CF_ACCESS_TEAM_DOMAIN is present but is not a valid Cloudflare Access team domain.'+hint);
}
const issuer='https://'+normalizedHost;
console.log('Cloudflare Access Team domain validated (value hidden).');
// The separate Sales Worker reuses the existing POS Access audience.
// Add its hostname to the SAME Cloudflare Access application before deployment.
const apps={pos:'CF_ACCESS_AUD_POS',sales:'CF_ACCESS_AUD_POS',tills:'CF_ACCESS_AUD_TILLS',cashoffice:'CF_ACCESS_AUD_CASHOFFICE',dispatch:'CF_ACCESS_AUD_DISPATCH'};
if(!uuid || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid))throw Error('MALIKS_GROUP_D1_DATABASE_ID must be an existing D1 database UUID.');
for(const [app,key] of Object.entries(apps)){if(!process.env[key]?.trim())throw Error('Missing Cloudflare Access application AUD: '+key+' ('+app+')');}
const date='2026-11-09';
const common={compatibility_date:date,compatibility_flags:['nodejs_compat'],observability:{enabled:true}};
const out=path.resolve('.generated');await mkdir(out,{recursive:true});
const core={...common,name:'maliks-core-api',main:'../src/core.mjs',workers_dev:false,
 vars:{CF_ACCESS_TEAM_DOMAIN:issuer,
  ACCESS_AUD_POS:process.env.CF_ACCESS_AUD_POS.trim(),ACCESS_AUD_TILLS:process.env.CF_ACCESS_AUD_TILLS.trim(),
  ACCESS_AUD_CASHOFFICE:process.env.CF_ACCESS_AUD_CASHOFFICE.trim(),ACCESS_AUD_DISPATCH:process.env.CF_ACCESS_AUD_DISPATCH.trim(),
  P9_APPROVAL_ENABLED:process.env.MALIKS_P9_APPROVAL_ENABLED==='true'?'true':'false'},
 d1_databases:[{binding:'DB',database_name:'maliks-group-hub-db',database_id:uuid}]};
await writeFile(path.join(out,'core.json'),JSON.stringify(core,null,2)+'\n',{mode:0o600});
for(const app of Object.keys(apps)){
 const config={...common,name:'maliks-'+(app==='cashoffice'?'cash-office':app),main:'../src/frontend.mjs',workers_dev:true,
   vars:{APP_TYPE:app},services:[{binding:'CORE',service:'maliks-core-api'}]};
 await writeFile(path.join(out,app+'.json'),JSON.stringify(config,null,2)+'\n',{mode:0o600});
}
console.log('Created six deployment configurations. Run deploy:core first, then each department Worker.');

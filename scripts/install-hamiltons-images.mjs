import{readFileSync,writeFileSync,existsSync}from'node:fs';
const path='app/api/catalogue/[id]/external-image/route.ts';let s=readFileSync(path,'utf8');
if(!s.includes('hamiltonsImageHost')){
 const marker='return torkcraftImageHost || clean === "pulsetiles.co.za"';const legacy='return clean === "pulsetiles.co.za"';
 const target=s.includes(marker)?marker:s.includes(legacy)?legacy:null;if(!target)throw Error('External image handler differs. No files changed.');
 s=s.replace(target,'const hamiltonsImageHost = clean === "hamiltonsbrush.co.za" || clean === "www.hamiltonsbrush.co.za";\n  return hamiltonsImageHost || '+target.slice(7));
 if(!existsSync(path+'.before-hamiltons'))writeFileSync(path+'.before-hamiltons',readFileSync(path));writeFileSync(path,s);
}
const pkg=JSON.parse(readFileSync('package.json','utf8'));pkg.scripts??={};const cmd='node scripts/install-hamiltons-images.mjs';if(!String(pkg.scripts.prebuild||'').includes(cmd)){pkg.scripts.prebuild=pkg.scripts.prebuild?pkg.scripts.prebuild+' && '+cmd:cmd;writeFileSync('package.json',JSON.stringify(pkg,null,2)+'\n');}
console.log('Hamiltons supplier image host enabled; other sources and access checks preserved.');

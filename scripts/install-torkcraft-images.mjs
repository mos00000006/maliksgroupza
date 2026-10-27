import{readFileSync,writeFileSync,existsSync}from'node:fs';
const path='app/api/catalogue/[id]/external-image/route.ts';let s=readFileSync(path,'utf8');
if(!s.includes('torkcraftImageHost')){
 const marker='return clean === "pulsetiles.co.za"';if(!s.includes(marker))throw Error('External image handler differs. No files changed.');
 s=s.replace(marker,'const torkcraftImageHost = clean === "b2c.et-dev.co.za";\n  return torkcraftImageHost || clean === "pulsetiles.co.za"');
 if(!existsSync(path+'.before-torkcraft'))writeFileSync(path+'.before-torkcraft',readFileSync(path));writeFileSync(path,s);
}
const pkg=JSON.parse(readFileSync('package.json','utf8'));pkg.scripts??={};const cmd='node scripts/install-torkcraft-images.mjs';if(!String(pkg.scripts.prebuild||'').includes(cmd)){pkg.scripts.prebuild=pkg.scripts.prebuild?pkg.scripts.prebuild+' && '+cmd:cmd;writeFileSync('package.json',JSON.stringify(pkg,null,2)+'\n');}
console.log('Tork Craft catalogue image host enabled; existing image sources preserved.');

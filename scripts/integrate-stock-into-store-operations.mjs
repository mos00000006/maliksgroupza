#!/usr/bin/env node
/**
 * Safely link the existing Store Operations Hub view to its stock functions.
 * Idempotent. Refuses to alter an unrecognised module instead of overwriting.
 */
import {readFileSync, writeFileSync, existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const file = resolve(process.cwd(), 'app/operational-view.tsx');
const signature = 'data-maliks-store-stock="integrated-v2"';
const anchor = '<div className="moduleHero storesHero">';
const branch = 'if (active === "Store Operations")';
const content = `        <section data-maliks-store-stock="integrated-v2" aria-label="Stock Control and GRVs" style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:20,flexWrap:'wrap',padding:'22px 24px',margin:'18px 0',background:'linear-gradient(115deg,#102c4c,#163c65)',borderRadius:16,color:'#fff',boxShadow:'0 8px 22px rgba(16,44,76,.12)'}}>
          <div style={{flex:'1 1 280px'}}>
            <small style={{fontSize:11,fontWeight:800,letterSpacing:2,color:'#f6cd65'}}>RECEIVING &amp; INVENTORY CONTROL</small>
            <h3 style={{fontSize:22,margin:'8px 0 5px',color:'#fff'}}>Stock Control &amp; GRVs</h3>
            <p style={{margin:0,color:'#e1ebf5',fontSize:14,lineHeight:1.6}}>GRVs, stock adjustments, physical counts, supplier returns, transfers and approval history.</p>
          </div>
          <a href="/store-operations/stock" style={{display:'inline-flex',alignItems:'center',justifyContent:'center',background:'#e8b94f',color:'#102b4a',padding:'12px 18px',fontSize:14,fontWeight:800,borderRadius:10,textDecoration:'none',whiteSpace:'nowrap'}}>Open Stock Control →</a>
        </section>
`;
export function integrate(source) {
  if (source.includes(signature)) return {result:source, changed:false, reason:'already-installed'};
  const i = source.indexOf(branch);
  if (i === -1) throw Error('Existing Store Operations branch not found. No file changed.');
  const j = source.indexOf(anchor, i);
  const next = source.indexOf('if (active ===', i + branch.length);
  if (j === -1 || (next !== -1 && j > next) || j - i > 650) {
    throw Error('Existing Store Operations layout has changed. No file changed; review integration manually.');
  }
  return {result:source.slice(0,j)+content+source.slice(j), changed:true, reason:'installed'};
}
if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  if (!existsSync(file)) {process.stderr.write('app/operational-view.tsx not found. Run from the maliksgroupza project root.\n');process.exitCode=1;}
  else {
    try {
      const source=readFileSync(file,'utf8');const r=integrate(source);
      if(r.changed)writeFileSync(file,r.result,'utf8');
      process.stdout.write(r.changed?'Stock Control & GRVs added to EXISTING Store Operations.\n':'Already integrated; no changes.\n');
    } catch(e) {process.stderr.write(String(e)+'\n');process.exitCode=1;}
  }
}

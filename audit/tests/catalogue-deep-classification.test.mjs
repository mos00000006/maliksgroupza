import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, cpSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const dir=mkdtempSync(join(tmpdir(),'catalogue-group-'));
try {
  const source=readFileSync(new URL('../app/catalogue-pdf-grouping.ts',import.meta.url),'utf8');
  // Types are only type aliases / signatures; compile with esbuild if installed or node strip-types.
  const tmp=join(dir,'grouping.ts'); const {writeFileSync}=await import('node:fs'); writeFileSync(tmp,source);
  const { cataloguePdfCategory: classify }=await import(`file://${tmp}`);
  const samples=[
    ['UG 110MMX45 DEG PLAIN Y JUNCTION','Plumbing','Underground (UG)'],
    ['SV 110MMX45 DEG PLAIN BEND','Plumbing','Soil & Vent (SV)'],
    ['FITTING COMP HDPE 90DEG ELBOW 20MM','Plumbing','HDPE & Compression Fittings'],
    ['W 50MMX45 DEG PLAIN BEND','Plumbing','Waste & Trap Fittings'],
    ['PIPE UG 110MMX6M','Plumbing','Plumbing Pipes'],
    ['Alco Aluminium Blinds 25mm','Homeware','Window Blinds & Treatments'],
    ['BLIND RIVET 3.2X06','Fasteners & Ironmongery','Fasteners'],
    ['DRILL BIT HSS 10MM','General Hardware','Tools'],
    ['ELECTRICAL SOCKET 16A','Plumbing','Electrical & Lighting'],
    ['WATERPROOFING MEMBRANE','Roofing','Waterproofing'],
    ['BOARD CEILING GYPSUM','Roofing','Boards & Ceilings'],
    ['TIMBER BXX/SABS PURLIN','Roofing','Timber'],
    ['FANCY CYLINDER LOCKSET','Fasteners & Ironmongery','Locksets'],
    ['110MM UG DOUBLE RR SOCKET','Plumbing','Underground (UG)'],
    ['110MM SV DOUBLE RR SOCKET','Plumbing','Soil & Vent (SV)'],
    ['MASTERBATTS 15MM','Plumbing','Plumbing Accessories'],
    ['SOCKET SET 1/2 INCH','Fittings','Tools'],
    ['MISCELLANEOUS ADAPTOR','Fittings','Plumbing Accessories'],
  ];
  for(const [name,category,expected] of samples) test(`${name} -> ${expected}`,()=>assert.equal(classify({name,category}),expected));
  test('does not create mixed Fittings category',()=>assert.ok(!samples.some(([name,category])=>classify({name,category})==='Fittings')));
} finally { /* tmp kept until tests complete */ }

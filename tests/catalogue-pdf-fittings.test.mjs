import assert from 'node:assert/strict';
import test from 'node:test';
import { build } from 'esbuild';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const temp=mkdtempSync(join(tmpdir(),'catalogue-clean-'));
const entry=join(process.cwd(),'app/catalogue-pdf-grouping.ts');
const output=join(temp,'grouping.mjs');
await build({entryPoints:[entry],bundle:true,platform:'node',format:'esm',outfile:output});
const {cataloguePdfCategory:c}=await import(pathToFileURL(output));
const cases=[
 ['UG 110MM 45 DEG PLAIN BEND','Plumbing','Underground (UG)'],
 ['SV 110MM 45 DEG PLAIN BEND','Plumbing','Soil & Vent (SV)'],
 ['PIPE UG 110MMX6M','Plumbing','Plumbing Pipes'],
 ['FITTING COMP HDPE ELBOW','Plumbing','HDPE & Compression Fittings'],
 ['FITTING COMP COPPER ELBOW','Plumbing','Copper & Brass Fittings'],
 ['W 50MMX45 DEG PLAIN BEND','Plumbing','Waste & Trap Fittings'],
 ['ALCO ALUMINIUM BLINDS 25MM','Homeware','Window Blinds & Treatments'],
 ['BLIND RIVET 3.2X06','Fasteners & Ironmongery','Fasteners'],
 ['FANCY CYLINDER LOCKSET','Fasteners & Ironmongery','Locksets'],
 ['BOARD CEILING GYPSUM','Roofing','Boards & Ceilings'],
 ['WATERPROOFING MEMBRANE','Roofing','Waterproofing'],
 ['TOMMY FIX WALL PLUG RANGE','Fasteners & Ironmongery','Fasteners'],
 ['POWERGRIPP CORNICE ADHESIVE','Adhesives & Chemicals','Adhesives & Chemicals'],
 ['SOCKET SET 1/2','Fittings','Tools'],
 ['BLIND FLANGE 15MM','Fittings','Plumbing Accessories'],
];
for(const [name,category,expected] of cases)test(name,()=>assert.equal(c({name,category}),expected));
test('No mixed Fittings output',()=>assert.ok(cases.every(([name,category])=>c({name,category})!=='Fittings')));

import test from 'node:test';
import assert from 'node:assert/strict';
import {runInNewContext} from 'node:vm';
import quoteFrontend from '../src/mobile-quote-frontend.mjs';

test('Maliks Quote browser startup survives bundler __name() insertion', async()=>{
  const response=await quoteFrontend.fetch(new Request('https://maliks-quote.example.test/quote-app.js'),{});
  assert.equal(response.status,200);
  assert.match(response.headers.get('content-type')||'',/javascript/i);
  const served=await response.text();
  assert.match(served,/^const __name=\(target,_label\)=>target;/,
    'esbuild helper must precede the serialized Quote browser function');
  assert.match(served,/function mobileQuoteBrowser\(/);
  // Emulate what Cloudflare Wrangler adds in the deployed JS. Previously this
  // exact type of call threw ReferenceError: __name is not defined.
  const compiledLike=served.replace('const $=id=>document.getElementById(id);',
    'const $=__name(id=>document.getElementById(id),"$");');
  assert.notEqual(compiledLike,served,'The regression must exercise an injected helper call');

  const elements=new Map();
  const element=(id='')=>{
    if(!elements.has(id)){
      const node={id,value:'',hidden:id==='workspace'||id==='change-password',
        disabled:false,textContent:'',classList:{toggle(){}},
        addEventListener(){},append(...children){if(id==='branch'&&!this.value&&children.length)this.value=children[0].value||'';},
        replaceChildren(){this.value='';},setAttribute(){},scrollIntoView(){}};
      elements.set(id,node);
    }
    return elements.get(id);
  };
  const document={getElementById:element,querySelector:()=>null,
    createElement:()=>({value:'',textContent:'',classList:{toggle(){}},addEventListener(){},append(){},setAttribute(){}}),
    addEventListener(){}};
  const window={addEventListener(){},scrollTo(){}};
  const payload={app:'pos',user:{name:'Test Staff',role:'Developer / Technical Admin'},
    branches:['Branch A'],password_change_required:false};
  let calls=0;
  const fetch=async url=>{
    assert.equal(url,'/api/session');calls++;
    return Response.json(payload);
  };
  runInNewContext(compiledLike,{document,window,location:{search:''},fetch,
    AbortController,URL,URLSearchParams,Response,Intl,setTimeout,clearTimeout});
  await new Promise(resolve=>setTimeout(resolve,25));
  assert.ok(calls>=1,'JavaScript should request the live session');
  assert.equal(element('login').hidden,true,'Login panel should close after a valid session');
  assert.equal(element('workspace').hidden,false,'Quotation workspace must open');
  assert.equal(element('branch').value,'Branch A');
});

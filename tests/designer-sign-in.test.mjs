import test from 'node:test';import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';import {readFileSync} from 'node:fs';import {pbkdf2Sync} from 'node:crypto';import {build} from 'esbuild';
async function load(entry){
 const result=await build({entryPoints:[new URL(entry,import.meta.url).pathname],bundle:true,platform:'node',format:'esm',write:false,plugins:[{name:'test-bindings',setup(b){b.onResolve({filter:/^cloudflare:workers$/},()=>({path:'env',namespace:'test'}));b.onLoad({filter:/.*/,namespace:'test'},()=>({contents:'export const env=globalThis.__designerEnv;'}));b.onLoad({filter:/app\/api\/access\.ts$/},()=>({contents:'export async function getHubMember(){return globalThis.__designerMember;}'}));}}]});
 return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}#${Math.random()}`);
}
const owner={email:'owner@example.com',role:'Owner / Admin',access_scope:'Full company'};
const password='test-password-only';
function fixture(){const db=new DatabaseSync(':memory:');db.exec(readFileSync(new URL('../drizzle/0036_price_tag_designer_sign_in.sql',import.meta.url),'utf8'));const salt='12'.repeat(16);db.prepare('UPDATE price_tag_designer_accounts SET password_salt=?,password_hash=?').run(salt,pbkdf2Sync(password,Buffer.from(salt,'hex'),100000,32,'sha256').toString('hex'));globalThis.__designerEnv={DB:{prepare(sql){let args=[];return{bind(...v){args=v;return this},async first(){return db.prepare(sql).get(...args)||null},async run(){db.prepare(sql).run(...args);return{success:true}}}}}};globalThis.__designerMember=owner;return db;}
const login=(username='Moses Moyana',pass=password,origin='https://example.com')=>new Request('https://example.com/api/price-tags/designer-session',{method:'POST',headers:{'content-type':'application/json',origin},body:JSON.stringify({username,password:pass})});
test('designer credentials issue secure, hashed sessions bound to the Hub user; expiry and logout revoke access',async()=>{
 const db=fixture();const api=await load('../app/api/price-tags/designer-session/route.ts');const auth=await load('../app/api/price-tags/designer-auth.ts');
 globalThis.__designerMember=null;assert.equal((await api.POST(login())).status,403);globalThis.__designerMember=owner;
 assert.equal((await api.POST(login('Moses Moyana',password,'https://other.example'))).status,403);
 assert.equal((await api.POST(login('Moses Moyana','wrong'))).status,401);assert.equal((await api.POST(login('wrong name'))).status,401);
 const response=await api.POST(login('  mOses   Moyana  '));assert.equal(response.status,200);const setCookie=response.headers.get('set-cookie');for(const property of ['HttpOnly','Secure','SameSite=Strict','Max-Age=28800'])assert.ok(setCookie.includes(property));
 const cookie=setCookie.split(';')[0];assert.notEqual(db.prepare('SELECT token_hash FROM price_tag_designer_sessions').get().token_hash,cookie.split('=')[1]);
 assert.equal(await auth.hasDesignerSession(owner,cookie),true);assert.equal(await auth.hasDesignerSession({...owner,email:'other@example.com'},cookie),false);assert.equal(await auth.hasDesignerSession(owner,''),false);
 db.exec('UPDATE price_tag_designer_accounts SET active=0');assert.equal(await auth.hasDesignerSession(owner,cookie),false);db.exec('UPDATE price_tag_designer_accounts SET active=1');db.exec('UPDATE price_tag_designer_sessions SET expires_at=0');assert.equal(await auth.hasDesignerSession(owner,cookie),false);
 const second=await api.POST(login());const secondCookie=second.headers.get('set-cookie').split(';')[0];const logout=await api.DELETE(new Request('https://example.com/api/price-tags/designer-session',{method:'DELETE',headers:{origin:'https://example.com',cookie:secondCookie}}));assert.equal(logout.status,200);assert.ok(logout.headers.get('set-cookie').includes('Max-Age=0'));assert.equal(await auth.hasDesignerSession(owner,secondCookie),false);db.close();
});
test('sign-in attempts are throttled and every price tag management endpoint requires designer authentication',async()=>{
 const db=fixture();const api=await load('../app/api/price-tags/designer-session/route.ts');for(let i=0;i<5;i++)assert.equal((await api.POST(login('Moses Moyana','wrong'))).status,401);
 const blocked=await api.POST(login());assert.equal(blocked.status,429);assert.ok(Number(blocked.headers.get('retry-after'))>0);db.exec('UPDATE price_tag_designer_login_attempts SET window_started=0');assert.equal((await api.POST(login())).status,200);
 const admin=await load('../app/api/price-tags/route.ts');assert.equal((await admin.GET(new Request('https://example.com/api/price-tags?code=X'))).status,401);assert.equal((await admin.POST(new Request('https://example.com/api/price-tags',{method:'POST',body:'{}'}))).status,401);
 for(const name of ['image','picture']){const route=await load(`../app/api/price-tags/${name}/route.ts`);const response=name==='image'?await route.GET(new Request('https://example.com/api/price-tags/image')):await route.POST(new Request('https://example.com/api/price-tags/picture',{method:'POST'}));assert.equal(response.status,401);}
 db.close();delete globalThis.__designerEnv;delete globalThis.__designerMember;
});

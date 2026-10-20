export function isD1DailyLimit(error:unknown):boolean {
  const seen=new Set<unknown>();
  let current:unknown=error;
  while(current&&!seen.has(current)){
    seen.add(current);
    const record=typeof current==='object'?current as {message?:unknown;code?:unknown;cause?:unknown}:null;
    if(record&&String(record.code)==='7500')return true;
    const message=String(record?.message??current);
    if(/daily[^\n]*(?:row|read|write)[^\n]*(?:limit|exceed)|(?:row|read|write)[^\n]*daily[^\n]*limit|(?:code\s*[:=]?\s*|D1_ERROR:\s*)7500\b/i.test(message))return true;
    current=record?.cause;
  }
  return false;
}
export function dailyLimitDetails(now=new Date()){
  const reset=new Date(now);reset.setUTCHours(24,0,0,0);
  const date=new Intl.DateTimeFormat('en-ZA',{timeZone:'Africa/Johannesburg',day:'numeric',month:'long',year:'numeric'}).format(reset);
  return {reset_at:reset.toISOString(),retry_after:Math.max(1,Math.ceil((reset.getTime()-now.getTime())/1000)),message:`Daily usage limit reached. Please try opening the Hub again after 02:00 on ${date} (South African time), or ask the Hub owner to upgrade the Cloudflare plan to restore access sooner.`};
}
export function dailyLimitResponse(request:Request,now=new Date()){
  const details=dailyLimitDetails(now);
  const headers={'cache-control':'no-store','retry-after':String(details.retry_after),'x-hub-daily-limit':'reached'};
  const pathname=new URL(request.url).pathname;
  if(pathname.startsWith('/api/')||request.headers.get('rsc')==='1'||request.headers.get('accept')?.includes('application/json')){
    return Response.json({error:details.message,code:'DAILY_LIMIT_REACHED',reset_at:details.reset_at},{status:503,headers});
  }
  return new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Daily limit reached | PowerBuild Hub</title><style>*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:#eef3f8;color:#143653;font-family:Arial,sans-serif;padding:22px}.card{width:min(570px,100%);background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 18px 60px #163c5920}.brand{background:#084b86;border-bottom:7px solid #ffd000;color:#ffd000;padding:23px 30px;font-size:18px;font-weight:900}.content{padding:32px}h1{font-size:28px;margin:0 0 18px}p{line-height:1.65;color:#4b6378}.notice{padding:14px;background:#f3f7fb;border-radius:10px}.actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:24px}a,button{font:700 14px Arial,sans-serif;padding:13px 17px;border-radius:8px;text-decoration:none;border:0;background:#084b86;color:#fff;cursor:pointer}a.owner{background:#ffd000;color:#143653}.small{font-size:12px;margin-bottom:0}</style></head><body><main class="card"><div class="brand">POWERBUILD HUB</div><section class="content"><h1>Daily usage limit reached</h1><p>${details.message}</p><p class="notice">The Hub is temporarily unable to access its database. The catalogue is unavailable while this limit applies.</p><div class="actions"><button onclick="location.reload()">Try again</button><a class="owner" href="https://dash.cloudflare.com/" target="_blank" rel="noopener noreferrer">Hub owner: upgrade plan</a></div><p class="small">Only the Hub owner needs to manage billing. Staff do not need to pay for their own accounts.</p></section></main></body></html>`,{status:503,headers:{...headers,'content-type':'text/html; charset=utf-8'}});
}

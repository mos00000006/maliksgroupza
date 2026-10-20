import { env } from "cloudflare:workers";
const raster = /^image\/(?:png|jpeg|webp|gif|avif)(?:;|$)/i;
const allowed = new Set(["pulsetiles.co.za","www.pulsetiles.co.za","conantools.net","www.conantools.net","conantoolsusa.com","www.conantoolsusa.com"]);
export async function tagImageResponse(req: Request, row: { image_key: string; image_type: string } | null) {
  if (!row?.image_key) return new Response("Not found", { status: 404 });
  try {
    let response: Response;
    if (row.image_key.startsWith("static:")) {
      const path = row.image_key.slice(7);
      if (!/^\/(?:catalogue|wholesale-products|price-tag-assets)\/[a-zA-Z0-9_./-]+\.(?:png|jpe?g|webp|gif|avif)$/i.test(path) || path.includes("..")) return new Response("Not found", { status: 404 });
      response = await env.ASSETS.fetch(new Request(new URL(path, req.url)));
    } else if (row.image_key.startsWith("external:")) {
      let url = new URL(row.image_key.slice(9)); let result: Response | null = null;
      for (let hops=0; hops<4; hops++) {
        if (url.protocol!=="https:" || !allowed.has(url.hostname) || url.username || url.password || url.port) return new Response("Not found",{status:404});
        result = await fetch(url,{headers:{accept:"image/avif,image/webp,image/*,*/*;q=0.8","user-agent":"PowerBuild-Catalogue/1.0",referer:`https://${url.hostname}/`},redirect:"manual"});
        if (![301,302,303,307,308].includes(result.status)) break;
        const location=result.headers.get("location"); if (!location) return new Response("Not found",{status:404});
        await result.body?.cancel(); url=new URL(location,url); result=null;
      }
      if (!result) return new Response("Not found",{status:404});
      response=result;
    } else {
      const object=await env.BUCKET.get(row.image_key); if(!object) return new Response("Not found",{status:404});
      response=new Response(object.body,{headers:{"content-type":row.image_type || "image/png"}});
    }
    const type=response.headers.get("content-type") || row.image_type;
    if (!response.ok || !response.body || !raster.test(type || "")) return new Response("Not found",{status:404});
    return new Response(response.body,{headers:{"content-type":type,"cache-control":"no-store","x-content-type-options":"nosniff"}});
  } catch {return new Response("Not found",{status:404});}
}

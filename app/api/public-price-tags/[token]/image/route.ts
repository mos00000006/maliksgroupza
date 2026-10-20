import { env } from "cloudflare:workers";
import { TAG_TOKEN } from "../../../../lib/price-tags";
export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!TAG_TOKEN.test(token)) return new Response("Not found", { status: 404 });
  const row = await env.DB.prepare(`SELECT p.image_key,p.image_type FROM powerbuild_price_tags t JOIN catalogue_products p ON p.id=t.product_id WHERE t.token=? AND t.published=1 AND p.active=1`).bind(token).first<{ image_key: string; image_type: string }>();
  if (!row?.image_key) return new Response("Not found", { status: 404 });
  try {
    let response: Response;
    if (row.image_key.startsWith("static:")) {
      const path = row.image_key.slice(7);
      if (!/^\/(?:catalogue|wholesale-products)\/[a-zA-Z0-9_./-]+\.(?:png|jpe?g|webp|gif)$/i.test(path) || path.includes("..")) return new Response("Not found", { status: 404 });
      // Fetch through the deployment's asset binding; retain the public tag gate.
      response = await env.ASSETS.fetch(new Request(new URL(path, req.url)));
    } else if (row.image_key.startsWith("external:")) {
      const url = new URL(row.image_key.slice(9));
      const hosts = ["pulsetiles.co.za", "www.pulsetiles.co.za", "conantools.net", "www.conantools.net", "conantoolsusa.com", "www.conantoolsusa.com"];
      if (url.protocol !== "https:" || !hosts.includes(url.hostname) || url.username || url.password || url.port) return new Response("Not found", { status: 404 });
      response = await fetch(url, { headers: { accept: "image/*" }, redirect: "error" });
    } else {
      const object = await env.BUCKET.get(row.image_key);
      if (!object) return new Response("Not found", { status: 404 });
      response = new Response(object.body, { headers: { "content-type": row.image_type } });
    }
    if (!response.ok || !response.body || !/^image\/(?:png|jpeg|webp|gif|avif)(?:;|$)/i.test(response.headers.get("content-type") || "")) return new Response("Not found", { status: 404 });
    return new Response(response.body, { headers: { "content-type": response.headers.get("content-type") || "image/webp", "cache-control": "no-store", "x-content-type-options": "nosniff" } });
  } catch { return new Response("Not found", { status: 404 }); }
}

import { env } from "cloudflare:workers";
import { getHubMember } from "../../../access";
import { initCatalogueTable } from "../../shared";

const allowedHost = (hostname: string) => {
  const clean = hostname.toLowerCase();
  return clean === "pulsetiles.co.za" || clean.endsWith(".pulsetiles.co.za");
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await initCatalogueTable();
  const member = await getHubMember({ allowBuyerAccess: true, allowStockOrdersAccess: true });
  if (!member) return new Response("Not found", { status: 404 });

  const { id } = await params;
  const row = await env.DB.prepare(
    "SELECT image_key,image_name FROM catalogue_products WHERE id=? AND active=1",
  )
    .bind(id)
    .first<{ image_key: string; image_name: string }>();

  if (!row?.image_key?.startsWith("external:")) return new Response("Not found", { status: 404 });
  const rawUrl = row.image_key.slice("external:".length);

  let imageUrl: URL;
  try {
    imageUrl = new URL(rawUrl);
  } catch {
    return new Response("Not found", { status: 404 });
  }
  if (imageUrl.protocol !== "https:" || !allowedHost(imageUrl.hostname))
    return new Response("Not found", { status: 404 });

  const response = await fetch(imageUrl.toString(), {
    headers: {
      accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      "user-agent": "PowerBuild-Catalogue/1.0",
      referer: "https://pulsetiles.co.za/",
    },
    cf: { cacheEverything: true, cacheTtl: 60 * 60 * 24 * 30 },
  }).catch(() => null);

  if (!response?.ok || !response.body) return new Response("Not found", { status: 404 });
  const contentType = response.headers.get("content-type") || "image/jpeg";
  if (!contentType.toLowerCase().startsWith("image/")) return new Response("Not found", { status: 404 });

  const filename = (row.image_name || imageUrl.pathname.split("/").pop() || "pulse-tile.jpg").replaceAll('"', "");
  return new Response(response.body, {
    headers: {
      "content-type": contentType,
      "cache-control": "private, max-age=2592000, stale-while-revalidate=604800",
      "content-disposition": `inline; filename="${filename}"`,
    },
  });
}

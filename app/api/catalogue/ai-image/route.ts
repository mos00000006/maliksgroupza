import { env } from "cloudflare:workers";
import { getHubMember } from "../../access";
import { canManageCatalogue, initCatalogueTable, productResponse } from "../shared";

type CatalogueRow = Record<string, unknown> & {
  id: number;
  code: string;
  name: string;
  description: string;
  category: string;
  image_key: string;
};

const decodeBase64 = (value: string) => {
  const clean = value.includes(",") ? value.slice(value.indexOf(",") + 1) : value;
  const binary = atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
};

function extractImageBase64(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const root = payload as { output?: unknown[]; data?: unknown[] };

  for (const item of root.output || []) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    if (row.type === "image_generation_call" && typeof row.result === "string" && row.result.length > 1000)
      return row.result;
    if (Array.isArray(row.content)) {
      for (const part of row.content) {
        if (!part || typeof part !== "object") continue;
        const content = part as Record<string, unknown>;
        for (const key of ["image_base64", "b64_json", "base64", "result"]) {
          const value = content[key];
          if (typeof value === "string" && value.length > 1000) return value;
        }
      }
    }
  }

  for (const item of root.data || []) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    for (const key of ["b64_json", "image_base64", "base64"]) {
      const value = row[key];
      if (typeof value === "string" && value.length > 1000) return value;
    }
  }
  return null;
}

function imagePrompt(product: CatalogueRow) {
  const description = String(product.description || product.name || "").trim();
  return `Create one clean e-commerce catalogue product image for a South African hardware store.
Product stock description: ${description}
Category: ${product.category || "General Hardware"}
Stock code for reference only: ${product.code}

Requirements:
- Show the actual physical item described, not an abstract icon.
- One product or the exact multipack/set described, centred and fully visible.
- Realistic materials, proportions and hardware-store product appearance.
- Clean product photography / high-quality 3D product render style.
- Transparent background with a subtle natural product shadow only.
- No price, no promotional badge, no watermark and no extra text.
- Do not print the stock code on the image.
- Do not invent a brand logo when the description does not specify a brand.
- Square composition suitable for a product catalogue card.`;
}

async function callImageGeneration(key: string, product: CatalogueRow) {
  const baseBody = {
    model: "gpt-5.6-luna",
    input: imagePrompt(product),
    store: false,
  };

  const request = async (tool: Record<string, unknown>) =>
    fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        authorization: `Bearer ${key}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        ...baseBody,
        tools: [tool],
      }),
    });

  let response = await request({
    type: "image_generation",
    size: "1024x1024",
    quality: "low",
    background: "transparent",
    output_format: "png",
  });

  // Keep compatibility with deployments where the image-generation tool only
  // accepts the minimal tool declaration.
  if (!response.ok && response.status === 400) {
    response = await request({ type: "image_generation" });
  }

  const text = await response.text();
  let payload: unknown = {};
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = {};
  }
  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload
        ? JSON.stringify((payload as { error?: unknown }).error).slice(0, 500)
        : text.slice(0, 500);
    throw new Error(message || `Image generation failed (${response.status}).`);
  }

  const base64 = extractImageBase64(payload);
  if (!base64) throw new Error("The image service did not return a product picture.");
  return decodeBase64(base64);
}

export async function GET() {
  await initCatalogueTable();
  const member = await getHubMember();
  if (!member || !canManageCatalogue(member.email))
    return Response.json({ error: "Catalogue editing is restricted." }, { status: 403 });

  const missing = await env.DB.prepare(
    "SELECT COUNT(*) AS total FROM catalogue_products WHERE active=1 AND image_key=''",
  ).first<{ total: number }>();
  const key = (env as unknown as { OPENAI_API_KEY?: string }).OPENAI_API_KEY;
  return Response.json({
    configured: Boolean(key),
    missing: Number(missing?.total || 0),
  });
}

export async function POST(req: Request) {
  await initCatalogueTable();
  const member = await getHubMember();
  if (!member || !canManageCatalogue(member.email))
    return Response.json({ error: "Catalogue editing is restricted." }, { status: 403 });

  const key = (env as unknown as { OPENAI_API_KEY?: string }).OPENAI_API_KEY;
  if (!key)
    return Response.json(
      { error: "OPENAI_API_KEY is not configured for catalogue image generation." },
      { status: 503 },
    );

  let requestedId = 0;
  try {
    const body = (await req.json()) as { id?: number | string };
    requestedId = Number(body?.id || 0) || 0;
  } catch {
    // Empty body means generate the next catalogue item that has no picture.
  }

  const product = requestedId
    ? await env.DB.prepare("SELECT * FROM catalogue_products WHERE id=? AND active=1")
        .bind(requestedId)
        .first<CatalogueRow>()
    : await env.DB.prepare(
        "SELECT * FROM catalogue_products WHERE active=1 AND image_key='' ORDER BY id ASC LIMIT 1",
      ).first<CatalogueRow>();

  if (!product) {
    const missing = await env.DB.prepare(
      "SELECT COUNT(*) AS total FROM catalogue_products WHERE active=1 AND image_key=''",
    ).first<{ total: number }>();
    return Response.json({ done: true, missing: Number(missing?.total || 0) });
  }

  let bytes: Uint8Array;
  try {
    bytes = await callImageGeneration(key, product);
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Could not generate the product picture.",
        product: { id: product.id, code: product.code, name: product.name },
      },
      { status: 502 },
    );
  }

  const oldKey = String(product.image_key || "");
  const safeCode = String(product.code || "product").replace(/[^a-zA-Z0-9._-]+/g, "-");
  const imageName = `${safeCode}-catalogue-ai.png`;
  const imageKey = `catalogue/ai/${crypto.randomUUID()}-${imageName}`;
  await env.BUCKET.put(imageKey, bytes, {
    httpMetadata: { contentType: "image/png" },
  });

  const now = new Date().toISOString();
  const updated = await env.DB.prepare(
    `UPDATE catalogue_products SET
      image_name=?, image_type='image/png', image_size=?, image_key=?, updated_by=?, updated_at=?
     WHERE id=? RETURNING *`,
  )
    .bind(imageName, bytes.byteLength, imageKey, member.email, now, product.id)
    .first<Record<string, unknown>>();

  if (oldKey && oldKey !== imageKey)
    await env.BUCKET.delete(oldKey).catch(() => undefined);

  const missing = await env.DB.prepare(
    "SELECT COUNT(*) AS total FROM catalogue_products WHERE active=1 AND image_key=''",
  ).first<{ total: number }>();

  return Response.json({
    done: Number(missing?.total || 0) === 0,
    missing: Number(missing?.total || 0),
    product: updated ? productResponse(updated) : null,
  });
}

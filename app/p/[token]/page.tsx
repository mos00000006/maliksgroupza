import ProductScanPage from "./product-scan-page";
import { GET } from "../../api/public-price-tags/[token]/route";
import type { PriceTag } from "../../lib/price-tags";
export const dynamic = "force-dynamic";
export const metadata = { title: "Product & Price", robots: { index: false, follow: false } };
export default async function ProductPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ branch?: string }> }) {
  const { token } = await params;
  const branch = String((await searchParams).branch || "").trim().slice(0, 120);
  let initialProduct: PriceTag | null = null;
  try {
    // Use the same published-product filter as the anonymous API before rendering.
    // No browser request or brand hint is needed, including for existing QR tags.
    const url = new URL("https://localhost/");
    if (branch) url.searchParams.set("branch", branch);
    const response = await GET(new Request(url), { params: Promise.resolve({ token }) });
    if (response.ok) initialProduct = (await response.json()).product;
  } catch { /* The neutral customer shell can retry when the browser connects. */ }
  return <ProductScanPage key={`${token}:${branch}`} token={token} branch={branch} initialProduct={initialProduct} />;
}

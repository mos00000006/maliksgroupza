import ProductScanPage from "./product-scan-page";
import { GET } from "../../api/public-price-tags/[token]/route";
import type { PriceTag } from "../../lib/price-tags";
export const dynamic = "force-dynamic";
export const metadata = { title: "Product & Price", robots: { index: false, follow: false } };
export default async function ProductPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  let initialProduct: PriceTag | null = null;
  try {
    // Use the same published-product filter as the anonymous API before rendering.
    // No browser request or brand hint is needed, including for existing QR tags.
    const response = await GET(new Request("https://localhost/"), { params: Promise.resolve({ token }) });
    if (response.ok) initialProduct = (await response.json()).product;
  } catch { /* The neutral customer shell can retry when the browser connects. */ }
  return <ProductScanPage key={token} token={token} initialProduct={initialProduct} />;
}

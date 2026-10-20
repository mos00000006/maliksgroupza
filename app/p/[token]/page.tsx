import ProductScanPage from "./product-scan-page";
export const metadata = { title: "PowerBuild | Product & Price", robots: { index: false, follow: false } };
export default async function ProductPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params; return <ProductScanPage token={token} />;
}

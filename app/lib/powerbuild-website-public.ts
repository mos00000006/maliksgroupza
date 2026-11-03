const WEBSITE_ASSET = /^\/powerbuild\/(?:[a-z0-9._-]+|assets\/[a-z0-9._/-]+)$/i;
const STATIC_PRODUCT_ASSET = /^\/(?:catalogue|wholesale-products)\/[a-z0-9._/-]+\.(?:avif|gif|jpe?g|png|webp)$/i;

/** Public customer website routes. Company Hub and administration routes remain private. */
export function isPublicPowerBuildWebsiteRequest(request: Request) {
  const url = new URL(request.url);
  const path = url.pathname.length > 1 ? url.pathname.replace(/\/$/, "") : url.pathname;
  if (!["GET", "HEAD"].includes(request.method.toUpperCase())) return false;
  if (path === "/powerbuild" || WEBSITE_ASSET.test(path)) return true;
  if (path === "/api/ecommerce/public") return true;
  if (/^\/api\/ecommerce\/(?:product-image|special-image)\/\d+$/.test(path)) return true;
  return STATIC_PRODUCT_ASSET.test(path);
}

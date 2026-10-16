import type { Metadata } from "next";
import EcommerceStorefront from "../ecommerce-storefront";

export const metadata: Metadata = {
  title: "PowerBuild Wholesale Online | B2B Trade",
  description: "PowerBuild wholesale B2B ordering for approved hardware trade customers.",
};

export default function WholesaleShopPage() {
  return <EcommerceStorefront channel="B2B" />;
}

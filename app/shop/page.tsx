import type { Metadata } from "next";
import EcommerceStorefront from "../ecommerce-storefront";

export const metadata: Metadata = {
  title: "PowerBuild Online | Retail Hardware",
  description: "Shop PowerBuild hardware, building materials, paint, plumbing and more online.",
};

export default function RetailShopPage() {
  return <EcommerceStorefront channel="B2C" />;
}

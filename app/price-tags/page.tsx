import { headers } from "next/headers";
import PriceTagGenerator from "./price-tag-generator";
import DesignerSignIn, { DesignerWorkspace } from "./designer-sign-in";
import { getHubMember } from "../api/access";
import { canManagePriceTags } from "../api/price-tags/shared";
import { hasDesignerSession } from "../api/price-tags/designer-auth";
export const dynamic = "force-dynamic";
export const metadata = { title: "Graphic designer sign in | Price Tag Generator" };
export default async function PriceTagsPage() {
  const member = await getHubMember();
  if (!canManagePriceTags(member)) return <DesignerSignIn accessDenied />;
  const requestHeaders = await headers();
  let signedIn = false;
  try { signedIn = await hasDesignerSession(member, requestHeaders.get("cookie")); }
  catch { /* The form can explain a pending migration instead of crashing the page. */ }
  return signedIn ? <DesignerWorkspace><PriceTagGenerator /></DesignerWorkspace> : <DesignerSignIn />;
}

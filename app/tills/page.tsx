import type { Metadata } from "next";
import Link from "next/link";
import { getHubMember } from "../api/access";
import { tillBranches, tillMember } from "../api/tills/shared";
import TillCheckout from "./till-checkout";

export const metadata: Metadata = { title: "Sales / Tills | Maliks Group Hub" };

export default async function TillPage() {
  const member = await tillMember();
  if (!member) {
    const signedIn = await getHubMember({allowSalesTillsAccess:true,allowBuyerAccess:true,allowStockOrdersAccess:true,allowEmployeeRecordsOnly:true});
    return <main style={{padding:40,fontFamily:"Arial, sans-serif"}}><h1>Sales / Tills access required</h1>
      <p>{signedIn ? "Your current Hub assignment does not include Sales / Tills." : "Sign in with your approved Hub account."}</p>
      <Link href="/">Return to Hub</Link></main>;
  }
  const stores = await tillBranches(member);
  if (!stores.length) return <main style={{padding:40,fontFamily:"Arial, sans-serif"}}><h1>No store assigned</h1><p>Ask your Hub administrator to assign an active retail branch.</p></main>;
  return <TillCheckout username={member.name} role={member.role} stores={stores} accessScope={member.access_scope}/>;
}

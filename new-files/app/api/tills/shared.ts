import { env } from "cloudflare:workers";
import { allowedWorkspaces, getHubMember, type HubMember } from "../access";
import { SALES_TILLS_ROLE } from "../../lib/tills-route-policy";

const TILL_PREVIEW_ROLES = new Set([SALES_TILLS_ROLE, "Owner / Admin", "Developer / Technical Admin", "Store Manager", "Regional Manager"]);

export async function tillMember() {
  const member = await getHubMember({ allowSalesTillsAccess: true });
  return member && TILL_PREVIEW_ROLES.has(member.role) ? member : null;
}

export async function tillBranches(member: HubMember) {
  const assigned = allowedWorkspaces(member);
  const { results } = await env.DB.prepare("SELECT name FROM workspaces WHERE active=1 AND type='Store' ORDER BY name")
    .all<{name:string}>();
  return results.map(row => row.name).filter(name =>
    assigned === null || assigned.some(current => current.toLowerCase() === name.toLowerCase()),
  );
}

export function permittedBranch(allowed: readonly string[], wanted: string | null) {
  if (!allowed.length) return null;
  if (!wanted) return allowed.length === 1 ? allowed[0] : null;
  return allowed.find(branch => branch.toLowerCase() === wanted.trim().toLowerCase()) || null;
}

export function tillBrand(branch: string) {
  return /buster\s*build/i.test(branch) ? "busterbuild" as const : "powerbuild" as const;
}

export function tillsNoStore() {
  return Response.json({error:"No active retail store is assigned to your Hub account. Contact your administrator."}, {status:403,headers:{"cache-control":"no-store"}});
}

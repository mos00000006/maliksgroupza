import { tillBranches, tillMember, tillsNoStore } from "../shared";

export async function GET() {
  const member = await tillMember();
  if (!member) return Response.json({error:"Sales / Tills permission is required."}, {status:403});
  const branches = await tillBranches(member);
  if (!branches.length) return tillsNoStore();
  return Response.json({
    user:{name:member.name,role:member.role}, branches,
    mode:"DEMO_ONLY", sale_posting:false,
  }, {headers:{"cache-control":"no-store"}});
}

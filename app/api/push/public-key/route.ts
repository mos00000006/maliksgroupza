import { getAuthenticatedUser } from "../../../auth";
import { getHubMember } from "../../access";
import { getVapidConfig } from "../shared";

export async function GET() {
  const [user, member] = await Promise.all([getAuthenticatedUser(), getHubMember()]);
  if (!user?.email || !member)
    return Response.json({ error: "Hub access is not active." }, { status: 403 });
  const config = await getVapidConfig();
  return Response.json({ publicKey: config.public_key });
}

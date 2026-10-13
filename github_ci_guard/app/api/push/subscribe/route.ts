import { getAuthenticatedUser } from "../../../auth";
import { getHubMember } from "../../access";
import { removePushSubscription, savePushSubscription } from "../shared";

type SubscriptionPayload = {
  endpoint?: string;
  keys?: { p256dh?: string; auth?: string };
};

export async function POST(req: Request) {
  const [user, member] = await Promise.all([getAuthenticatedUser(), getHubMember()]);
  if (!user?.email || !member)
    return Response.json({ error: "Hub access is not active." }, { status: 403 });
  const body = (await req.json()) as SubscriptionPayload;
  if (!body.endpoint || !body.keys?.p256dh || !body.keys?.auth)
    return Response.json({ error: "Invalid push subscription." }, { status: 400 });
  await savePushSubscription(user.email, {
    endpoint: body.endpoint,
    keys: { p256dh: body.keys.p256dh, auth: body.keys.auth },
  });
  return Response.json({ ok: true });
}

export async function DELETE(req: Request) {
  const [user, member] = await Promise.all([getAuthenticatedUser(), getHubMember()]);
  if (!user?.email || !member)
    return Response.json({ error: "Hub access is not active." }, { status: 403 });
  const body = (await req.json()) as { endpoint?: string };
  if (body.endpoint) await removePushSubscription(user.email, body.endpoint);
  return Response.json({ ok: true });
}

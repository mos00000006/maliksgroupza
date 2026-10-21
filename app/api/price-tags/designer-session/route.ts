import { env } from "cloudflare:workers";
import { getHubMember } from "../../access";
import { canManagePriceTags } from "../shared";
import { designerCookie, designerToken, DESIGNER_SESSION_SECONDS, newDesignerToken, normalizeDesigner, sameOrigin, tokenHash, verifyDesignerPassword } from "../designer-auth";
const headers = { "cache-control": "no-store" };
export async function POST(req: Request) {
  const member = await getHubMember();
  if (!canManagePriceTags(member)) return Response.json({ error: "Sign in to the Hub with price tag manager access first." }, { status: 403, headers });
  if (!sameOrigin(req)) return Response.json({ error: "Open this sign-in form from the Hub." }, { status: 403, headers });
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return Response.json({ error: "Enter your username and password." }, { status: 400, headers }); }
  if (!body || typeof body.username !== "string" || typeof body.password !== "string" || body.username.length > 100 || body.password.length > 256) return Response.json({ error: "Enter your username and password." }, { status: 400, headers });
  const email = member!.email.trim().toLowerCase();
  const now = Math.floor(Date.now() / 1000);
  try {
    await env.DB.prepare(`INSERT INTO price_tag_designer_login_attempts (hub_email,attempts,window_started) VALUES (?,1,?) ON CONFLICT(hub_email) DO UPDATE SET attempts=CASE WHEN window_started<=? THEN 1 ELSE attempts+1 END,window_started=CASE WHEN window_started<=? THEN excluded.window_started ELSE window_started END`).bind(email, now, now - 300, now - 300).run();
    const attempts = await env.DB.prepare("SELECT attempts,window_started FROM price_tag_designer_login_attempts WHERE hub_email=?").bind(email).first<{ attempts: number; window_started: number }>();
    if (attempts && attempts.attempts > 5) return Response.json({ error: "Too many sign-in attempts. Try again in a few minutes." }, { status: 429, headers: { ...headers, "retry-after": String(Math.max(1, attempts.window_started + 300 - now)) } });
    const account = await env.DB.prepare("SELECT username_key,display_name,password_salt,password_hash FROM price_tag_designer_accounts WHERE username_key=? AND active=1").bind("moses moyana").first<{ username_key: string; display_name: string; password_salt: string; password_hash: string }>();
    if (!account) throw new Error("Designer account missing");
    const passwordOK = await verifyDesignerPassword(body.password, account.password_salt, account.password_hash);
    if (!passwordOK || normalizeDesigner(body.username) !== account.username_key) return Response.json({ error: "Username or password is incorrect." }, { status: 401, headers });
    await env.DB.prepare("DELETE FROM price_tag_designer_login_attempts WHERE hub_email=?").bind(email).run();
    await env.DB.prepare("DELETE FROM price_tag_designer_sessions WHERE expires_at<=?").bind(now).run();
    const previous = designerToken(req.headers.get("cookie"));
    if (previous) await env.DB.prepare("DELETE FROM price_tag_designer_sessions WHERE token_hash=? AND hub_email=?").bind(await tokenHash(previous), email).run();
    const token = newDesignerToken();
    await env.DB.prepare("INSERT INTO price_tag_designer_sessions (token_hash,hub_email,username_key,expires_at,created_at) VALUES (?,?,?,?,?)").bind(await tokenHash(token), email, account.username_key, now + DESIGNER_SESSION_SECONDS, now).run();
    return Response.json({ signed_in: true, name: account.display_name }, { headers: { ...headers, "set-cookie": designerCookie(token) } });
  } catch (error) {
    const needsSetup = error instanceof Error && /no such table|Designer account missing/i.test(error.message);
    return Response.json({ error: needsSetup ? "Graphic designer sign-in is not ready. Ask the Hub administrator to apply the designer sign-in migration and deploy this patch." : "Graphic designer sign-in is temporarily unavailable. Please try again." }, { status: 503, headers });
  }
}
export async function DELETE(req: Request) {
  if (!sameOrigin(req)) return Response.json({ error: "Open this action from the Hub." }, { status: 403, headers });
  const member = await getHubMember();
  const token = designerToken(req.headers.get("cookie"));
  if (member && token) await env.DB.prepare("DELETE FROM price_tag_designer_sessions WHERE token_hash=? AND hub_email=?").bind(await tokenHash(token), member.email.trim().toLowerCase()).run();
  return Response.json({ signed_in: false }, { headers: { ...headers, "set-cookie": designerCookie("", 0) } });
}

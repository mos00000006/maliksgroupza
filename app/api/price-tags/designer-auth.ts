import { env } from "cloudflare:workers";
import type { HubMember } from "../access";
export const DESIGNER_COOKIE = "__Host-hub_designer";
export const DESIGNER_SESSION_SECONDS = 8 * 60 * 60;
export const normalizeDesigner = (value: string) => value.trim().replace(/\s+/g, " ").toLowerCase();
const hex = (bytes: ArrayBuffer | Uint8Array) => Array.from(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes), b => b.toString(16).padStart(2, "0")).join("");
export const tokenHash = async (token: string) => hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token)));
export function designerToken(cookieHeader: string | null) {
  const cookie = cookieHeader?.split(";").map(s => s.trim()).find(s => s.startsWith(`${DESIGNER_COOKIE}=`));
  const token = cookie?.slice(DESIGNER_COOKIE.length + 1) || "";
  return /^[a-f0-9]{64}$/.test(token) ? token : "";
}
export async function hasDesignerSession(member: HubMember | null, cookieHeader: string | null) {
  if (!member) return false;
  const token = designerToken(cookieHeader);
  if (!token) return false;
  const row = await env.DB.prepare(`SELECT s.token_hash FROM price_tag_designer_sessions s JOIN price_tag_designer_accounts a ON a.username_key=s.username_key WHERE s.token_hash=? AND s.hub_email=? AND s.expires_at>? AND a.active=1`)
    .bind(await tokenHash(token), member.email.trim().toLowerCase(), Math.floor(Date.now() / 1000)).first();
  return Boolean(row);
}
export function designerRequired() {
  return Response.json({ error: "Graphic designer sign-in required. Please reopen Price tag generator to sign in.", code: "DESIGNER_SIGN_IN_REQUIRED" }, { status: 401, headers: { "cache-control": "no-store" } });
}
export function designerCookie(token: string, maxAge = DESIGNER_SESSION_SECONDS) {
  return `${DESIGNER_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
}
export function sameOrigin(req: Request) {
  return req.headers.get("origin") === new URL(req.url).origin;
}
export async function verifyDesignerPassword(password: string, salt: string, expected: string) {
  if (!/^[a-f0-9]{32}$/.test(salt) || !/^[a-f0-9]{64}$/.test(expected)) throw new Error("Designer account is not configured.");
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bytes = Uint8Array.from(salt.match(/../g)!, v => parseInt(v, 16));
  const actual = hex(await crypto.subtle.deriveBits({ name: "PBKDF2", salt: bytes, iterations: 100000, hash: "SHA-256" }, key, 256));
  let difference = 0;
  for (let i = 0; i < expected.length; i++) difference |= expected.charCodeAt(i) ^ actual.charCodeAt(i);
  return difference === 0;
}
export function newDesignerToken() { return hex(crypto.getRandomValues(new Uint8Array(32))); }

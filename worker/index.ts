import { isD1DailyLimit, dailyLimitResponse } from "../app/lib/daily-limit";
import { isPublicPriceTagRequest } from "../app/lib/price-tags";
/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { syncStoreSpecialLifecycleNotifications } from "../app/api/store-specials/shared";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  BUCKET: R2Bucket;
  OWNER_EMAIL: string;
  OWNER_NAME: string;
  CF_ACCESS_TEAM_DOMAIN?: string;
  CF_ACCESS_AUD?: string;
  LOCAL_DEV_AUTH?: string;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
  access?: {
    aud: string;
    getIdentity(): Promise<{ email?: string; name?: string } | null>;
  };
}

type AccessIdentity = { email?: string; name?: string };

let cachedAccessIssuer = "";
let cachedAccessJwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function accessJwksFor(issuer: string) {
  if (!cachedAccessJwks || cachedAccessIssuer !== issuer) {
    cachedAccessIssuer = issuer;
    cachedAccessJwks = createRemoteJWKSet(new URL(`${issuer}/cdn-cgi/access/certs`));
  }
  return cachedAccessJwks;
}

async function getAccessIdentity(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
): Promise<AccessIdentity | null> {
  const hostname = new URL(request.url).hostname;
  if (
    env.LOCAL_DEV_AUTH === "true" &&
    (hostname === "127.0.0.1" || hostname === "localhost")
  ) {
    return {
      email: env.OWNER_EMAIL,
      name: env.OWNER_NAME,
    };
  }

  // Local development and automated tests use the Vite Access simulator.
  if (ctx.access) return ctx.access.getIdentity();

  const token = request.headers.get("Cf-Access-Jwt-Assertion");
  const teamDomain = env.CF_ACCESS_TEAM_DOMAIN?.trim().replace(/\/$/, "");
  const audience = env.CF_ACCESS_AUD?.trim();
  if (!token || !teamDomain || !audience) return null;

  const issuer = teamDomain.startsWith("https://")
    ? teamDomain
    : `https://${teamDomain}`;
  const { payload } = await jwtVerify(token, accessJwksFor(issuer), {
    issuer,
    audience,
  });

  return {
    email: typeof payload.email === "string" ? payload.email : undefined,
    name: typeof payload.name === "string" ? payload.name : undefined,
  };
}

const PUBLIC_PATHS = new Set([
  "/favicon.svg",
  "/maliks-group-app-icon.svg",
  "/manifest.webmanifest",
  "/sw.js",
]);

type HubMember = { email: string; role: string; active: number };

function isPublicAsset(pathname: string) {
  return (
    PUBLIC_PATHS.has(pathname) ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/assets/")
  );
}

function accessPage(title: string, message: string, status = 403) {
  return new Response(
    `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>body{margin:0;background:#f4f7fb;color:#172438;font-family:Arial,sans-serif;display:grid;place-items:center;min-height:100vh}.card{width:min(520px,calc(100vw - 40px));background:#fff;border:1px solid #dce5ef;border-radius:18px;padding:34px;box-shadow:0 20px 70px #10243c24}.logo{width:52px;height:52px;border-radius:14px;display:grid;place-items:center;color:#fff;background:linear-gradient(135deg,#1769e8,#00a8bf);font-weight:900;font-size:19px}h1{font-size:25px;margin:22px 0 10px}p{color:#667386;line-height:1.65;font-size:14px}.help{padding:13px 15px;border-radius:10px;background:#edf5ff;color:#24517e}a{display:inline-block;margin-top:16px;color:#1769e8;font-weight:700;text-decoration:none}</style></head><body><main class="card"><div class="logo">MG</div><h1>${title}</h1><p>${message}</p><p class="help">Ask the Hub owner to add your exact email address under Team Access, then open your invitation again.</p><a href="/cdn-cgi/access/logout">Use a different account</a></main></body></html>`,
    {
      status,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
      },
    },
  );
}

async function authorisedMember(email: string, _fullName: string, env: Env) {
  void _fullName;
  if (!email) return { email: "", member: null as HubMember | null };

  const ownerEmail = env.OWNER_EMAIL.trim().toLowerCase();
  if (email === ownerEmail) {
    return {
      email,
      member: { email: ownerEmail, role: "Owner / Admin", active: 1 } as HubMember,
    };
  }

  const member = await env.DB.prepare(
    "SELECT email,role,active FROM team_members WHERE lower(email)=? AND active=1",
  )
    .bind(email)
    .first<HubMember>();
  return { email, member: member || null };
}

function secure(response: Response) {
  const secured = new Response(response.body, response);
  secured.headers.set("x-content-type-options", "nosniff");
  secured.headers.set("x-frame-options", "DENY");
  secured.headers.set("referrer-policy", "strict-origin-when-cross-origin");
  secured.headers.set(
    "permissions-policy",
    "camera=(), microphone=(), geolocation=(self), payment=()",
  );
  secured.headers.set(
    "content-security-policy",
    "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self'; font-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'",
  );
  return secured;
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
    const url = new URL(request.url);

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return secure(await handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths));
    }

    if (!isPublicAsset(url.pathname) && !isPublicPriceTagRequest(url.pathname, request.method)) {
      let identity: AccessIdentity | null = null;
      try {
        identity = await getAccessIdentity(request, env, ctx);
      } catch {
        identity = null;
      }

      if (!identity) {
        const response = url.pathname.startsWith("/api/")
          ? Response.json({ error: "Secure company sign-in is required." }, { status: 401 })
          : accessPage(
              "Secure sign-in required",
              "This Hub is protected by PowerBuild company login. Ask the Hub owner if you need access.",
              401,
            );
        return secure(response);
      }

      const email = (identity?.email || "").trim().toLowerCase();
      const fullName = (identity?.name || "").trim();
      const { member } = await authorisedMember(email, fullName, env);
      if (!email) {
        return secure(Response.json({ error: "Your secure login did not provide an email address." }, { status: 401 }));
      }
      if (!member) {
        if (url.pathname.startsWith("/api/"))
          return secure(Response.json(
            { error: "This email has not been invited to the Hub." },
            { status: 403 },
          ));
        return secure(accessPage(
          "Invitation required",
          `The signed-in account ${email} is not yet approved for the Maliks Group Hub.`,
        ));
      }

      const canManage = ["Owner / Admin", "Developer / Technical Admin"].includes(member.role);
      if (
        ["Viewer", "Read only"].includes(member.role) &&
        !["GET", "HEAD", "OPTIONS"].includes(request.method) &&
        url.pathname !== "/api/team/accept"
      )
        return secure(Response.json(
          { error: "Viewer access is read-only." },
          { status: 403 },
        ));
      if (
        request.method !== "GET" &&
        url.pathname.startsWith("/api/team") &&
        member.role !== "Owner / Admin" &&
        url.pathname !== "/api/team/accept"
      )
        return secure(Response.json(
          { error: "Only the Hub owner can manage team access." },
          { status: 403 },
        ));
      if (
        request.method === "POST" &&
        url.pathname === "/api/workspaces" &&
        !canManage
      )
        return secure(Response.json(
          { error: "Manager access is required to create a store." },
          { status: 403 },
        ));

      const trustedHeaders = new Headers(request.headers);
      trustedHeaders.delete("x-maliks-hub-user-email");
      trustedHeaders.delete("x-maliks-hub-user-name");
      trustedHeaders.set("x-maliks-hub-user-email", email);
      trustedHeaders.set("x-maliks-hub-user-name", fullName || email);
      request = new Request(request, { headers: trustedHeaders });
    }

    const response=await handler.fetch(request, env, ctx);
    if(response.status>=500){
      // Framework routes can catch a D1 exception and return a generic 500.
      // Confirm quota exhaustion before replacing it with a limit message.
      if(isD1DailyLimit(await response.clone().text()))return secure(dailyLimitResponse(request));
      try{await env.DB.prepare("SELECT 1 AS hub_availability").first();}
      catch(error){if(isD1DailyLimit(error))return secure(dailyLimitResponse(request));}
    }
    return secure(response);
    } catch(error) {
      if(isD1DailyLimit(error))return secure(dailyLimitResponse(request));
      throw error;
    }
  },

  async scheduled(_controller: unknown, _env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(syncStoreSpecialLifecycleNotifications());
  },
};

export default worker;

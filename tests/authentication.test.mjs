import assert from "node:assert/strict";
import test from "node:test";

async function loadWorker() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("auth-test", `${process.pid}-${Date.now()}-${Math.random()}`);
  return (await import(workerUrl.href)).default;
}

function context(identity) {
  return {
    waitUntil() {},
    passThroughOnException() {},
    ...(identity
      ? {
          access: {
            aud: "powerbuild-test",
            async getIdentity() {
              return identity;
            },
          },
        }
      : {}),
  };
}

function environment(member = null) {
  return {
    OWNER_EMAIL: "msallikutti@gmail.com",
    OWNER_NAME: "Sulliman Alikutti",
    ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
    DB: {
      prepare() {
        return {
          bind() {
            return this;
          },
          async run() {
            return { success: true };
          },
          async first() {
            return member;
          },
        };
      },
    },
  };
}

test("rejects spoofed identity headers when Cloudflare Access is absent", async () => {
  const worker = await loadWorker();
  const response = await worker.fetch(
    new Request("http://localhost/api/tasks", {
      headers: { "x-maliks-hub-user-email": "msallikutti@gmail.com" },
    }),
    environment(),
    context(null),
  );
  assert.equal(response.status, 401);
});

test("rejects a securely authenticated email that is not invited", async () => {
  const worker = await loadWorker();
  const response = await worker.fetch(
    new Request("http://localhost/api/tasks"),
    environment(null),
    context({ email: "not-invited@example.com", name: "Not Invited" }),
  );
  assert.equal(response.status, 403);
});

test("blocks write requests for a read-only member", async () => {
  const worker = await loadWorker();
  const response = await worker.fetch(
    new Request("http://localhost/api/tasks", { method: "POST" }),
    environment({ email: "viewer@example.com", role: "Viewer", active: 1 }),
    context({ email: "viewer@example.com", name: "Viewer" }),
  );
  assert.equal(response.status, 403);
});

test("shows a friendly daily-limit page when staff login cannot read membership",async()=>{
 const worker=await loadWorker();const env=environment();env.DB.prepare=()=>({bind(){return this;},async first(){throw new Error("D1_ERROR: Your account has exceeded D1's free tier daily row read limit.");}});
 const response=await worker.fetch(new Request('http://localhost/'),env,context({email:'staff@example.com',name:'Staff'}));
 assert.equal(response.status,503);assert.match(await response.text(),/Daily usage limit reached/);
 const api=await worker.fetch(new Request('http://localhost/api/catalogue'),env,context({email:'staff@example.com',name:'Staff'}));assert.equal(api.status,503);assert.equal((await api.json()).code,'DAILY_LIMIT_REACHED');
});

import assert from "node:assert/strict";
import test from "node:test";

const developmentPreviewMeta =
  /<meta(?=[^>]*\bname=["']codex-preview["'])(?=[^>]*\bcontent=["']development["'])[^>]*>/i;

test("renders development preview metadata", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const response = await worker.fetch(
    new Request("http://localhost/", {
      headers: {
        accept: "text/html",
        "x-maliks-hub-user-email": "msallikutti@gmail.com",
        "x-maliks-hub-user-name": "Sulliman Alikutti",
      },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
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
              return {
                email: "msallikutti@gmail.com",
                role: "Owner / Admin",
                active: 1,
              };
            },
          };
        },
      },
      OWNER_EMAIL: "msallikutti@gmail.com",
      OWNER_NAME: "Sulliman Alikutti",
    },
    {
      waitUntil() {},
      passThroughOnException() {},
      access: {
        aud: "powerbuild-test",
        async getIdentity() {
          return {
            email: "msallikutti@gmail.com",
            name: "Sulliman Alikutti",
          };
        },
      },
    },
  );

  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /^text\/html\b/i,
  );
  assert.match(await response.text(), developmentPreviewMeta);
});

import assert from "node:assert/strict";
import test from "node:test";
import { build } from "esbuild";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = new URL("../", import.meta.url).pathname;
const temp = mkdtempSync(join(tmpdir(), "tork-price-picture-"));
const output = join(temp, "image-source.mjs");
const cloudflareStub = {
  name: "cloudflare-stub",
  setup(builder) {
    builder.onResolve({ filter: /^cloudflare:workers$/ }, () => ({ path: "env", namespace: "test" }));
    builder.onLoad({ filter: /.*/, namespace: "test" }, () => ({ contents: "export const env = {};" }));
  },
};

await build({
  entryPoints: [join(root, "app/api/price-tags/image-source.ts")],
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: output,
  plugins: [cloudflareStub],
});

const { tagImageResponse } = await import(pathToFileURL(output));

test("TorkCraft supplier pictures load through the price-tag proxy", async () => {
  const originalFetch = globalThis.fetch;
  let requestUrl = "";
  let requestOptions;
  globalThis.fetch = async (input, options) => {
    requestUrl = String(input);
    requestOptions = options;
    return new Response(new Uint8Array([255, 216, 255, 217]), {
      status: 200,
      headers: { "content-type": "image/jpeg" },
    });
  };
  try {
    const response = await tagImageResponse(
      new Request("https://hub.example/api/price-tags/image?product_id=1"),
      {
        image_key: "external:https://b2c.et-dev.co.za/img/rs:fit:500:500:1/ex:1/data/products/vermontsales/TCP15040.jpg?lm=1721989625",
        image_type: "image/jpeg",
      },
    );
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type"), "image/jpeg");
    assert.equal(new URL(requestUrl).hostname, "b2c.et-dev.co.za");
    assert.equal(requestOptions.headers.referer, "https://b2c.et-dev.co.za/");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("the proxy still blocks unapproved external picture hosts", async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return new Response();
  };
  try {
    const response = await tagImageResponse(new Request("https://hub.example/api/price-tags/image"), {
      image_key: "external:https://example.com/product.jpg",
      image_type: "image/jpeg",
    });
    assert.equal(response.status, 404);
    assert.equal(calls, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

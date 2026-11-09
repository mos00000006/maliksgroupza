import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const script = resolve(fileURLToPath(new URL("../scripts/prepare-cloudflare-config.mjs", import.meta.url)));
const secret = "a1b2c3d4-1234-4abc-8123-1234567890ab";
const placeholder = "00000000-0000-4000-8000-000000000000";

function runConfig(config, env = {}) {
  const root = mkdtempSync(join(tmpdir(), "maliks-wrangler-test-"));
  mkdirSync(join(root, "infrastructure"));
  mkdirSync(join(root, "dist", "server"), { recursive: true });
  writeFileSync(join(root, "infrastructure", "wrangler.jsonc"), JSON.stringify({
    d1_databases: [{ binding: "DB", database_name: "maliks-group-hub-db", database_id: placeholder }]
  }));
  writeFileSync(join(root, "dist", "server", "wrangler.json"), JSON.stringify(config, null, 2));
  const result = spawnSync(process.execPath, [script], {
    cwd: root,
    env: {
      ...process.env,
      MALIKS_GROUP_D1_DATABASE_ID: secret,
      CF_ACCESS_TEAM_DOMAIN: "https://example.cloudflareaccess.com",
      CF_ACCESS_AUD: "sample-access-audience",
      ...env,
    },
    encoding: "utf8",
  });
  const read = (name) => JSON.parse(readFileSync(join(root, name), "utf8"));
  return { root, result, read, cleanup: () => rmSync(root, { recursive: true, force: true }) };
}
const hub = { binding: "DB", database_name: "maliks-group-hub-db", database_id: placeholder };

test("deduplicates identical D1 bindings, removes access.dev and LOCAL_DEV_AUTH", () => {
  const run = runConfig({
    name: "maliks-group-hub",
    access: { dev: { aud: "test" } },
    vars: { LOCAL_DEV_AUTH: "true", OWNER_NAME: "Test" },
    d1_databases: [hub, { ...hub, migrations_dir: "../../drizzle" }],
    r2_buckets: [{ binding: "BUCKET", bucket_name: "maliks-group-hub-files" }],
    assets: { binding: "ASSETS" },
  });
  try {
    assert.equal(run.result.status, 0, run.result.stderr);
    const config = run.read("dist/server/wrangler.json");
    assert.equal(config.d1_databases.length, 1);
    assert.equal(config.d1_databases[0].database_id, secret);
    assert.equal(config.d1_databases[0].binding, "DB");
    assert.equal("access" in config, false);
    assert.equal("LOCAL_DEV_AUTH" in config.vars, false);
    assert.equal(config.vars.OWNER_NAME, "Test");
    assert.equal(config.r2_buckets[0].binding, "BUCKET");
    assert.equal(config.assets.binding, "ASSETS");
    assert.equal(run.read(".deploy/wrangler.jsonc").d1_databases[0].database_id, secret);
  } finally { run.cleanup(); }
});

test("preserves distinct D1 bindings", () => {
  const run = runConfig({
    d1_databases: [hub, { binding: "REPORTING", database_name: "reporting-db", database_id: "bbbbbbbb-1234-4abc-8123-1234567890ab" }, hub],
  });
  try {
    assert.equal(run.result.status, 0, run.result.stderr);
    assert.deepEqual(run.read("dist/server/wrangler.json").d1_databases.map((x) => x.binding), ["DB", "REPORTING"]);
  } finally { run.cleanup(); }
});

test("rejects different databases with the same binding name", () => {
  const run = runConfig({ d1_databases: [hub, { ...hub, database_name: "wrong-db" }] });
  try {
    assert.notEqual(run.result.status, 0);
    assert.match(run.result.stderr, /conflicting databases/);
  } finally { run.cleanup(); }
});

test("rejects DB binding pointed at an unexpected database", () => {
  const run = runConfig({ d1_databases: [{ ...hub, database_id: "bbbbbbbb-1234-4abc-8123-1234567890ab" }] });
  try {
    assert.notEqual(run.result.status, 0);
    assert.match(run.result.stderr, /does not match/);
  } finally { run.cleanup(); }
});

test("rejects missing database binding", () => {
  const run = runConfig({ d1_databases: [] });
  try {
    assert.notEqual(run.result.status, 0);
    assert.match(run.result.stderr, /does not match/);
  } finally { run.cleanup(); }
});

test("rejects missing required deployment secret", () => {
  const run = runConfig({ d1_databases: [hub] }, { MALIKS_GROUP_D1_DATABASE_ID: "" });
  try {
    assert.notEqual(run.result.status, 0);
    assert.match(run.result.stderr, /Set MALIKS_GROUP_D1_DATABASE_ID/);
  } finally { run.cleanup(); }
});

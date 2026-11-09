import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

// Run after the Hub build. Keep migrations and Worker deployment configs separate.
const databasePlaceholder = "00000000-0000-4000-8000-000000000000";
const domainPlaceholder = "https://replace-me.cloudflareaccess.com";
const audiencePlaceholder = "replace-with-access-audience";
const databaseName = "maliks-group-hub-db";

const databaseId = process.env.MALIKS_GROUP_D1_DATABASE_ID?.trim();
const teamDomain = process.env.CF_ACCESS_TEAM_DOMAIN?.trim().replace(/\/$/, "");
const audience = process.env.CF_ACCESS_AUD?.trim();

if (!databaseId || databaseId === databasePlaceholder) {
  throw new Error("Set MALIKS_GROUP_D1_DATABASE_ID in GitHub repository secrets.");
}
if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(databaseId)) {
  throw new Error("MALIKS_GROUP_D1_DATABASE_ID must be a Cloudflare D1 database UUID.");
}
if (!teamDomain || teamDomain.includes("replace-me")) {
  throw new Error("Set CF_ACCESS_TEAM_DOMAIN in GitHub repository secrets.");
}
if (!audience || audience === audiencePlaceholder) {
  throw new Error("Set CF_ACCESS_AUD in GitHub repository secrets.");
}

function configure(source) {
  return source
    .replaceAll(databasePlaceholder, databaseId)
    .replaceAll(domainPlaceholder, teamDomain)
    .replaceAll(audiencePlaceholder, audience);
}

function makeDeployConfig(source) {
  const config = JSON.parse(configure(source));
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    throw new Error("Generated Wrangler configuration is not a JSON object.");
  }

  // access.dev belongs to local Wrangler development, not the generated
  // production configuration (Wrangler 4.92 rejects this field).
  delete config.access;

  // Never ship the localhost-only authentication shortcut into production.
  if (config.vars && typeof config.vars === "object") {
    delete config.vars.LOCAL_DEV_AUTH;
  }

  if (!Array.isArray(config.d1_databases)) {
    throw new Error("The Hub build does not contain D1 bindings.");
  }

  // The generated Worker can contain two DB bindings from different build
  // environments, each with a different (often local/placeholder) ID. GitHub's
  // MALIKS_GROUP_D1_DATABASE_ID is the production source of truth. We only
  // reconcile entries that explicitly target this Hub database by name.
  // All other D1 bindings retain their IDs, and conflicting duplicates fail.
  const seen = new Map();
  const databases = [];
  let removed = 0;
  let hubFound = false;

  for (const item of config.d1_databases) {
    if (!item || typeof item !== "object" || typeof item.binding !== "string" || !item.binding.trim()) {
      throw new Error("A generated D1 binding is missing a valid name.");
    }
    if (item.binding === "DB") {
      if (item.database_name !== databaseName) {
        throw new Error(`D1 binding DB targets ${JSON.stringify(item.database_name)} instead of ${databaseName}. Refusing deployment.`);
      }
      if (hubFound) {
        removed++;
        continue;
      }
      hubFound = true;
      // Keep only the essential production fields. Build-only paths, local
      // preview IDs and injected environment metadata must not leak into deploy.
      const productionDB = {
        binding: "DB",
        database_name: databaseName,
        database_id: databaseId,
      };
      seen.set("DB", productionDB);
      databases.push(productionDB);
      continue;
    }

    if (typeof item.database_id !== "string" || !item.database_id.trim()) {
      throw new Error(`D1 binding ${item.binding} is missing its database ID.`);
    }
    const existing = seen.get(item.binding);
    if (existing) {
      if (JSON.stringify(existing) !== JSON.stringify(item)) {
        throw new Error(`D1 binding ${item.binding} is declared for conflicting databases. Refusing deployment.`);
      }
      removed++;
      continue;
    }
    seen.set(item.binding, item);
    databases.push(item);
  }
  if (!hubFound) {
    throw new Error(`Required production D1 binding DB for ${databaseName} is missing. Refusing deployment.`);
  }
  config.d1_databases = databases;

  // Detect cross-type collisions before Wrangler attempts the deployment.
  const otherBindings = ["r2_buckets", "kv_namespaces", "services", "durable_objects"];
  for (const key of otherBindings) {
    const list = key === "durable_objects" ? config.durable_objects?.bindings : config[key];
    if (!Array.isArray(list)) continue;
    for (const item of list) {
      const binding = item?.binding ?? item?.name;
      if (seen.has(binding)) {
        throw new Error(`Binding name ${binding} is shared by a D1 binding and ${key}. Refusing deployment.`);
      }
    }
  }
  console.log(`Production D1 bindings validated: ${databases.length} unique; ${removed} duplicate(s) removed.`);
  return JSON.stringify(config, null, 2) + "\n";
}

await mkdir(".deploy", { recursive: true });

const migrationSource = await readFile("infrastructure/wrangler.jsonc", "utf8");
const configuredMigrationSource = configure(migrationSource);
// Separate migration config is authoritative too. Do not silently change its
// database target or allow another conflicting DB binding there.
const migrationConfig = JSON.parse(configuredMigrationSource);
const migrationDbs = migrationConfig.d1_databases;
if (!Array.isArray(migrationDbs) ||
    migrationDbs.filter((item) => item?.binding === "DB").length !== 1 ||
    migrationDbs.some((item) => item?.binding === "DB" &&
      (item.database_name !== databaseName || item.database_id !== databaseId))) {
  throw new Error("Migration configuration must declare exactly one DB binding for the configured Maliks Hub database.");
}
await writeFile(".deploy/wrangler.jsonc", configuredMigrationSource);

const builtConfigPath = path.join("dist", "server", "wrangler.json");
// A missing build is a deployment error, not a reason to skip validation.
const builtSource = await readFile(builtConfigPath, "utf8");
await writeFile(builtConfigPath, makeDeployConfig(builtSource));

console.log("Maliks Group Hub Cloudflare deployment configuration prepared and validated.");

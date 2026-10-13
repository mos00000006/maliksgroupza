import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const databasePlaceholder = "00000000-0000-4000-8000-000000000000";
const domainPlaceholder = "https://replace-me.cloudflareaccess.com";
const audiencePlaceholder = "replace-with-access-audience";

const databaseId = process.env.MALIKS_GROUP_D1_DATABASE_ID?.trim();
const teamDomain = process.env.CF_ACCESS_TEAM_DOMAIN?.trim().replace(/\/$/, "");
const audience = process.env.CF_ACCESS_AUD?.trim();

if (!databaseId || databaseId === databasePlaceholder) {
  throw new Error("Set MALIKS_GROUP_D1_DATABASE_ID in GitHub repository secrets.");
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

await mkdir(".deploy", { recursive: true });

const migrationSource = await readFile("infrastructure/wrangler.jsonc", "utf8");
await writeFile(".deploy/wrangler.jsonc", configure(migrationSource));

const builtConfigPath = path.join("dist", "server", "wrangler.json");
try {
  const builtSource = await readFile(builtConfigPath, "utf8");
  await writeFile(builtConfigPath, configure(builtSource));
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
}

console.log("Cloudflare deployment configuration prepared.");

import vinext from "vinext";
import { defineConfig } from "vite";

// macOS Seatbelt blocks FSEvents, so Codex previews need polling for HMR.
const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === "seatbelt";
const databaseId =
  process.env.MALIKS_GROUP_D1_DATABASE_ID ||
  "00000000-0000-4000-8000-000000000000";

const independentCloudflareConfig = {
  name: "maliks-group-hub",
  main: "./worker/index.ts",
  compatibility_date: "2026-05-22",
  compatibility_flags: ["nodejs_compat"],
  vars: {
    OWNER_EMAIL: "msallikutti@gmail.com",
    OWNER_NAME: "Sulliman Alikutti",
    CF_ACCESS_TEAM_DOMAIN:
      process.env.CF_ACCESS_TEAM_DOMAIN || "https://replace-me.cloudflareaccess.com",
    CF_ACCESS_AUD: process.env.CF_ACCESS_AUD || "replace-with-access-audience",
    LOCAL_DEV_AUTH: "true",
  },
  d1_databases: [
    {
      binding: "DB",
      database_name: "maliks-group-hub-db",
      database_id: databaseId,
      migrations_dir: "drizzle",
    },
  ],
  r2_buckets: [
    {
      binding: "BUCKET",
      bucket_name: "maliks-group-hub-files",
    },
  ],
  access: {
    dev: {
      aud: "maliks-group-hub-local",
      identity: {
        email: "msallikutti@gmail.com",
        name: "Sulliman Alikutti",
      },
    },
  },
};

export default defineConfig(async () => {
  // Keep Wrangler and Miniflare state project-local. These are non-secret tool
  // settings; application environment belongs in ignored `.env*` files.
  process.env.WRANGLER_WRITE_LOGS ??= "false";
  process.env.WRANGLER_LOG_PATH ??= ".wrangler/logs";
  process.env.MINIFLARE_REGISTRY_PATH ??= ".wrangler/registry";

  // Wrangler snapshots its log path while the Cloudflare plugin is imported.
  const { cloudflare } = await import("@cloudflare/vite-plugin");

  return {
    server: {
      host: "127.0.0.1",
      port: 5173,
      strictPort: true,
      allowedHosts: ["127.0.0.1", "localhost", "terminal.local"],
      ...(isCodexSeatbeltSandbox
        ? { watch: { useFsEvents: false, usePolling: true } }
        : {}),
    },
    plugins: [
      vinext(),
      cloudflare({
        viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
        inspectorPort: false,
        remoteBindings: false,
        config: independentCloudflareConfig,
      }),
    ],
  };
});

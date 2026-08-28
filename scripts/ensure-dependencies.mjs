import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

const viteInstalled =
  existsSync("node_modules/.bin/vite") ||
  existsSync("node_modules/.bin/vite.cmd");

if (!viteInstalled) {
  console.log("Installing Hub packages for the first launch...");
  const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
  const result = spawnSync(npmCommand, ["ci"], { stdio: "inherit" });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

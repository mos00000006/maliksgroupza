import { copyFileSync, existsSync } from "node:fs";

if (!existsSync(".dev.vars")) {
  copyFileSync(".dev.vars.example", ".dev.vars");
  console.log("Created local environment file from .dev.vars.example.");
}

console.log("Local Maliks Group Hub environment is ready.");

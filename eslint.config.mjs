import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  {
    files: ["app/catalogue.tsx"],
    rules: {
      // The leaflet keyboard handlers are intentionally closed over callbacks that
      // are stable at effect-registration time. Keep CI from treating this as fatal.
      "react-hooks/immutability": "off",
    },
  },
  globalIgnores([
    "app/lib/vendor/**",
    "public/price-tag-assets/cutout/ort*.mjs",
    // Default ignores of eslint-config-next:
    ".next/**",
    "dist/**",
    "out/**",
    "build/**",
    "app/app/**",
    "**/app/app/**",
    "github_ci_guard/**",
    "**/github_ci_guard/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;

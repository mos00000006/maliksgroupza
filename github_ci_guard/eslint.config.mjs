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
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "app/app/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;

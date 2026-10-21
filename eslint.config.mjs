import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "node_modules/**",
    "next-env.d.ts",
    "docs/**",
    // 由 scripts/sync-image-worker.mjs 复制的第三方压缩库 worker，不参与 lint
    "public/vendor/**",
  ]),
]);

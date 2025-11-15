import { defineConfig } from "tsup";

export default defineConfig([
  // Build for Node.js
  {
    entry: {
      index: "src/index.ts",
    },
    format: ["cjs", "esm"],
    dts: true,
    clean: true,
    outDir: "dist",
    platform: "node",
    target: "node18",
    splitting: false,
    sourcemap: true,
  },
  // Build for Browsers
  {
    entry: {
      "index.browser": "src/index.ts",
    },
    format: ["esm", "cjs"],
    dts: true,
    clean: false,
    outDir: "dist",
    platform: "browser",
    target: "es2022",
    splitting: false,
    sourcemap: true,
    // Alias: replace 'path' with 'path-browserify'
    esbuildOptions(options) {
      options.alias = {
        "node:path": "path-browserify",
      };
    },
    // Don't treat 'path-browserify' as external
    noExternal: ["path-browserify"],
  },
]);

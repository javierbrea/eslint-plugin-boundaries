import { defineConfig } from "tsup";

// The JSON meta schema of ajv is inlined, because Node.js does not import a JSON module from an ES module without an import attribute
const noExternal = [/^ajv\/lib\/refs\//];

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
    noExternal,
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
    noExternal,
  },
]);

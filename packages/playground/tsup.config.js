import { defineConfig } from "tsup";

// A library build: tsup keeps the dependencies and peer dependencies as imports, and each host bundles them
export default defineConfig({
  entry: {
    index: "src/index.ts",
  },
  format: ["esm"],
  dts: true,
  clean: true,
  outDir: "dist",
  platform: "browser",
  target: "es2022",
  splitting: false,
  sourcemap: true,
});

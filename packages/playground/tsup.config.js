import { defineConfig } from "tsup";

// A library build: tsup keeps the dependencies and peer dependencies as imports, and each host bundles them. `share` is the light second entry of the docs: it reaches only helpers, and with no code splitting its file carries what it needs and imports no React or MUI
export default defineConfig({
  entry: {
    index: "src/index.ts",
    share: "src/share.ts",
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

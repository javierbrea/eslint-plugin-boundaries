import { defineConfig } from "tsup";

// The build of the `./playwright` entry, which holds the Playwright page objects: it runs in Node.js inside the Playwright runner, never in a host, so it is its own build and `build` never waits for it. `@playwright/test` is not a dependency of the package, so tsup would bundle it unless it is external here. Nothing else may remain an import: `build:playwright` runs `scripts/check-bundle-imports.js` over the output, which fails on any other bare specifier
export default defineConfig({
  entry: { playwright: "src/playwright.ts" },
  format: ["esm"],
  dts: true,
  clean: true,
  outDir: "dist-playwright",
  platform: "node",
  target: "node24",
  external: ["@playwright/test"],
  splitting: false,
  sourcemap: true,
});

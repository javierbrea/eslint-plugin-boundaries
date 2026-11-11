import { defineConfig } from "tsup";

// The build of the `./playwright` entry, which holds the Playwright page objects of the site: it runs in Node.js inside the Playwright runner, never in the site, so it is its own build and `build` never waits for it. `@playwright/test` and the entry of the playground are not bundled, so that the runner loads one copy of each, and nothing else may remain an import: `build:playwright` runs `scripts/check-bundle-imports.js` over the output, which fails on any other bare specifier. The package is not an ES module, so tsup names the files `.mjs` and `.d.mts`
export default defineConfig({
  entry: { playwright: "src/playwright.ts" },
  format: ["esm"],
  dts: true,
  clean: true,
  outDir: "dist-playwright",
  platform: "node",
  target: "node24",
  external: ["@playwright/test", "@boundaries/playground/playwright"],
  splitting: false,
  sourcemap: true,
});

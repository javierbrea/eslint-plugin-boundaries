import { defineConfig } from "tsup";

// A library build: tsup keeps the dependencies and peer dependencies as imports, and each host bundles them. `share` is the light second entry of the docs: it reaches only helpers, and with no code splitting its file carries what it needs and imports no React or MUI. `evaluation.worker` is the script of the worker that evaluates sketches: the code of `index` names it as `./evaluation.worker.js` beside itself, and the bundler of each host builds it apart from the page, with the engine and the `@boundaries/*` packages, in as many chunks as it splits them into. It exports nothing, so it has no types
export default defineConfig({
  entry: {
    index: "src/index.ts",
    share: "src/share.ts",
    "evaluation.worker":
      "src/domains/evaluation/helpers/evaluator/evaluation.worker.ts",
  },
  format: ["esm"],
  dts: { entry: { index: "src/index.ts", share: "src/share.ts" } },
  clean: true,
  outDir: "dist",
  platform: "browser",
  target: "es2022",
  splitting: false,
  sourcemap: true,
});

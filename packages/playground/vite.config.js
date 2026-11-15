import { fileURLToPath } from "node:url";

import { STATIC_DIR as DESIGN_TOKENS_STATIC_DIR } from "@boundaries/design-tokens";
// eslint-disable-next-line import/no-unresolved
import react from "@vitejs/plugin-react";
// eslint-disable-next-line import/no-unresolved
import { defineConfig } from "vite";

// Dev harness only: the package build is tsup's. The static folder of @boundaries/design-tokens serves the fonts that its fonts.css points to, as on the website
export default defineConfig({
  root: "dev",
  publicDir: DESIGN_TOKENS_STATIC_DIR,
  plugins: [react()],
  // The "@/" alias of "src/", as in tsconfig.json and jest.config.cjs
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
});

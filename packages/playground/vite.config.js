import { fileURLToPath } from "node:url";

// eslint-disable-next-line import/no-unresolved
import react from "@vitejs/plugin-react";
// eslint-disable-next-line import/no-unresolved
import { defineConfig } from "vite";

// Dev harness only: the package build is tsup's. The website's static folder serves the fonts that its fonts.css points to
export default defineConfig({
  root: "dev",
  publicDir: "../../website/static",
  plugins: [react()],
  // The "@/" alias of "src/", as in tsconfig.json and jest.config.cjs
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
});

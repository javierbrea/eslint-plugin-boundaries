import { defineConfig, devices } from "@playwright/test";

// A fixed port other than 3000, where `pnpm nx start website` serves the dev site, so that a site that is already running never answers the suite
const PORT = 4310;
const HOST = "127.0.0.1";
const BASE_URL = `http://${HOST}:${PORT}`;

// The viewports of `packages/website/scripts/screenshots.mjs`. The site shows the playground from 997 px up and a note below it
const DESKTOP_VIEWPORT = { width: 1440, height: 900 };
const NARROW_VIEWPORT = { width: 390, height: 844 };

// Chromium only: the browsers of the packages are covered by `test/browser-e2e`
export default defineConfig({
  testDir: "test",
  // Only the files that `eslint.config.js` holds to the rules of a spec: the default also runs `.test.ts`, `.spec.js`, `.spec.mts` and other extensions, which lint does not check as specs or skips
  testMatch: "**/*.spec.ts",
  // One tsconfig for every file the runner loads. Without it, Playwright looks up the closest one of each file, and the entry of the site, `packages/website/dist-playwright`, finds the tsconfig of the site, whose `"baseUrl": null` its loader cannot read
  tsconfig: "./tsconfig.json",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  // A failure is a defect to fix, so nothing retries locally. CI retries once to keep a trace of a test that fails there
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: DESKTOP_VIEWPORT },
      // A spec that needs the narrow page is tagged `@narrow`
      grepInvert: /@narrow/,
    },
    {
      name: "narrow",
      use: { ...devices["Desktop Chrome"], viewport: NARROW_VIEWPORT },
      // A spec that needs the panes of the playground is tagged `@desktop`
      grepInvert: /@desktop/,
    },
  ],
  webServer: {
    // The production build of the site, which `test:e2e` builds first. It never reuses a server that is already there, which could serve an older build
    command: `pnpm --filter website exec docusaurus serve --host ${HOST} --port ${PORT} --no-open`,
    url: BASE_URL,
    reuseExistingServer: false,
  },
});

// Renders the social card, static/img/og-image.png (1200×630), from scripts/social-card.html with the
// site's own design tokens, fonts and logo. Run it after changing the card or the tokens it uses, and
// commit the image.
//
// Usage: pnpm --filter website social-card
//
// Runs on the Chromium of the @playwright/test version in the root package.json, which the package script installs first.

/* global document -- used inside a callback that runs in the page */

import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { STATIC_DIR as DESIGN_TOKENS_STATIC_DIR } from "@boundaries/design-tokens";
import { chromium } from "@playwright/test";

const WEBSITE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT = resolve(WEBSITE_ROOT, "static/img/og-image.png");
const CARD = { width: 1200, height: 630 };
// Nothing listens on this origin: the route below answers its requests from the website files, and a request to any other origin fails the render, so the card never depends on the network
const ORIGIN = "http://social-card.local";
// The CSS of @boundaries/design-tokens, which the card links under this path
const DESIGN_TOKENS_PATH = "/design-tokens/";
// The static folders of the site, in the order of `staticDirectories` in docusaurus.config.ts
const STATIC_DIRS = [resolve(WEBSITE_ROOT, "static"), DESIGN_TOKENS_STATIC_DIR];

// The card itself, the CSS of @boundaries/design-tokens, resolved through the exports of the package, and anything else from the static folders, as Docusaurus serves them
function sourceFile(pathname) {
  if (pathname === "/") {
    return resolve(WEBSITE_ROOT, "scripts/social-card.html");
  }
  if (pathname.startsWith(DESIGN_TOKENS_PATH)) {
    return fileURLToPath(
      import.meta.resolve(
        `@boundaries/design-tokens/${pathname.slice(DESIGN_TOKENS_PATH.length)}`
      )
    );
  }
  const files = STATIC_DIRS.map((dir) => resolve(dir, `.${pathname}`));
  return files.find((file) => existsSync(file)) ?? files[0];
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: CARD });
const missing = [];

await page.route("**/*", async (route) => {
  const url = new URL(route.request().url());
  if (url.origin !== ORIGIN) {
    missing.push(url.href);
    await route.abort();
    return;
  }
  const pathname = decodeURIComponent(url.pathname);
  try {
    // The content type is inferred from the file extension. A path that the package does not export throws too
    await route.fulfill({ path: sourceFile(pathname) });
  } catch {
    missing.push(pathname);
    await route.fulfill({ status: 404 });
  }
});

await page.goto(`${ORIGIN}/`, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);

if (missing.length) {
  await browser.close();
  console.error(
    `Missing files or requests outside the website files:\n${missing.join("\n")}`
  );
  process.exit(1);
}

await page.screenshot({ path: OUTPUT });
await browser.close();
console.warn(`Social card saved in ${OUTPUT}`);

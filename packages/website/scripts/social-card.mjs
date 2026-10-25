// Renders the social card, static/img/og-image.png (1200×630), from scripts/social-card.html with the
// site's own design tokens, fonts and logo. Run it after changing the card or the tokens it uses, and
// commit the image.
//
// Usage: pnpm --filter website social-card
//
// Uses the local Chrome through playwright-core; without Chrome, run `pnpm --filter website exec playwright-core install chromium` first.

/* global document -- used inside a callback that runs in the page */

import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright-core";

const WEBSITE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT = resolve(WEBSITE_ROOT, "static/img/og-image.png");
const CARD = { width: 1200, height: 630 };
// Nothing listens on this origin: the route below answers its requests from the website files, and a request to any other origin fails the render, so the card never depends on the network
const ORIGIN = "http://social-card.local";

// The card itself, the site CSS it links under /src/, and anything else from static/, as Docusaurus serves it
function sourceFile(pathname) {
  if (pathname === "/") {
    return resolve(WEBSITE_ROOT, "scripts/social-card.html");
  }
  if (pathname.startsWith("/src/")) {
    return resolve(WEBSITE_ROOT, `.${pathname}`);
  }
  return resolve(WEBSITE_ROOT, `static${pathname}`);
}

async function launchBrowser() {
  try {
    return await chromium.launch({ channel: "chrome" });
  } catch {
    return chromium.launch();
  }
}

const browser = await launchBrowser();
const page = await browser.newPage({ viewport: CARD });
const missing = [];

await page.route("**/*", async (route) => {
  const url = new URL(route.request().url());
  if (url.origin !== ORIGIN) {
    missing.push(url.href);
    await route.abort();
    return;
  }
  const file = sourceFile(decodeURIComponent(url.pathname));
  try {
    // The content type is inferred from the file extension
    await route.fulfill({ path: file });
  } catch {
    missing.push(file);
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

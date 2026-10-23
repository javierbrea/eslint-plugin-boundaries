// Visual check of the site: renders each page at desktop and mobile widths in both themes, saves
// screenshots and a contact sheet per page into ./screenshots, and fails on horizontal overflow or
// console errors.
//
// Usage: pnpm --filter website screenshots [baseUrl] [paths...]
//   baseUrl defaults to http://localhost:3000 (`pnpm --filter website serve` or `pnpm nx start website`)
//   paths default to /, /docs/overview/ and /docs/quick-start/
//
// Uses the local Chrome through playwright-core; without Chrome, run `pnpm dlx playwright install chromium` first.

/* global window, document -- used inside callbacks that run in the page */

import { mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright-core";

const DEFAULT_BASE_URL = "http://localhost:3000";
const DEFAULT_PATHS = ["/", "/docs/overview/", "/docs/quick-start/"];
const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];
const THEMES = ["light", "dark"];
// The hero drawing finishes drawing itself 2.8s after load
const SETTLE_MS = 3000;
// Live stats fall back to static values when these APIs fail (rate limits), so their errors are expected
const TOLERATED_ERROR_HOSTS = ["api.github.com", "api.npmjs.org"];

const OUTPUT_DIR = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../screenshots"
);

function parseArgs(args) {
  const [first, ...rest] = args;
  if (first?.startsWith("http")) {
    return { baseUrl: first, paths: rest.length ? rest : DEFAULT_PATHS };
  }
  return {
    baseUrl: DEFAULT_BASE_URL,
    paths: args.length ? args : DEFAULT_PATHS,
  };
}

function pageName(path) {
  return path.replace(/^\/|\/$/g, "").replace(/\//g, "-") || "home";
}

function isTolerated(url = "") {
  return TOLERATED_ERROR_HOSTS.some((host) => url.includes(host));
}

async function launchBrowser() {
  try {
    return await chromium.launch({ channel: "chrome" });
  } catch {
    return chromium.launch();
  }
}

async function capture(chrome, url, name, viewport, theme) {
  const context = await chrome.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    colorScheme: theme,
  });
  // Docusaurus reads the stored choice before the first paint
  await context.addInitScript((value) => {
    try {
      window.localStorage.setItem("theme", value);
    } catch {
      // Storage unavailable: the emulated color scheme still applies
    }
  }, theme);
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" && !isTolerated(message.location().url)) {
      errors.push(message.text());
    }
  });

  await page.goto(url, { waitUntil: "networkidle" });
  await page.mouse.move(viewport.width * 0.7, 420);
  await page.waitForTimeout(SETTLE_MS);
  const prefix = resolve(OUTPUT_DIR, `${name}-${viewport.name}-${theme}`);
  await page.screenshot({ path: `${prefix}-top.png` });

  // Scroll through the page so every reveal-on-scroll block is shown in the full capture
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 500) {
      window.scrollTo(0, y);
      await new Promise((done) => setTimeout(done, 120));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${prefix}-full.png`, fullPage: true });

  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth
  );
  await context.close();
  return { overflow, errors, top: `${prefix}-top.png` };
}

// One image per page: desktop light and dark on top, mobile light and dark below
async function contactSheet(chrome, name, shots) {
  const image = (shot, width) =>
    `<figure><figcaption>${shot.label}</figcaption><img width="${width}" src="data:image/png;base64,${readFileSync(shot.top).toString("base64")}"></figure>`;
  const desktop = shots.filter((shot) => shot.viewport === "desktop");
  const mobile = shots.filter((shot) => shot.viewport === "mobile");
  const html = `<!doctype html><html><head><style>
    body { margin: 0; padding: 16px; background: #fff; font: 600 15px system-ui, sans-serif; color: #161a33; }
    .row { display: flex; gap: 24px; margin-bottom: 24px; align-items: flex-start; }
    figure { margin: 0; } figcaption { margin-bottom: 8px; } img { display: block; border: 1px solid #ccd; }
  </style></head><body>
    <div class="row">${desktop.map((shot) => image(shot, 720)).join("")}</div>
    <div class="row">${mobile.map((shot) => image(shot, 390)).join("")}</div>
  </body></html>`;
  const page = await chrome.newPage({ viewport: { width: 1500, height: 800 } });
  await page.setContent(html, { waitUntil: "load" });
  await page.screenshot({
    path: resolve(OUTPUT_DIR, `${name}-sheet.png`),
    fullPage: true,
  });
  await page.close();
}

const { baseUrl, paths } = parseArgs(process.argv.slice(2));
mkdirSync(OUTPUT_DIR, { recursive: true });
const browser = await launchBrowser();
let failed = false;

for (const path of paths) {
  const name = pageName(path);
  const url = new URL(path, baseUrl).toString();
  const shots = [];
  for (const viewport of VIEWPORTS) {
    for (const theme of THEMES) {
      const result = await capture(browser, url, name, viewport, theme);
      const ok = !result.overflow && result.errors.length === 0;
      failed ||= !ok;
      shots.push({
        viewport: viewport.name,
        top: result.top,
        label: `${viewport.width}×${viewport.height} ${theme}`,
      });
      console.warn(
        `${ok ? "ok  " : "FAIL"} ${path} ${viewport.name} ${theme} overflow: ${result.overflow} errors: ${
          result.errors.length ? result.errors.join(" | ") : "none"
        }`
      );
    }
  }
  await contactSheet(browser, name, shots);
}

await browser.close();
console.warn(`Screenshots saved in ${OUTPUT_DIR}`);
process.exit(failed ? 1 : 0);

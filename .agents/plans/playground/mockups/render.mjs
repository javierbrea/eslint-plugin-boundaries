// cspell:disable
/* global document, window */
// Renders the playground mockup in every state and both themes, so that each iteration leaves
// images to compare without opening the file.
//
// Usage, from the repository root: node .agents/plans/playground/mockups/render.mjs
//
// It serves the repository over HTTP, because fonts.css loads the fonts from /fonts/, which the
// website serves from packages/website/static/fonts/. It runs on the Chromium of the
// @playwright/test version in the root package.json (`pnpm exec playwright install chromium`).

import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "@playwright/test";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, "../../../..");
const FONTS = join(REPO, "packages/website/static/fonts");
const PAGE = `/${relative(REPO, join(HERE, "playground.html"))}`;

const STATES = [
  "empty",
  "file",
  "dependency",
  "picker",
  "config",
  "policy",
  "text",
  "help",
];
const THEMES = ["light", "dark"];
const DESKTOP = { width: 1440, height: 900 };
const NARROW = { width: 390, height: 844 };

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".woff2": "font/woff2",
};

/**
 * Resolves a request path to a file of the repository, with /fonts/ mapped to the website fonts.
 * @param {string} urlPath The path of the request.
 * @returns {string | null} The file, or null when it does not exist or is outside the repository.
 */
function toFile(urlPath) {
  const path = decodeURIComponent(urlPath.split("?")[0]);
  const file = path.startsWith("/fonts/")
    ? join(FONTS, path.slice("/fonts/".length))
    : join(REPO, path);
  const inside = file.startsWith(FONTS) || file.startsWith(REPO);
  return inside && existsSync(file) && statSync(file).isFile() ? file : null;
}

const server = createServer((request, response) => {
  const file = toFile(request.url ?? "/");
  if (!file) {
    response.writeHead(404).end();
    return;
  }
  response.writeHead(200, {
    "content-type": TYPES[extname(file)] ?? "application/octet-stream",
  });
  createReadStream(file).pipe(response);
});

await new Promise((done) => server.listen(0, "127.0.0.1", done));
const base = `http://127.0.0.1:${server.address().port}${PAGE}`;
const browser = await chromium.launch();
const problems = [];

/**
 * Screenshots one state of the mockup.
 * @param {{ width: number, height: number }} viewport The size of the page.
 * @param {string} state The state, as the hash of the mockup names it.
 * @param {string} theme The theme.
 * @param {string} name The name of the image, without extension.
 */
async function capture(viewport, state, theme, name) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 2 });
  page.on("console", (message) => {
    if (message.type() === "error") problems.push(`${name}: ${message.text()}`);
  });
  page.on("requestfailed", (request) =>
    problems.push(`${name}: ${request.url()}`)
  );
  page.on("response", (response) => {
    if (response.status() >= 400)
      problems.push(`${name}: ${response.status()} ${response.url()}`);
  });
  await page.goto(`${base}#state=${state}&theme=${theme}&render`);
  await page.evaluate(() => document.fonts.ready);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth
  );
  if (overflow) problems.push(`${name}: horizontal overflow`);
  await page.screenshot({ path: join(HERE, `${name}.png`) });
  await page.close();
}

for (const theme of THEMES) {
  for (const state of STATES) {
    await capture(DESKTOP, state, theme, `${state}-${theme}`);
  }
  await capture(NARROW, "file", theme, `narrow-${theme}`);
}

await browser.close();
server.close();

if (problems.length) {
  console.error(problems.join("\n"));
  process.exitCode = 1;
} else {
  process.stdout.write(
    `Rendered ${STATES.length * THEMES.length + THEMES.length} images into ${relative(REPO, HERE)}\n`
  );
}

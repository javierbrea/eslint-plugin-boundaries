/* global window -- used inside a callback that runs in the page */

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { expect, test } from "@playwright/test";

import { SCENARIOS, runScenario } from "../src/scenarios/index.js";

import { UNSUPPORTED_BROWSERS_ENV } from "./global-setup.js";

const DIST = join(dirname(fileURLToPath(import.meta.url)), "..", "dist");
/** @type {string[]} */
const UNSUPPORTED_BROWSERS = JSON.parse(
  process.env[UNSUPPORTED_BROWSERS_ENV] ?? "[]"
);
// Nothing listens on this origin: the route below answers its requests from the dist folder, and a request to any other origin while the page loads or runs the scenario fails the test
const ORIGIN = "https://browser-e2e.local";

/**
 * Opens the static page that loads the browser bundle of the scenarios.
 * @param {import("@playwright/test").Page} page The page of the test.
 * @returns {Promise<string[]>} The errors that the page throws and the requests outside the dist folder, which are expected to be none.
 */
async function openScenariosPage(page) {
  /** @type {string[]} */
  const problems = [];
  page.on("pageerror", (error) => problems.push(error.message));
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (url.origin !== ORIGIN) {
      problems.push(`Request outside the dist folder: ${url.href}`);
      await route.abort();
      return;
    }
    await route.fulfill({
      path: join(DIST, url.pathname === "/" ? "index.html" : url.pathname),
    });
  });
  await page.goto(`${ORIGIN}/`);
  return problems;
}

// Outside CI, skips the tests of a browser that does not launch on this machine, which the global setup finds
test.skip(
  ({ browserName }) => UNSUPPORTED_BROWSERS.includes(browserName),
  "The browser does not launch on this machine; the global setup prints why"
);

for (const { name, run } of SCENARIOS) {
  test(name, async ({ page, browserName }) => {
    const problems = await openScenariosPage(page);
    expect(
      problems,
      "The page loads without errors or requests outside the dist folder"
    ).toEqual([]);
    const browserResult = await page.evaluate(
      (scenarioName) => window.scenarios.runScenario(scenarioName),
      name
    );

    const nodeResult = runScenario(name);
    // runScenario converts the results to JSON, which would hide a difference inside a Map, a Set or an Error
    expect(nodeResult, `"${name}" returns only JSON values`).toEqual(run());

    expect(
      problems,
      "The scenario runs without errors or requests outside the dist folder"
    ).toEqual([]);
    // The diff below the message only shows the lines that differ, so the message has both results in full
    expect(
      browserResult,
      [
        `"${name}" returns a different result in ${browserName} (received) than in Node.js (expected)`,
        `Node.js: ${JSON.stringify(nodeResult)}`,
        `${browserName}: ${JSON.stringify(browserResult)}`,
      ].join("\n")
    ).toEqual(nodeResult);
  });
}

// Outside CI, launches each browser once before the tests, so that the tests of a browser that does not launch on this
// machine are skipped instead of failing, and prints why it does not launch. In CI every browser has to launch, so a
// browser that does not fails its tests.

import { chromium, firefox, webkit } from "@playwright/test";

/** Passes the names of the browsers that do not launch to the tests, as a JSON array. */
export const UNSUPPORTED_BROWSERS_ENV = "BROWSER_E2E_UNSUPPORTED_BROWSERS";

const BROWSER_TYPES = { chromium, firefox, webkit };

/**
 * Finds the browsers that do not launch, outside CI, and passes them to the tests in UNSUPPORTED_BROWSERS_ENV.
 * @returns {Promise<void>}
 */
export default async function globalSetup() {
  if (process.env.CI) {
    return;
  }
  /** @type {string[]} */
  const unsupportedBrowsers = [];
  await Promise.all(
    Object.entries(BROWSER_TYPES).map(async ([browserName, browserType]) => {
      try {
        const browser = await browserType.launch();
        await browser.close();
      } catch (error) {
        unsupportedBrowsers.push(browserName);
        // The call log repeats the browser logs above it
        const [reason] = /** @type {Error} */ (error).message.split(
          "\nCall log:"
        );
        console.warn(
          `Skipping the ${browserName} tests: ${browserName} does not launch on this machine.\n${reason}\n`
        );
      }
    })
  );
  // The workers start after the global setup, so they inherit it
  process.env[UNSUPPORTED_BROWSERS_ENV] = JSON.stringify(unsupportedBrowsers);
}

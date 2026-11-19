import {
  ANALYTICS_COOKIE_NAMES,
  ANALYTICS_TRACKING_ID,
  BEACON_URL,
  expect,
  GTAG_REQUEST_URL,
  PRODUCTION_ORIGIN,
  test,
  WEB_ANALYTICS_TOKEN,
} from "./fixtures";

// Copies of the texts of `CONSENT_LABELS` of `packages/website/src/client/consent.constants.ts` that the checks of the banner and of the preferences compare, since a test file cannot import it: the buttons of the banner, the question its description asks, and the titles of the section of Google Analytics and of the one of Cloudflare Web Analytics
const BANNER_BUTTONS = ["Accept all", "Reject all"];
const CONSENT_QUESTION =
  "May we use Google Analytics to learn how the docs are used?";
const ANALYTICS_SECTION = "Analytics";
const WEB_ANALYTICS_SECTION = "Visit counts without cookies";

// The banner and the preferences render the same at both viewports, in a corner
// of the screen, so the desktop project covers them
test.describe("the consent banner", () => {
  test.use({ consentBanner: true });

  // A negative check: nothing reaches Google or Cloudflare on the local host.
  // Its controls are the cases on the production host, which see gtag.js load
  // after consent and the beacon of Cloudflare Web Analytics load before any
  // choice
  test(
    "a first visit asks for consent and sends nothing to Google or Cloudflare, before or after accepting all",
    { tag: "@desktop" },
    async ({
      page,
      site,
      cookieBanner,
      cookiePreferences,
      footer,
      requestedHosts,
    }) => {
      await page.goto("/");

      await site.waitUntilHydrated();
      await cookieBanner.waitUntilShown();

      // The banner asks only about Google Analytics and offers only the two choices: the preferences open from the footer
      expect(await cookieBanner.buttonNames).toEqual(BANNER_BUTTONS);
      expect(await cookieBanner.description).toContain(CONSENT_QUESTION);

      expect(requestedHosts.requestedGoogle).toBe(false);
      expect(requestedHosts.requestedCloudflare).toBe(false);

      await cookieBanner.acceptAll();
      await cookieBanner.waitUntilHidden();

      // A broken hostname gate would request gtag.js a moment after the click, and the `request` event can reach the runner after `waitUntilHidden` settles; after a reload, opening the preferences proves the library has run and called its consent callback with Analytics accepted. The client module that loads the beacon of Cloudflare Web Analytics runs before the hydration of each page load, so its requests, if any, were made long before. The local host is not the production one, so neither the page loads nor that consent request anything from Google or Cloudflare
      await page.reload();
      await site.waitUntilHydrated();
      await footer.openCookieSettings();
      await cookiePreferences.waitUntilShown();
      await cookiePreferences.waitUntilAnalyticsOn();

      expect(requestedHosts.requestedGoogle).toBe(false);
      expect(requestedHosts.requestedCloudflare).toBe(false);

      // The preferences describe Cloudflare Web Analytics in a section that has no toggle, since no choice turns it off; the toggle of the Analytics section is the control that proves the check of its absence can fail
      expect(
        await cookiePreferences.isSectionShown(WEB_ANALYTICS_SECTION)
      ).toBe(true);
      expect(
        await cookiePreferences.hasSectionToggle(WEB_ANALYTICS_SECTION)
      ).toBe(false);
      expect(await cookiePreferences.hasSectionToggle(ANALYTICS_SECTION)).toBe(
        true
      );
    }
  );

  test(
    "accepting all hides the banner and is remembered after a reload",
    { tag: "@desktop" },
    async ({ page, site, cookieBanner, cookiePreferences, footer }) => {
      await page.goto("/");

      await cookieBanner.waitUntilShown();
      await cookieBanner.acceptAll();
      await cookieBanner.waitUntilHidden();

      await page.reload();
      await site.waitUntilHydrated();

      await expect.poll(() => cookieBanner.isRendered).toBe(false);

      await footer.openCookieSettings();
      await cookiePreferences.waitUntilShown();
      await cookiePreferences.waitUntilAnalyticsOn();
    }
  );

  test(
    "rejecting all hides the banner and is remembered after a reload",
    { tag: "@desktop" },
    async ({ page, site, cookieBanner, cookiePreferences, footer }) => {
      await page.goto("/");

      await cookieBanner.waitUntilShown();
      await cookieBanner.rejectAll();
      await cookieBanner.waitUntilHidden();

      await page.reload();
      await site.waitUntilHydrated();

      await expect.poll(() => cookieBanner.isRendered).toBe(false);

      await footer.openCookieSettings();
      await cookiePreferences.waitUntilShown();
      await cookiePreferences.waitUntilAnalyticsOff();
    }
  );

  test(
    "the cookie settings of the footer open the preferences after a client-side navigation",
    { tag: "@desktop" },
    async ({ page, navbar, cookieBanner, cookiePreferences, footer }) => {
      await page.goto("/");

      await cookieBanner.waitUntilShown();
      await cookieBanner.acceptAll();
      await cookieBanner.waitUntilHidden();

      // A link of the navbar waits for the hydration and follows the router, so the footer that the click lands on is a new render
      await navbar.link("Getting Started").follow();
      await expect(page).toHaveURL("/docs/overview/");

      await footer.openCookieSettings();
      await cookiePreferences.waitUntilShown();
      await cookiePreferences.turnAnalyticsOff();
      await cookiePreferences.save();
      await cookiePreferences.waitUntilHidden();

      await footer.openCookieSettings();
      await cookiePreferences.waitUntilShown();
      await cookiePreferences.waitUntilAnalyticsOff();
    }
  );

  // The control of the Cloudflare checks of the first case: on the production
  // host the beacon of Cloudflare Web Analytics loads before any choice and
  // again after Reject all, while gtag.js waits for consent
  test(
    "on the production host Cloudflare Web Analytics loads before any choice and after rejecting all",
    { tag: "@desktop" },
    async ({ page, site, cookieBanner, requestedHosts, productionHost }) => {
      const host = await productionHost();

      await page.goto(`${PRODUCTION_ORIGIN}/`);

      await site.waitUntilHydrated();
      await cookieBanner.waitUntilShown();

      // The stand-in of the beacon reports the config it reads from the `data-cf-beacon` attribute of its script, as the real beacon reads it
      await expect
        .poll(() => host.beaconConfigs)
        .toEqual([{ token: WEB_ANALYTICS_TOKEN }]);
      expect(host.beaconRequests).toEqual([BEACON_URL]);
      expect(requestedHosts.requestedCloudflare).toBe(true);
      expect(host.gtagRequests).toEqual([]);

      await cookieBanner.rejectAll();
      await cookieBanner.waitUntilHidden();

      await page.reload();
      await site.waitUntilHydrated();

      await expect
        .poll(() => host.beaconConfigs)
        .toEqual([
          { token: WEB_ANALYTICS_TOKEN },
          { token: WEB_ANALYTICS_TOKEN },
        ]);
    }
  );

  // The control of the Google checks of the first case: on the production host
  // the same consent loads Google Analytics, which proves the hostname gate and
  // the consent gate of the negative checks above can both pass
  test(
    "on the production host Google Analytics loads only after consent, and withdrawing it deletes its cookies",
    { tag: "@desktop" },
    async ({
      page,
      context,
      site,
      navbar,
      cookieBanner,
      cookiePreferences,
      footer,
      productionHost,
    }) => {
      const host = await productionHost();

      await page.goto(`${PRODUCTION_ORIGIN}/`);

      await site.waitUntilHydrated();
      await cookieBanner.waitUntilShown();

      expect(host.gtagRequests).toEqual([]);

      await cookieBanner.acceptAll();

      await expect.poll(() => host.gtagRequests).toEqual([GTAG_REQUEST_URL]);

      // The stand-in of gtag.js reports each command it reads from dataLayer, which only Arguments objects reach: the config proves the snippet queued its calls the way the real script reads them
      await expect
        .poll(() => host.gtagCommands)
        .toContainEqual(["config", ANALYTICS_TRACKING_ID]);

      await navbar.link("Getting Started").follow();
      await expect(page).toHaveURL(`${PRODUCTION_ORIGIN}/docs/overview/`);

      // A client-side navigation queues a page_view of the new path, right after the `set` of its page_path
      await expect
        .poll(() => host.gtagCommands.slice(-2))
        .toEqual([
          ["set", "page_path", "/docs/overview/"],
          ["event", "page_view"],
        ]);

      // The cookies that a loaded gtag.js sets, which the consent library deletes when analytics is withdrawn
      await context.addCookies(
        ANALYTICS_COOKIE_NAMES.map((name) => ({
          name,
          value: "GA1.1.1.1",
          domain: ".jsboundaries.dev",
          path: "/",
        }))
      );

      await footer.openCookieSettings();
      await cookiePreferences.waitUntilShown();
      await cookiePreferences.turnAnalyticsOff();
      await cookiePreferences.save();
      await cookiePreferences.waitUntilHidden();

      await expect
        .poll(async () => (await context.cookies()).map(({ name }) => name))
        .toEqual(["cc_cookie"]);

      // With analytics withdrawn a client-side navigation queues no page_view; the check of that absence waits for the command of a later navigation with Analytics on again, so it reads the record only once it could hold one. The page view of /docs/overview/ above is the control that proves the check can fail
      await footer.privacyLink.follow();
      await expect(page).toHaveURL(`${PRODUCTION_ORIGIN}/privacy/`);

      await footer.openCookieSettings();
      await cookiePreferences.waitUntilShown();
      await cookiePreferences.turnAnalyticsOn();
      await cookiePreferences.save();
      await cookiePreferences.waitUntilHidden();

      await navbar.link("Classification").follow();
      await expect(page).toHaveURL(`${PRODUCTION_ORIGIN}/docs/classification/`);

      await expect
        .poll(() => host.gtagCommands)
        .toContainEqual(["set", "page_path", "/docs/classification/"]);

      expect(
        host.gtagCommands
          .filter(([command, key]) => command === "set" && key === "page_path")
          .map(([, , path]) => path)
      ).toEqual(["/docs/overview/", "/docs/classification/"]);

      // Analytics is on again: turn it off once more before the reload, which keeps checking that a saved rejection requests no gtag.js
      await footer.openCookieSettings();
      await cookiePreferences.waitUntilShown();
      await cookiePreferences.turnAnalyticsOff();
      await cookiePreferences.save();
      await cookiePreferences.waitUntilHidden();

      await page.reload();
      await site.waitUntilHydrated();

      // The library loads in its own chunk and calls onConsent only when run() finishes, which can be after the hydration; opening the preferences proves it has run, since the client module opens them only then. With Analytics off in the saved consent, it requests no gtag.js
      await footer.openCookieSettings();
      await cookiePreferences.waitUntilShown();
      await cookiePreferences.waitUntilAnalyticsOff();

      expect(host.gtagRequests).toEqual([GTAG_REQUEST_URL]);
    }
  );
});

test.describe("a browser that sends Global Privacy Control", () => {
  test.use({ consentBanner: true, globalPrivacyControl: true });

  // A negative check: with Global Privacy Control the library builds no banner
  // and keeps Google Analytics off. Its controls are the first case of the
  // suite, which sees the banner without the signal, and the Google Analytics
  // case on the production host, which sees gtag.js load after Accept all
  test(
    "on the production host Cloudflare Web Analytics loads, and neither the banner nor Google Analytics does",
    { tag: "@desktop" },
    async ({
      page,
      site,
      cookieBanner,
      cookiePreferences,
      footer,
      productionHost,
    }) => {
      const host = await productionHost();

      await page.goto(`${PRODUCTION_ORIGIN}/`);

      await site.waitUntilHydrated();

      await expect
        .poll(() => host.beaconConfigs)
        .toEqual([{ token: WEB_ANALYTICS_TOKEN }]);

      // The library loads in its own chunk and builds the banner, when it does, in run(); opening the preferences proves it has run, since the client module opens them only then
      await footer.openCookieSettings();
      await cookiePreferences.waitUntilShown();
      await cookiePreferences.waitUntilAnalyticsOff();

      await expect.poll(() => cookieBanner.isRendered).toBe(false);
      expect(host.gtagRequests).toEqual([]);
    }
  );
});

test.describe("the consent banner in an automated browser", () => {
  // A negative check: Playwright is a bot to the consent library, which builds
  // no banner for it. Its control is the first case of the suite, which sees
  // the banner once `consentBanner` hides `navigator.webdriver`
  test(
    "the library hides the banner from Playwright, so no other spec sees it",
    { tag: "@desktop" },
    async ({ page, site, cookieBanner }) => {
      await page.goto("/");

      await site.waitUntilHydrated();

      await expect.poll(() => cookieBanner.isRendered).toBe(false);
    }
  );
});

test.describe("an automated browser", () => {
  // Without `consentBanner` the browser keeps `navigator.webdriver`, which every other production-host case hides: the beacon of Cloudflare Web Analytics loads for a bot too, since nothing but the hostname gates it
  test(
    "on the production host Cloudflare Web Analytics loads in an automated browser too",
    { tag: "@desktop" },
    async ({ page, site, productionHost }) => {
      const host = await productionHost();

      await page.goto(`${PRODUCTION_ORIGIN}/`);

      await site.waitUntilHydrated();

      await expect
        .poll(() => host.beaconConfigs)
        .toEqual([{ token: WEB_ANALYTICS_TOKEN }]);
    }
  );
});

test.describe("the footer", () => {
  test(
    "the footer links to the privacy page",
    { tag: "@desktop" },
    async ({ page, footer }) => {
      await page.goto("/");

      await footer.privacyLink.follow();

      await expect(page).toHaveURL("/privacy/");
    }
  );
});

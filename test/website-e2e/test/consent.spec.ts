import {
  ANALYTICS_COOKIE_NAMES,
  ANALYTICS_TRACKING_ID,
  expect,
  GTAG_REQUEST_URL,
  PRODUCTION_ORIGIN,
  test,
} from "./fixtures";

// The banner and the preferences render the same at both viewports, in a corner
// of the screen, so the desktop project covers them
test.describe("the consent banner", () => {
  test.use({ consentBanner: true });

  // A negative check: nothing reaches Google on the local host. Its control is
  // the last case, which sees gtag.js load on the production host
  test(
    "a first visit asks for consent and sends nothing to Google, before or after accepting all",
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

      expect(requestedHosts.requestedGoogle).toBe(false);

      await cookieBanner.acceptAll();
      await cookieBanner.waitUntilHidden();

      // A broken hostname gate would request gtag.js a moment after the click, and the `request` event can reach the runner after `waitUntilHidden` settles; after a reload, opening the preferences proves the library has run and called its consent callback with Analytics accepted. The local host is not the production one, so even that consent loads nothing
      await page.reload();
      await site.waitUntilHydrated();
      await footer.openCookieSettings();
      await cookiePreferences.waitUntilShown();
      await cookiePreferences.waitUntilAnalyticsOn();

      expect(requestedHosts.requestedGoogle).toBe(false);
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

  // The control of the first case: on the production host the same consent
  // loads Google Analytics, which proves the hostname gate and the consent
  // gate of the negative checks above can both pass
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

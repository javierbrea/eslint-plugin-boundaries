import {
  ANALYTICS_COOKIE_NAMES,
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

import { test as base, expect } from "@playwright/test";
import type { BrowserContext } from "@playwright/test";
import {
  CookieBannerPom,
  CookiePreferencesPom,
  DocItemPom,
  DocSidebarPom,
  FooterPom,
  NavbarPom,
  NotFoundContentPom,
  PlaygroundPagePom,
  RootPom,
} from "website/playwright";

import { ClipboardWrites } from "./support/clipboard-writes";
import { DocumentLoads } from "./support/document-loads";
import { NOT_FOUND_PATH, PageErrors } from "./support/page-errors";
import {
  ANALYTICS_COOKIE_NAMES,
  ANALYTICS_TRACKING_ID,
  BEACON_URL,
  GTAG_REQUEST_URL,
  PRODUCTION_ORIGIN,
  type ProductionHost,
  routeProductionHost,
  WEB_ANALYTICS_TOKEN,
} from "./support/production-host";
import {
  CLOUDFLARE_URL_PATTERN,
  GOOGLE_URL_PATTERN,
  RequestedHosts,
} from "./support/requested-hosts";
import {
  PLAYGROUND_CHUNK_MARKER,
  ScriptResponses,
} from "./support/script-responses";
import { StartedWorkers } from "./support/started-workers";

/** Opens a URL in a page of its own and gives the page object of the page at `/playground/`. */
type OpenPlayground = (url: string) => Promise<PlaygroundPagePom>;

/** Installs the routing of the production host in the context of the test and gives the requests to Google and Cloudflare, the gtag commands and the beacon configs it records. */
type InstallProductionHost = () => Promise<ProductionHost>;

/**
 * Aborts every request of a browser context to Cloudflare Web Analytics. The site loads its beacon without consent, so a gate broken on purpose would send real reports to Cloudflare from any spec; every context that a fixture opens calls it. The production-host routing is registered later, in the tests that use it, and Playwright runs the last matching route first, so its stand-in of the beacon still answers there. Aborted requests still emit `request`, so `RequestedHosts` keeps seeing them.
 * @param context A browser context that a fixture opens.
 * @returns A promise that settles when the route is registered.
 */
async function abortWebAnalytics(context: BrowserContext): Promise<void> {
  await context.route(CLOUDFLARE_URL_PATTERN, (route) => route.abort());
}

type Fixtures = {
  /** Whether the consent library sees a visitor it shows the banner to. A spec that tests the banner sets it to true; the default keeps the banner hidden, as in every other spec. */
  consentBanner: boolean;
  /** Applies the `consentBanner` option to the context of the test before any page loads. */
  consentBannerSetup: void;
  /** Whether the browser sends the Global Privacy Control signal (`navigator.globalPrivacyControl`), which makes the consent library keep Google Analytics off and build no banner while no choice is saved. A spec that tests the signal sets it to true; by default the browser sends none, as Chromium does. */
  globalPrivacyControl: boolean;
  /** Applies the `globalPrivacyControl` option to the context of the test before any page loads. */
  globalPrivacyControlSetup: void;
  /** Aborts every request of the context of the test to Cloudflare Web Analytics, which the site loads without consent. It runs in every test. */
  webAnalyticsGuard: void;
  /** The consent banner, which asks for consent on a first visit. */
  cookieBanner: CookieBannerPom;
  /** The cookie preferences dialog. */
  cookiePreferences: CookiePreferencesPom;
  /** The footer of a page, with its Cookie settings button. */
  footer: FooterPom;
  /** The hostnames that the pages request, to tell whether one of them reached Google or Cloudflare. */
  requestedHosts: RequestedHosts;
  /** Installs the production-host routing on first call, only in the tests that use it. */
  productionHost: InstallProductionHost;
  /** Fails the test when a page logs an error to the console or throws one. It runs in every test. */
  pageErrors: PageErrors;
  /** The texts that the pages write to the clipboard, which the runner keeps in place of the system clipboard. */
  clipboardWrites: ClipboardWrites;
  /** The documents that the pages load, which tell a client-side navigation from a page load. */
  documentLoads: DocumentLoads;
  /** The article of a docs page, with its title and its Open in playground button. */
  docItem: DocItemPom;
  /** The docs sidebar of a docs page on a wide screen. */
  docSidebar: DocSidebarPom;
  /** The navbar of a page on a wide screen. */
  navbar: NavbarPom;
  /** The content of the 404 page. */
  notFoundContent: NotFoundContentPom;
  /** Opens a URL in a new tab of the browser context of the test, which shares its storage with the tabs the test already has, and waits for nothing: the caller waits for the playground. */
  openPlaygroundTab: OpenPlayground;
  /** Opens a URL in a browser context of its own, which has no storage of the other contexts, as a person who gets a link does, and waits for nothing: the caller waits for the playground. The viewport is that of the project. */
  openPlaygroundInFreshContext: OpenPlayground;
  /** The page object of the page at `/playground/`. */
  playgroundPage: PlaygroundPagePom;
  /** The document of a page, which says whether the browser has hydrated it. */
  site: RootPom;
  /** The scripts that the pages request, to tell whether one of them holds a text. */
  scripts: ScriptResponses;
  /** The web workers that the pages start. */
  startedWorkers: StartedWorkers;
};

/** The `test` of the suite: the one of Playwright, with the page objects of the site and the records of what its pages do. A spec imports it from here, never from `@playwright/test`. */
export const test = base.extend<Fixtures>({
  consentBanner: [false, { option: true }],
  consentBannerSetup: [
    async ({ consentBanner, context }, use) => {
      // The consent library keeps its default `hideFromBots` and builds no banner for a browser it takes for a bot, which `navigator.webdriver` marks Playwright as. Only a spec that sets `consentBanner` gets a visitor the library shows the banner to; every other spec never sees it
      if (consentBanner) {
        await context.addInitScript(() => {
          Object.defineProperty(Navigator.prototype, "webdriver", {
            get: () => false,
          });
        });
        // With the banner the library runs and a spec can accept analytics, so a gate broken on purpose would download the real gtag.js and send real hits to Google; every request to a Google host is aborted instead. The production-host routing is registered later, in the tests that use it, and Playwright runs the last matching route first, so its stub of gtag.js still answers there. Aborted requests still emit `request`, so `RequestedHosts` keeps seeing them
        await context.route(GOOGLE_URL_PATTERN, (route) => route.abort());
      }
      await use();
    },
    { auto: true },
  ],
  globalPrivacyControl: [false, { option: true }],
  globalPrivacyControlSetup: [
    async ({ globalPrivacyControl, context }, use) => {
      // Chromium sends no Global Privacy Control signal, and the consent library reads only `navigator.globalPrivacyControl`, so a spec that sets the option gets a browser that sends it
      if (globalPrivacyControl) {
        await context.addInitScript(() => {
          Object.defineProperty(Navigator.prototype, "globalPrivacyControl", {
            get: () => true,
          });
        });
      }
      await use();
    },
    { auto: true },
  ],
  webAnalyticsGuard: [
    async ({ context }, use) => {
      await abortWebAnalytics(context);
      await use();
    },
    { auto: true },
  ],
  cookieBanner: async ({ page }, use) => {
    await use(new CookieBannerPom({ page }));
  },
  cookiePreferences: async ({ page }, use) => {
    await use(new CookiePreferencesPom({ page }));
  },
  footer: async ({ page }, use) => {
    await use(new FooterPom({ page }));
  },
  requestedHosts: async ({ context }, use) => {
    await use(new RequestedHosts(context));
  },
  productionHost: async ({ baseURL, context }, use) => {
    let routing: Promise<ProductionHost> | undefined;
    const testEnd = new AbortController();
    await use(() => {
      if (baseURL === undefined) {
        throw new Error("The production host routing needs a baseURL");
      }
      if (!routing) {
        routing = routeProductionHost(context, baseURL, testEnd.signal);
      }
      return routing;
    });
    // The context closes after this fixture ends, so the routing leaves out the errors of the requests that the pages still make then
    testEnd.abort();
  },
  pageErrors: [
    async ({ context }, use) => {
      const pageErrors = new PageErrors(context);

      await use(pageErrors);

      expect(
        pageErrors.unexpected,
        "The pages logged errors to the console or threw them"
      ).toEqual([]);
    },
    { auto: true },
  ],
  clipboardWrites: async ({ context }, use) => {
    await use(await ClipboardWrites.install(context));
  },
  documentLoads: async ({ context }, use) => {
    await use(new DocumentLoads(context));
  },
  docItem: async ({ page }, use) => {
    await use(new DocItemPom({ page }));
  },
  docSidebar: async ({ page }, use) => {
    await use(new DocSidebarPom({ page }));
  },
  navbar: async ({ page }, use) => {
    await use(new NavbarPom({ page }));
  },
  notFoundContent: async ({ page }, use) => {
    await use(new NotFoundContentPom({ page }));
  },
  openPlaygroundTab: async ({ context }, use) => {
    await use(async (url) => {
      const tab = await context.newPage();

      await tab.goto(url);

      return new PlaygroundPagePom({ page: tab });
    });
  },
  openPlaygroundInFreshContext: async ({ baseURL, browser, viewport }, use) => {
    const opened: { context: BrowserContext; pageErrors: PageErrors }[] = [];

    await use(async (url) => {
      const context = await browser.newContext({ baseURL, viewport });

      await abortWebAnalytics(context);

      // The context is not the one of the test, so the fixture that fails the test on an error does not hear it
      opened.push({ context, pageErrors: new PageErrors(context) });

      const tab = await context.newPage();

      await tab.goto(url);

      return new PlaygroundPagePom({ page: tab });
    });

    for (const { context, pageErrors } of opened) {
      await context.close();
      expect(
        pageErrors.unexpected,
        "The pages of a fresh context logged errors to the console or threw them"
      ).toEqual([]);
    }
  },
  playgroundPage: async ({ page }, use) => {
    await use(new PlaygroundPagePom({ page }));
  },
  scripts: async ({ context }, use) => {
    await use(new ScriptResponses(context));
  },
  site: async ({ page }, use) => {
    await use(new RootPom({ page }));
  },
  startedWorkers: async ({ context }, use) => {
    await use(new StartedWorkers(context));
  },
});

export {
  ANALYTICS_COOKIE_NAMES,
  ANALYTICS_TRACKING_ID,
  BEACON_URL,
  expect,
  GTAG_REQUEST_URL,
  NOT_FOUND_PATH,
  PLAYGROUND_CHUNK_MARKER,
  PRODUCTION_ORIGIN,
  WEB_ANALYTICS_TOKEN,
};

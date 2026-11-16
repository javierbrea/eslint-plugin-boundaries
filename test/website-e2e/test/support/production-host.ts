import type { BrowserContext } from "@playwright/test";

/** The origin of the production site, which a spec visits in place of the local server so that `location.hostname` is the production hostname, the only one where `analytics.ts` loads Google Analytics. It is `PRODUCTION_HOSTNAME` of `consent.constants.ts`, which a test file cannot import. */
export const PRODUCTION_ORIGIN = "https://www.jsboundaries.dev";

/** The URL of the gtag.js script that `enableAnalytics` requests, with the tracking id of the site. */
export const GTAG_REQUEST_URL =
  "https://www.googletagmanager.com/gtag/js?id=G-QDP350TYF0";

/** The names of the cookies that Google Analytics sets, which the consent library deletes when the analytics category is withdrawn. */
export const ANALYTICS_COOKIE_NAMES = ["_ga", "_ga_QDP350TYF0"] as const;

/** The routing that makes a browser context behave as the production host. */
export type ProductionHost = {
  /** The URL of every request to `www.googletagmanager.com` so far, in the order the pages made them. */
  readonly gtagRequests: string[];
};

/**
 * Routes the requests of a browser context so that the site behaves as served from the production host: a request to `PRODUCTION_ORIGIN` is served by the local build, a request to `www.googletagmanager.com` is answered with an empty script and recorded, and a request to `google-analytics.com` is aborted. It drives the network only and never queries the page; a spec installs it before it navigates to `PRODUCTION_ORIGIN`.
 * @param context The browser context of the test.
 * @param baseURL The base URL of the suite, where `docusaurus serve` answers the build.
 * @returns The requests to Google that the routing records.
 */
export async function routeProductionHost(
  context: BrowserContext,
  baseURL: string
): Promise<ProductionHost> {
  const gtagRequests: string[] = [];

  await context.route(`${PRODUCTION_ORIGIN}/**`, async (route) => {
    const url = new URL(route.request().url());
    const response = await route.fetch({
      url: `${baseURL}${url.pathname}${url.search}`,
    });
    await route.fulfill({ response });
  });

  await context.route(
    /^https:\/\/www\.googletagmanager\.com\//,
    async (route) => {
      gtagRequests.push(route.request().url());
      await route.fulfill({ contentType: "text/javascript", body: "" });
    }
  );

  await context.route(/google-analytics\.com\//, (route) => route.abort());

  return { gtagRequests };
}

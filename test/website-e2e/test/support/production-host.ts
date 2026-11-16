import type { BrowserContext } from "@playwright/test";

/** The origin of the production site, which a spec visits in place of the local server so that `location.hostname` is the production hostname, the only one where `analytics.ts` loads Google Analytics. It is `PRODUCTION_HOSTNAME` of `consent.constants.ts`, which a test file cannot import. */
export const PRODUCTION_ORIGIN = "https://www.jsboundaries.dev";

/** The Google Analytics 4 measurement id of the site, which `enableAnalytics` puts in the URL of gtag.js and in its `config` command. It is `ANALYTICS_TRACKING_ID` of `consent.constants.ts`, which a test file cannot import. */
export const ANALYTICS_TRACKING_ID = "G-QDP350TYF0";

/** The URL of the gtag.js script that `enableAnalytics` requests, with the tracking id of the site. */
export const GTAG_REQUEST_URL = `https://www.googletagmanager.com/gtag/js?id=${ANALYTICS_TRACKING_ID}`;

/** The names of the cookies that Google Analytics sets, which the consent library deletes when the analytics category is withdrawn: `_ga` and `_ga_` plus the tracking id without its `G-` prefix, as the site names it. */
export const ANALYTICS_COOKIE_NAMES = [
  "_ga",
  `_ga_${ANALYTICS_TRACKING_ID.replace(/^G-/, "")}`,
] as const;

/** The endpoint the stand-in of gtag.js reports every command to. A URL predicate answers the beacons, and the stand-in takes the URL as its argument, so the address is written once. */
const COLLECT_URL = "https://www.google-analytics.com/g/collect?command=";

/**
 * The stand-in for gtag.js that the routing serves in place of the real script, which runs in the page: as gtag.js does, it reads `window.dataLayer`, handles only the entries that are `Arguments` objects (`Object.prototype.toString` tells them apart, which is how gtag.js knows its commands from other pushes), both those queued before it loads and those pushed afterwards, and reports each one through the network only, as a `command` parameter of a beacon to the collect endpoint. It is served as `(<this function>)(<endpoint>)`, so the code the page runs is type-checked and linted here. Only its own source reaches the page: it reads nothing but its parameters and the globals of the page, since a module-level constant or an imported helper would type-check here and throw a `ReferenceError` in the browser.
 * @param collectUrl The endpoint each command is reported to.
 */
function gtagStandIn(collectUrl: string): void {
  const scope = globalThis as typeof globalThis & {
    dataLayer?: unknown[];
    navigator: { sendBeacon: (url: string) => boolean };
  };
  const queue = (scope.dataLayer ??= []);
  const isCommand = (entry: unknown): boolean =>
    Object.prototype.toString.call(entry) === "[object Arguments]";
  const report = (entry: unknown): void => {
    scope.navigator.sendBeacon(
      `${collectUrl}${encodeURIComponent(
        JSON.stringify(Array.from(entry as ArrayLike<unknown>))
      )}`
    );
  };
  for (const entry of queue) {
    if (isCommand(entry)) {
      report(entry);
    }
  }
  const push = queue.push.bind(queue);
  queue.push = (...entries: unknown[]): number => {
    const result = push(...entries);
    for (const entry of entries) {
      if (isCommand(entry)) {
        report(entry);
      }
    }
    return result;
  };
}

/** The routing that makes a browser context behave as the production host. */
export type ProductionHost = {
  /** The URL of every request to `www.googletagmanager.com` so far, in the order the pages made them. */
  readonly gtagRequests: string[];
  /** The gtag commands that the stand-in of gtag.js has read from `dataLayer` and reported so far, in order, each as the arguments of the call, such as `["config", "G-QDP350TYF0"]` or `["event", "page_view"]`. */
  readonly gtagCommands: string[][];
};

/**
 * Routes the requests of a browser context so that the site behaves as served from the production host: a request to `PRODUCTION_ORIGIN` is served by the local build, a request to `www.googletagmanager.com` is answered with a stand-in of gtag.js and recorded, a beacon of the stand-in is answered with an empty response and its command recorded, and any other request to `google-analytics.com` is aborted. It drives the network only and never queries the page; a spec installs it before it navigates to `PRODUCTION_ORIGIN`.
 * @param context The browser context of the test.
 * @param baseURL The base URL of the suite, where `docusaurus serve` answers the build.
 * @returns The requests to Google and the gtag commands that the routing records.
 */
export async function routeProductionHost(
  context: BrowserContext,
  baseURL: string
): Promise<ProductionHost> {
  const gtagRequests: string[] = [];
  const gtagCommands: string[][] = [];

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
      await route.fulfill({
        contentType: "text/javascript",
        body: `(${gtagStandIn.toString()})(${JSON.stringify(COLLECT_URL)})`,
      });
    }
  );

  await context.route(/google-analytics\.com\//, (route) => route.abort());

  // Registered last so that it runs first: the beacons of the stand-in are answered here and never aborted or sent
  await context.route(
    (url) => url.href.startsWith(COLLECT_URL),
    async (route) => {
      const command = new URL(route.request().url()).searchParams.get(
        "command"
      );
      if (command !== null) {
        gtagCommands.push(JSON.parse(command) as string[]);
      }
      await route.fulfill({ status: 204 });
    }
  );

  return { gtagRequests, gtagCommands };
}

import type { BrowserContext } from "@playwright/test";

import { CLOUDFLARE_URL_PATTERN } from "./requested-hosts";

/** The origin of the production site, which a spec visits in place of the local server so that `location.hostname` is the production hostname, the only one where `analytics.ts` loads Google Analytics and Cloudflare Web Analytics. It is `PRODUCTION_HOSTNAME` of `consent.constants.ts`, which a test file cannot import. */
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

/** The site token of Cloudflare Web Analytics, which `loadWebAnalytics` puts in the `data-cf-beacon` attribute of the beacon. It is `WEB_ANALYTICS_TOKEN` of `consent.constants.ts`, which a test file cannot import. */
export const WEB_ANALYTICS_TOKEN = "9e09cd4b91ac4ae39a146900d5db6210";

/** The URL of the beacon of Cloudflare Web Analytics that `loadWebAnalytics` requests. */
export const BEACON_URL = "https://static.cloudflareinsights.com/beacon.min.js";

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

/** The endpoint the stand-in of the beacon reports its config to, on the host where the real beacon sends its reports. A URL predicate answers the reports, and the stand-in takes the URL as its argument, so the address is written once. */
const REPORT_URL = "https://cloudflareinsights.com/cdn-cgi/rum?config=";

/**
 * The stand-in for the beacon of Cloudflare Web Analytics that the routing serves in place of the real script, which runs in the page: as the beacon does, it reads its config from the `data-cf-beacon` attribute of `document.currentScript`, the script element that loaded it, and reports it through the network only, as a `config` parameter of a beacon to the report endpoint, or an empty one when the script has no such attribute. It is served as `(<this function>)(<endpoint>)`, so the code the page runs is type-checked and linted here. Only its own source reaches the page: it reads nothing but its parameters and the globals of the page, since a module-level constant or an imported helper would type-check here and throw a `ReferenceError` in the browser.
 * @param reportUrl The endpoint the config is reported to.
 */
function beaconStandIn(reportUrl: string): void {
  const scope = globalThis as typeof globalThis & {
    document: {
      currentScript: { getAttribute: (name: string) => string | null } | null;
    };
    navigator: { sendBeacon: (url: string) => boolean };
  };
  const config =
    scope.document.currentScript?.getAttribute("data-cf-beacon") ?? "";
  scope.navigator.sendBeacon(`${reportUrl}${encodeURIComponent(config)}`);
}

/** The routing that makes a browser context behave as the production host. */
export type ProductionHost = {
  /** The URL of every request to `www.googletagmanager.com` so far, in the order the pages made them. */
  readonly gtagRequests: string[];
  /** The gtag commands that the stand-in of gtag.js has read from `dataLayer` and reported so far, in order, each as the arguments of the call, such as `["config", "G-QDP350TYF0"]` or `["event", "page_view"]`. */
  readonly gtagCommands: string[][];
  /** The URL of every request to `static.cloudflareinsights.com` so far, in the order the pages made them. */
  readonly beaconRequests: string[];
  /** The configs that the stand-in of the beacon has read from the `data-cf-beacon` attribute of its script and reported so far, in order, each parsed as JSON, such as `{ token: "9e09cd4b91ac4ae39a146900d5db6210" }`, or as the string it reported when it is not JSON. */
  readonly beaconConfigs: unknown[];
};

/**
 * Routes the requests of a browser context so that the site behaves as served from the production host: a request to `PRODUCTION_ORIGIN` is served by the local build; a request to `www.googletagmanager.com` is answered with a stand-in of gtag.js and recorded, a beacon of that stand-in is answered with an empty response and its command recorded, and any other request to `google-analytics.com` is aborted; a request to `static.cloudflareinsights.com` is answered with a stand-in of the beacon of Cloudflare Web Analytics and recorded, a report of that stand-in is answered with an empty response and its config recorded, and any other request that matches `CLOUDFLARE_URL_PATTERN` is aborted. It drives the network only and never queries the page; a spec installs it before it navigates to `PRODUCTION_ORIGIN`, after the fixtures that abort every request to Google or Cloudflare, so that its routes, which Playwright runs before the ones registered earlier, answer first.
 * @param context The browser context of the test.
 * @param baseURL The base URL of the suite, where `docusaurus serve` answers the build.
 * @param testEnd Aborted when the test ends, before its context closes. Closing a context disposes the responses that `route.fetch` stored before it closes the pages, so a request to `PRODUCTION_ORIGIN` still in flight then fails to be answered; that error is left out once the signal is aborted, and thrown before.
 * @returns The requests to Google and Cloudflare, the gtag commands and the beacon configs that the routing records.
 */
export async function routeProductionHost(
  context: BrowserContext,
  baseURL: string,
  testEnd: AbortSignal
): Promise<ProductionHost> {
  const gtagRequests: string[] = [];
  const gtagCommands: string[][] = [];
  const beaconRequests: string[] = [];
  const beaconConfigs: unknown[] = [];

  await context.route(`${PRODUCTION_ORIGIN}/**`, async (route) => {
    const url = new URL(route.request().url());
    try {
      const response = await route.fetch({
        url: `${baseURL}${url.pathname}${url.search}`,
      });
      await route.fulfill({ response });
    } catch (error) {
      if (!testEnd.aborted) {
        throw error;
      }
    }
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

  await context.route(CLOUDFLARE_URL_PATTERN, (route) => route.abort());

  // Registered after the abort of every Cloudflare host so that it runs before it
  await context.route(
    /^https:\/\/static\.cloudflareinsights\.com\//,
    async (route) => {
      beaconRequests.push(route.request().url());
      await route.fulfill({
        contentType: "text/javascript",
        body: `(${beaconStandIn.toString()})(${JSON.stringify(REPORT_URL)})`,
      });
    }
  );

  // Registered last so that they run first: the beacons of the stand-ins are answered here and never aborted or sent
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

  await context.route(
    (url) => url.href.startsWith(REPORT_URL),
    async (route) => {
      const config =
        new URL(route.request().url()).searchParams.get("config") ?? "";
      try {
        beaconConfigs.push(JSON.parse(config) as unknown);
      } catch {
        beaconConfigs.push(config);
      }
      await route.fulfill({ status: 204 });
    }
  );

  return { gtagRequests, gtagCommands, beaconRequests, beaconConfigs };
}

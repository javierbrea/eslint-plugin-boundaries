import type { BrowserContext } from "@playwright/test";

/**
 * The hosts that a page requests when Google Analytics runs, as a pattern of a request URL: `www.googletagmanager.com`, which serves gtag.js, and a subdomain of `google-analytics.com` or `analytics.google.com`, which collect the events. The `consentBannerSetup` fixture aborts every request that matches it in the tests that set `consentBanner`, so a broken gate sends no real hit to Google.
 */
export const GOOGLE_URL_PATTERN =
  /^https:\/\/(www\.googletagmanager\.com|[^/]*\.google-analytics\.com|[^/]*\.analytics\.google\.com)(\/|$)/;

/**
 * The hosts that a page requests when Cloudflare Web Analytics runs, as a pattern of a request URL: `static.cloudflareinsights.com`, which serves the beacon, and `cloudflareinsights.com`, which collects its reports. Every browser context that a fixture opens aborts every request that matches it (the `webAnalyticsGuard` fixture in the context of the test, `openPlaygroundInFreshContext` in the ones it opens), since the site loads the beacon without consent, so a broken gate sends no real report to Cloudflare. The same pattern as `packages/website/scripts/screenshots.mjs`.
 */
export const CLOUDFLARE_URL_PATTERN =
  /^https:\/\/([^/]*\.)?cloudflareinsights\.com(\/|$)/;

/**
 * The hostname of every request that the pages of a browser context make, which tells whether a page reached a host without knowing how the site names its URLs. It listens to every page of the context from the moment it is built, so a spec builds it before it visits a page.
 */
export class RequestedHosts {
  private readonly hostnames = new Set<string>();

  /**
   * Starts listening.
   * @param context The browser context of the test.
   */
  constructor(context: BrowserContext) {
    context.on("request", (request) => {
      this.hostnames.add(new URL(request.url()).hostname);
    });
  }

  /**
   * Whether a request went to a Google host so far, including one that a route aborted, which still emits the `request` event.
   * @returns True when a page has requested a Google host.
   */
  get requestedGoogle(): boolean {
    return [...this.hostnames].some((hostname) =>
      GOOGLE_URL_PATTERN.test(`https://${hostname}/`)
    );
  }

  /**
   * Whether a request went to a Cloudflare Web Analytics host so far, including one that a route aborted, which still emits the `request` event.
   * @returns True when a page has requested a Cloudflare Web Analytics host.
   */
  get requestedCloudflare(): boolean {
    return [...this.hostnames].some((hostname) =>
      CLOUDFLARE_URL_PATTERN.test(`https://${hostname}/`)
    );
  }
}

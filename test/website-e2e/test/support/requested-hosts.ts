import type { BrowserContext } from "@playwright/test";

/**
 * The hosts that a page requests when Google Analytics runs, as a pattern of a request URL: `www.googletagmanager.com`, which serves gtag.js, and a subdomain of `google-analytics.com` or `analytics.google.com`, which collect the events. The `consentBanner` fixture aborts every request that matches it, so a broken gate sends no real hit to Google.
 */
export const GOOGLE_URL_PATTERN =
  /^https:\/\/(www\.googletagmanager\.com|[^/]*\.google-analytics\.com|[^/]*\.analytics\.google\.com)(\/|$)/;

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
}

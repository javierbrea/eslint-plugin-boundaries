import {
  ANALYTICS_TRACKING_ID,
  PRODUCTION_HOSTNAME,
} from "./consent.constants";

declare global {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- Declaration merging needs an interface
  interface Window {
    /** The queue that the Google snippet and gtag.js share: calls made before the script loads wait here. */
    dataLayer?: IArguments[];
    /** Google's documented switch `ga-disable-<ID>`: when true, a loaded gtag.js sends nothing and sets no cookie. */
    [key: `ga-disable-${string}`]: boolean | undefined;
  }
}

const GA_DISABLE_FLAG = `ga-disable-${ANALYTICS_TRACKING_ID}`;

// `window.gtag` is typed as always defined by the `Gtag` global of the vendored
// types of @docusaurus/plugin-google-gtag (pulled in by the preset types), so a
// module flag is the "loaded" signal instead
let loaded = false;

/**
 * Whether the site is being served from the production hostname. Google Analytics never loads anywhere else, so deploy previews, local builds and the test suite are not counted.
 *
 * @returns `true` only on `PRODUCTION_HOSTNAME`.
 */
function isProductionHost(): boolean {
  return window.location.hostname === PRODUCTION_HOSTNAME;
}

/**
 * Lets Google Analytics run and loads gtag.js, as Google's own snippet does: it defines `dataLayer` and `gtag`, queues the `js` and `config` calls, and appends the script. It does nothing outside the production hostname, and only the first call loads the script.
 */
export function enableAnalytics(): void {
  if (!isProductionHost()) {
    return;
  }
  window[GA_DISABLE_FLAG] = false;
  if (loaded) {
    return;
  }
  window.dataLayer = window.dataLayer ?? [];
  // gtag.js processes only Arguments objects, so the queue function must push `arguments`, not a rest array
  window.gtag = function gtag() {
    window.dataLayer?.push(arguments);
  };
  window.gtag("js", new Date());
  window.gtag("config", ANALYTICS_TRACKING_ID);
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${ANALYTICS_TRACKING_ID}`;
  document.head.appendChild(script);
  loaded = true;
}

/**
 * Stops Google Analytics without reloading the page: a loaded gtag.js that sees the flag sends nothing and sets no cookie. The consent library deletes the `_ga` cookies itself when the analytics category is withdrawn.
 */
export function disableAnalytics(): void {
  window[GA_DISABLE_FLAG] = true;
}

/**
 * Sends a `page_view` event for a client-side navigation, as the client module of `@docusaurus/plugin-google-gtag` does. It does nothing until gtag.js is loaded, or while analytics is disabled.
 *
 * @param path - The path, search and hash of the new page.
 */
export function sendPageView(path: string): void {
  if (!loaded || window[GA_DISABLE_FLAG]) {
    return;
  }
  window.gtag("set", "page_path", path);
  window.gtag("event", "page_view");
}

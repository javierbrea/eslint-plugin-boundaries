/** The hostname of the production site. Google Analytics and Cloudflare Web Analytics load only here, and `docusaurus.config.ts` builds `url` from it. Shared by the config, the client modules and the Playwright page objects. */
export const PRODUCTION_HOSTNAME = "www.jsboundaries.dev";

/** The Google Analytics 4 measurement id of the site. Shared by the analytics loader and the texts that name the `_ga_QDP350TYF0` cookie. */
export const ANALYTICS_TRACKING_ID = "G-QDP350TYF0";

/** The site token of Cloudflare Web Analytics, public because the beacon sends it with every report; the analytics loader puts it in the `data-cf-beacon` attribute of the beacon. */
export const WEB_ANALYTICS_TOKEN = "9e09cd4b91ac4ae39a146900d5db6210";

/** The name of the consent category that controls Google Analytics. */
export const ANALYTICS_CATEGORY = "analytics";

/** The attribute of the footer button that opens the cookie preferences. The client module listens for clicks on it. */
export const COOKIE_SETTINGS_ATTRIBUTE = "data-jsb-cookie-settings";

/** The English texts of the consent banner and its cookie preferences; the Playwright page objects find the banner's controls by them, and `test/website-e2e/test/consent.spec.ts` compares what the page objects read with copies of them, since a test file cannot import this one. */
export const CONSENT_LABELS = {
  consentTitle: "This site uses cookies",
  consentQuestion:
    "May we use Google Analytics to learn how the docs are used?",
  acceptAll: "Accept all",
  rejectAll: "Reject all",
  preferencesTitle: "Cookie settings",
  savePreferences: "Save preferences",
  analyticsSection: "Analytics",
  webAnalyticsSection: "Visit counts without cookies",
  close: "Close",
} as const;

/** The label of the footer button that opens the cookie preferences. It shares the title of the preferences dialog it opens, on purpose. */
export const COOKIE_SETTINGS_LABEL = CONSENT_LABELS.preferencesTitle;

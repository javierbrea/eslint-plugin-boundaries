/** The hostname of the production site. Google Analytics loads only here, and `docusaurus.config.ts` builds `url` from it. Shared by the config, the client module and the Playwright page objects. */
export const PRODUCTION_HOSTNAME = "www.jsboundaries.dev";

/** The Google Analytics 4 measurement id of the site. Shared by the analytics loader and the texts that name the `_ga_QDP350TYF0` cookie. */
export const ANALYTICS_TRACKING_ID = "G-QDP350TYF0";

/** The name of the consent category that controls Google Analytics. */
export const ANALYTICS_CATEGORY = "analytics";

/** The attribute of the footer button that opens the cookie preferences. The client module listens for clicks on it. */
export const COOKIE_SETTINGS_ATTRIBUTE = "data-jsb-cookie-settings";

/** The English texts of the consent banner and its cookie preferences; the Playwright page objects find the banner's controls by them. */
export const CONSENT_LABELS = {
  consentTitle: "This site uses cookies",
  acceptAll: "Accept all",
  rejectAll: "Reject all",
  managePreferences: "Manage preferences",
  preferencesTitle: "Cookie settings",
  savePreferences: "Save preferences",
  analyticsSection: "Analytics",
  close: "Close",
} as const;

/** The label of the footer button that opens the cookie preferences. It shares the title of the preferences dialog it opens, on purpose. */
export const COOKIE_SETTINGS_LABEL = CONSENT_LABELS.preferencesTitle;

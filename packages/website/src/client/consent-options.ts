import type { CookieConsentConfig } from "vanilla-cookieconsent";

import type { GoogleAnalyticsMode } from "../data/site/googleAnalyticsMode";

/** The options of the consent library that differ with the mode of Google Analytics. */
export type ConsentModeOptions = Required<
  Pick<CookieConsentConfig, "mode" | "autoShow" | "respectGpc">
> & {
  /** The `enabled` option of the `analytics` category. */
  analyticsEnabled: boolean;
};

/**
 * Returns the options of the consent library for the mode of Google Analytics of the build. `disabled` gets those of `opt-in`, though the site then loads no consent library.
 *
 * - `analyticsEnabled`: before any saved choice, opt-out accepts only the categories that are `readOnly` or `enabled` (and not blocked by Global Privacy Control while `respectGpc` is on), so it is on in `opt-out`. It is off in `opt-in`, or the preferences opened before a choice would show Analytics on.
 * - `autoShow`: off in `opt-out`, which keeps the banner closed.
 * - `respectGpc`: off in `opt-out`, which ignores Global Privacy Control as the site did before it had a banner (the Docusaurus gtag plugin never read it). On in `opt-in`, which keeps Analytics off and the banner closed while the browser sends it and the visitor has not chosen.
 * @param googleAnalyticsMode The mode of the build.
 * @returns The options of that mode.
 */
export function getConsentModeOptions(
  googleAnalyticsMode: GoogleAnalyticsMode
): ConsentModeOptions {
  if (googleAnalyticsMode === "opt-out") {
    return {
      mode: "opt-out",
      autoShow: false,
      respectGpc: false,
      analyticsEnabled: true,
    };
  }
  return {
    mode: "opt-in",
    autoShow: true,
    respectGpc: true,
    analyticsEnabled: false,
  };
}

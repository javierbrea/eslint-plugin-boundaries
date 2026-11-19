/** Modes of Google Analytics that a build of the site can take: `opt-in` loads it once the visitor accepts it in the consent banner, `opt-out` loads it with no banner until the visitor turns it off in "Cookie settings", and `disabled` leaves Google Analytics, the banner and the consent library out of the site. */
export const GOOGLE_ANALYTICS_MODES = [
  "opt-in",
  "opt-out",
  "disabled",
] as const;

/** A mode of Google Analytics of the build. */
export type GoogleAnalyticsMode = (typeof GOOGLE_ANALYTICS_MODES)[number];

/** The key of `customFields` in docusaurus.config.ts that holds the mode. */
export const GOOGLE_ANALYTICS_MODE_FIELD = "googleAnalyticsMode";

// The mode of a build that sets no variable, and of a config that holds no valid mode
const DEFAULT_MODE: GoogleAnalyticsMode = "opt-in";

// The only value that turns a variable on
const ENABLED_VALUE = "true";

const MODES: ReadonlySet<unknown> = new Set(GOOGLE_ANALYTICS_MODES);

function isGoogleAnalyticsMode(value: unknown): value is GoogleAnalyticsMode {
  return MODES.has(value);
}

/**
 * Resolves the mode of the build from its environment variables. Only the exact string "true" turns a variable on, and `DISABLE_GOOGLE_ANALYTICS` wins over `DISABLE_CONSENT_BANNER`.
 * @param env The environment variables of the build, such as `process.env`.
 * @returns `disabled` when `DISABLE_GOOGLE_ANALYTICS` is "true", else `opt-out` when `DISABLE_CONSENT_BANNER` is "true", else `opt-in`.
 */
export function resolveGoogleAnalyticsMode(
  env: Readonly<Record<string, string | undefined>>
): GoogleAnalyticsMode {
  if (env.DISABLE_GOOGLE_ANALYTICS === ENABLED_VALUE) {
    return "disabled";
  }
  if (env.DISABLE_CONSENT_BANNER === ENABLED_VALUE) {
    return "opt-out";
  }
  return DEFAULT_MODE;
}

/**
 * Reads the mode of the build from the `customFields` of the site config.
 * @param customFields The `customFields` of the site config, if any.
 * @returns The value under `GOOGLE_ANALYTICS_MODE_FIELD` when it is a mode, else `opt-in`.
 */
export function readGoogleAnalyticsMode(
  customFields: Readonly<Record<string, unknown>> | undefined
): GoogleAnalyticsMode {
  const value = customFields?.[GOOGLE_ANALYTICS_MODE_FIELD];
  return isGoogleAnalyticsMode(value) ? value : DEFAULT_MODE;
}

/**
 * Tells whether a block meant for some modes shows in the mode of the build. MDX props are not type-checked, so it throws on an entry that is not a mode: a typo then fails the server render of the page, and the build.
 * @param mode The mode of the build.
 * @param modes The modes the block is meant for.
 * @returns Whether `modes` holds `mode`.
 * @throws {Error} When an entry of `modes` is not a mode. The message names every such entry.
 */
export function isShownInGoogleAnalyticsMode(
  mode: GoogleAnalyticsMode,
  modes: readonly GoogleAnalyticsMode[]
): boolean {
  const unknownModes = modes.filter((entry) => !isGoogleAnalyticsMode(entry));
  if (unknownModes.length > 0) {
    const quote = (entry: unknown): string => `"${String(entry)}"`;
    throw new Error(
      `Not a Google Analytics mode: ${unknownModes.map(quote).join(", ")}. The modes are ${GOOGLE_ANALYTICS_MODES.map(quote).join(", ")}.`
    );
  }
  return modes.includes(mode);
}

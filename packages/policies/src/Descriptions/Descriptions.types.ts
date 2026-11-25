import type { SettingsNormalized } from "@boundaries/config";
import type { Matcher } from "@boundaries/elements";

/**
 * Returns the `@boundaries/elements` matcher of some normalized settings.
 * @param settings The settings, normalized by `@boundaries/config`.
 * @returns The matcher of the settings.
 */
export type MatcherGetter = (settings: SettingsNormalized) => Matcher;

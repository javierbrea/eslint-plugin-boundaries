import { SETTINGS } from "@boundaries/config";
import type { Diagnostic } from "@boundaries/config";

import type { DescriptorFailure } from "./DescribeFiles.types";
import { pointsTo } from "./Diagnostics";
import type { ConfigRead } from "./ParseConfig.types";

/** The key of the settings in the config object */
export const SETTINGS_KEY = "settings";

/** What the plugin does with a descriptor that makes describing the files throw, which the editor has to say because the throw itself says nothing about it */
const FAILURE_DETAIL =
  "ESLint stops with this error when it loads a rule of the plugin, whatever file it lints.";

/**
 * Reads a value as an object whose keys are looked up.
 * @param value Anything the config text writes.
 * @returns The value when it is an object, and `undefined` when it is an array, `null` or a primitive.
 */
export function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

/**
 * Reads the settings of the config as written.
 * @param config The config as written.
 * @returns The settings, or an empty object when they are not an object.
 */
export function readSettings(config: ConfigRead): Record<string, unknown> {
  return asRecord(config.value[SETTINGS_KEY]) ?? {};
}

/**
 * Tells which setting the element descriptors are read from, as `@boundaries/config` reads them.
 * @param settings The settings as written.
 * @returns `boundaries/elements`, or the deprecated `boundaries/types` when `boundaries/elements` is not set.
 */
export function getElementsKey(settings: Record<string, unknown>): string {
  return settings[SETTINGS.ELEMENTS] ? SETTINGS.ELEMENTS : SETTINGS.TYPES;
}

/**
 * Finds where the descriptors that `normalizeConfig` keeps are written. It keeps the valid ones in their order, and says of each other one that it is invalid and ignored.
 * @param settings The settings as written.
 * @param key The setting with the descriptors.
 * @param diagnostics The diagnostics of `normalizeConfig`.
 * @returns For each descriptor of the normalized settings, in their order, its index in the list as written. None when the setting is not a list.
 */
export function getKeptIndexes(
  settings: Record<string, unknown>,
  key: string,
  diagnostics: readonly Diagnostic[]
): number[] {
  const written = settings[key];
  return (Array.isArray(written) ? written : [])
    .map((_entry, index) => index)
    .filter((index) => !pointsTo(diagnostics, [SETTINGS_KEY, key, index]));
}

/**
 * Describes the descriptors left out because describing the files throws, as errors at their entries.
 * @param config The config as written.
 * @param diagnostics The diagnostics of `normalizeConfig`.
 * @param failures The descriptors left out.
 * @returns One error per descriptor, with the message of the error and a period as its title, as `normalizeConfigSafely` writes the policies that throw.
 */
export function diagnoseFailures(
  config: ConfigRead,
  diagnostics: readonly Diagnostic[],
  failures: readonly DescriptorFailure[]
): Diagnostic[] {
  const settings = readSettings(config);
  const keys = {
    elements: getElementsKey(settings),
    files: SETTINGS.FILES,
  };
  const indexes = {
    elements: getKeptIndexes(settings, keys.elements, diagnostics),
    files: getKeptIndexes(settings, keys.files, diagnostics),
  };
  return failures.map(({ descriptors, position, message }) => ({
    level: "error",
    title: `${message}.`,
    detail: FAILURE_DETAIL,
    paths: [[SETTINGS_KEY, keys[descriptors], indexes[descriptors][position]]],
  }));
}

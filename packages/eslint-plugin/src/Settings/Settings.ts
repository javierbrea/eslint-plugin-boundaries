import { isAbsolute, resolve } from "node:path";

import {
  moreInfoSettingsLink,
  normalizeSettings,
  SETTINGS_KEYS_MAP,
} from "@boundaries/config";
import type { Rule } from "eslint";

import { warnDiagnostics, warnOnce } from "../Debug";
import { isString, SETTINGS } from "../Shared";
import type { SettingsNormalized } from "../Shared";

const { ENV_ROOT_PATH } = SETTINGS;

const trackedValidatedSettings = new WeakMap<
  Rule.RuleContext["settings"],
  SettingsNormalized
>();

/**
 * Resolves the effective root path from the root-path setting and the environment variable.
 *
 * @param rootPath - Raw root-path setting value.
 * @returns Resolved absolute root path, and whether the environment variable holds a relative path that cannot be resolved because the setting is not set.
 */
function getNormalizedRootPath(rootPath: unknown): {
  rootPath: string;
  isInvalid: boolean;
} {
  const userSetting = rootPath && isString(rootPath) ? rootPath : undefined;
  const envRootPath = process.env[ENV_ROOT_PATH];
  const effectiveRootPath = envRootPath || userSetting;

  if (!effectiveRootPath) {
    return { rootPath: process.cwd(), isInvalid: false };
  }

  if (isAbsolute(effectiveRootPath)) {
    return { rootPath: effectiveRootPath, isInvalid: false };
  }

  if (!userSetting) {
    return { rootPath: process.cwd(), isInvalid: true };
  }

  return {
    rootPath: resolve(process.cwd(), effectiveRootPath),
    isInvalid: false,
  };
}

/**
 * Returns normalized and cached settings from ESLint rule context, printing the problems found in them.
 *
 * @param context - ESLint rule context.
 * @returns Normalized settings object used by rules.
 */
export function getSettings(context: Rule.RuleContext): SettingsNormalized {
  const alreadyValidatedSettings = trackedValidatedSettings.get(
    context.settings
  );
  if (alreadyValidatedSettings) {
    return alreadyValidatedSettings;
  }

  const { rootPath, isInvalid: isInvalidRootPath } = getNormalizedRootPath(
    context.settings[SETTINGS_KEYS_MAP.ROOT_PATH]
  );
  const { value: settings, diagnostics } = normalizeSettings(context.settings, {
    rootPath,
  });

  warnDiagnostics(diagnostics);
  // After the settings warnings, in the order the plugin prints them
  if (isInvalidRootPath) {
    warnOnce(
      `Please provide a valid value in '${SETTINGS_KEYS_MAP.ROOT_PATH}' setting.`,
      `The value should be a string. ${moreInfoSettingsLink()}`
    );
  }

  trackedValidatedSettings.set(context.settings, settings);
  return settings;
}

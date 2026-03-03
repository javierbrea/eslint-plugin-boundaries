import { isAbsolute, resolve } from "node:path";

import type { ElementDescriptors } from "@boundaries/elements";

import { isArray } from "../Support";

import { isLegacyType } from "./Helpers";
import { SETTINGS } from "./Settings.types";
import type { Settings } from "./Settings.types";

const { VALID_MODES, ROOT_PATH, ENV_ROOT_PATH, DEBUG } = SETTINGS;

// TODO, remove in next major version
/**
 * Converts legacy string element descriptors into object descriptors.
 *
 * @param typesFromSettings - Raw `boundaries/elements` setting value.
 * @returns Normalized element descriptors compatible with current matcher API.
 */
export function transformLegacyTypes(
  typesFromSettings?: string[] | ElementDescriptors
): ElementDescriptors {
  const types = typesFromSettings || [];
  if (!isArray(types)) {
    return [];
  }
  return types.map((type) => {
    // backward compatibility with v1
    if (isLegacyType(type)) {
      return {
        type: type,
        match: VALID_MODES[0],
        pattern: `${type}/*`,
        capture: ["elementName"],
      };
    }
    // default options
    return {
      match: VALID_MODES[0],
      ...type,
    };
  });
}

/**
 * Extracts element type names from normalized element descriptors.
 *
 * @param descriptors - Normalized descriptors from settings.
 * @returns List of defined element type names.
 */
export function getElementsTypeNames(
  descriptors: ElementDescriptors
): string[] {
  return descriptors.map((element) => element.type).filter(Boolean) as string[];
}

/**
 * Resolves the effective root path used by boundaries matchers.
 *
 * @param settings - Validated plugin settings.
 * @returns Absolute root path used for dependency and element resolution.
 */
export function getRootPath(settings: Settings): string {
  const rootPathUserSetting = process.env[ENV_ROOT_PATH] || settings[ROOT_PATH];
  if (rootPathUserSetting) {
    return isAbsolute(rootPathUserSetting)
      ? rootPathUserSetting
      : resolve(process.cwd(), rootPathUserSetting);
  }
  return process.cwd();
}

/**
 * Checks whether debug mode is globally enabled through environment variable.
 *
 * @returns `true` when debug env flag is active.
 */
export function isDebugModeEnabled() {
  return Boolean(process.env[DEBUG]);
}

/**
 * Computes final debug activation combining setting flag and environment flag.
 *
 * @param settingEnabled - Debug flag configured in plugin settings.
 * @returns `true` when either setting or environment enables debug mode.
 */
export function isDebugEnabled(settingEnabled = false) {
  return settingEnabled || isDebugModeEnabled();
}

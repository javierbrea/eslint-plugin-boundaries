import { isAbsolute, resolve } from "node:path";

import type { ElementDescriptors } from "@boundaries/elements";

import { SETTINGS } from "../Shared/Settings.types";
import type { Settings } from "../Shared/Settings.types";

import { isLegacyType } from "./Helpers";

const { VALID_MODES, ROOT_PATH, ENV_ROOT_PATH } = SETTINGS;

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

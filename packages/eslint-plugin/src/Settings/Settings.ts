import { isAbsolute, resolve } from "node:path";

import type { ElementDescriptors } from "@boundaries/elements";

import { isArray } from "../Support";

import { isLegacyType } from "./Helpers";
import { SETTINGS } from "./Settings.types";
import type { Settings } from "./Settings.types";

const { TYPES, ELEMENTS, VALID_MODES, ROOT_PATH, ENV_ROOT_PATH, DEBUG } =
  SETTINGS;

// TODO, remove in next major version
function transformLegacyTypes(
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

export function getElements(settings: Settings): ElementDescriptors {
  return transformLegacyTypes(settings[ELEMENTS] || settings[TYPES]);
}

export function getElementsTypeNames(settings: Settings): string[] {
  return getElements(settings)
    .map((element) => element.type)
    .filter(Boolean) as string[];
}

export function getElementsCategoryNames(settings: Settings): string[] {
  return getElements(settings)
    .map((element) => element.category)
    .filter(Boolean) as string[];
}

export function getRootPath(settings: Settings): string {
  const rootPathUserSetting = process.env[ENV_ROOT_PATH] || settings[ROOT_PATH];
  if (rootPathUserSetting) {
    return isAbsolute(rootPathUserSetting)
      ? rootPathUserSetting
      : resolve(process.cwd(), rootPathUserSetting);
  }
  return process.cwd();
}

export function isDebugModeEnabled() {
  return process.env[DEBUG];
}

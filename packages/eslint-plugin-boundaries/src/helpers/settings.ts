import { SETTINGS } from "../constants/settings";
import { isString } from "./utils";
import { isAbsolute, resolve } from "node:path";

const { TYPES, ELEMENTS, VALID_MODES, ROOT_PATH, ENV_ROOT_PATH, DEBUG } =
  SETTINGS;

export function isLegacyType(type) {
  return isString(type);
}

// TODO, remove in next major version
function transformLegacyTypes(typesFromSettings) {
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

export function getElements(settings) {
  return transformLegacyTypes(settings[ELEMENTS] || settings[TYPES]);
}

export function getElementsTypeNames(settings) {
  return getElements(settings).map((element) => element.type);
}

export function getRootPath(settings) {
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

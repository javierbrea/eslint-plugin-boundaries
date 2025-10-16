import { isAbsolute, resolve } from "node:path";

import { SETTINGS } from "../constants/settings";
import type {
  ElementDescriptors,
  ElementDescriptor,
  Settings,
  ElementDescriptorMode,
} from "../constants/settings";

import { warnOnce } from "./debug";
import { isString, isArray, isObject } from "./utils";

const { TYPES, ELEMENTS, VALID_MODES, ROOT_PATH, ENV_ROOT_PATH, DEBUG } =
  SETTINGS;

export function isLegacyType(type: unknown): type is string {
  return isString(type);
}

export function isValidElementAssigner(
  element: unknown,
): element is ElementDescriptor {
  if (!element || !isObject(element)) {
    warnOnce(
      `Please provide a valid object to define element types in '${ELEMENTS}' setting`,
    );
    return false;
  }
  if (isLegacyType(element)) {
    warnOnce(
      `Defining elements as strings in settings is deprecated. Will be automatically converted, but this feature will be removed in next major versions`,
    );
    return true;
  } else {
    const isObjectElement = isObject(element);
    if (!isObjectElement) {
      warnOnce(
        `Please provide a valid object to define element types in '${ELEMENTS}' setting`,
      );
      return false;
    }
    if (!element.type || !isString(element.type)) {
      warnOnce(`Please provide type in '${ELEMENTS}' setting`);
      return false;
    }
    if (
      element.mode &&
      isString(element.mode) &&
      !VALID_MODES.includes(element.mode as ElementDescriptorMode)
    ) {
      warnOnce(
        `Invalid mode property of type ${
          element.type
        } in '${ELEMENTS}' setting. Should be one of ${VALID_MODES.join(
          ",",
        )}. Default value "${VALID_MODES[0]}" will be used instead`,
      );
      return false;
    }
    if (
      !element.pattern ||
      !(isString(element.pattern) || isArray(element.pattern))
    ) {
      warnOnce(
        `Please provide a valid pattern to type ${element.type} in '${ELEMENTS}' setting`,
      );
      return false;
    }
    if (element.capture && !isArray(element.capture)) {
      warnOnce(
        `Invalid capture property of type ${element.type} in '${ELEMENTS}' setting`,
      );
      return false;
    }
    return true;
  }
}

// TODO, remove in next major version
function transformLegacyTypes(
  typesFromSettings?: string[] | ElementDescriptors,
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
  return getElements(settings).map((element) => element.type);
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

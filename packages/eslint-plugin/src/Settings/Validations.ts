import type {
  DependencyKind,
  ElementDescriptors,
  ElementSelector,
  ExternalLibrarySelector,
  ElementsSelector,
  ExternalLibrariesSelector,
  ElementDescriptor,
  ElementDescriptorMode,
} from "@boundaries/elements";
import { isElementDescriptor } from "@boundaries/elements";
import type { Rule } from "eslint";
import micromatch from "micromatch";

import {
  isArray,
  isString,
  isObject,
  isBoolean,
  getArrayOrNull,
} from "../Support/Common";
import { warnOnce } from "../Support/Debug";

import { isDependencyNodeKey, isLegacyType, rulesMainKey } from "./Helpers";
import {
  getElementsTypeNames,
  getRootPath,
  transformLegacyTypes,
} from "./Settings";
import {
  SETTINGS,
  SETTINGS_KEYS_MAP,
  LEGACY_TEMPLATES_DEFAULT,
  DEPENDENCY_NODE_KEYS_MAP,
} from "./Settings.types";
import type {
  DependencyNodeKey,
  DependencyNodeSelector,
  Settings,
  IgnoreSetting,
  IncludeSetting,
  RuleMainKey,
  ValidateRulesOptions,
  RuleOptionsRules,
  SettingsNormalized,
} from "./Settings.types";

const {
  TYPES,
  ALIAS,
  ELEMENTS,
  DEPENDENCY_NODES,
  ADDITIONAL_DEPENDENCY_NODES,
  VALID_DEPENDENCY_NODE_KINDS,
  DEFAULT_DEPENDENCY_NODES,
  VALID_MODES,
} = SETTINGS;

const invalidMatchers: (ElementSelector | ExternalLibrarySelector)[] = [];

const DEFAULT_MATCHER_OPTIONS = {
  type: "object",
};

export function elementsMatcherSchema(
  matcherOptions: Record<string, unknown> = DEFAULT_MATCHER_OPTIONS
) {
  return {
    oneOf: [
      {
        type: "string", // single matcher
      },
      {
        type: "array", // multiple matchers
        items: {
          oneOf: [
            {
              type: "string", // matcher with options
            },
            {
              type: "array",
              items: [
                {
                  type: "string", // matcher
                },
                matcherOptions, // options
              ],
            },
          ],
        },
      },
    ],
  };
}

export function rulesOptionsSchema(
  options: {
    rulesMainKey?: RuleMainKey;
    targetMatcherOptions?: Record<string, unknown>;
  } = {}
) {
  const mainKey = rulesMainKey(options.rulesMainKey);
  return [
    {
      type: "object",
      properties: {
        message: {
          type: "string",
        },
        default: {
          type: "string",
          enum: ["allow", "disallow"],
        },
        rules: {
          type: "array",
          items: {
            type: "object",
            properties: {
              [mainKey]: elementsMatcherSchema(),
              allow: elementsMatcherSchema(options.targetMatcherOptions),
              disallow: elementsMatcherSchema(options.targetMatcherOptions),
              importKind: {
                oneOf: [
                  {
                    type: "string",
                  },
                  {
                    type: "array",
                    items: {
                      type: "string",
                    },
                  },
                ],
              },
              message: {
                type: "string",
              },
            },
            additionalProperties: false,
            anyOf: [
              {
                required: [mainKey, "allow", "disallow"],
              },
              {
                required: [mainKey, "allow"],
              },
              {
                required: [mainKey, "disallow"],
              },
            ],
          },
        },
      },
      additionalProperties: false,
    },
  ];
}

function isValidElementTypesMatcher(
  matcher: ElementSelector | ExternalLibrarySelector,
  settings: SettingsNormalized
) {
  const matcherToCheck = isArray(matcher) ? matcher[0] : matcher;
  const typeMatcherToCheck = isString(matcherToCheck)
    ? matcherToCheck
    : matcherToCheck.type;
  return (
    !matcher ||
    (typeMatcherToCheck &&
      micromatch.some(settings.elementTypeNames, typeMatcherToCheck))
  );
}

// TODO: Remove this validation. Selectors should not be limited to element types defined in settings when using selector objects
export function validateElementTypesMatcher(
  elementsMatcher: ElementsSelector | ExternalLibrariesSelector,
  settings: SettingsNormalized
) {
  const [matcher] = isArray(elementsMatcher)
    ? elementsMatcher
    : [elementsMatcher];
  if (
    !invalidMatchers.includes(matcher) &&
    !isValidElementTypesMatcher(matcher, settings)
  ) {
    invalidMatchers.push(matcher);
    warnOnce(
      `Option '${matcher}' does not match any element type from '${ELEMENTS}' setting`
    );
  }
}

function validateElements(elements: unknown): ElementDescriptors | undefined {
  if (!elements || !isArray(elements) || !elements.length) {
    warnOnce(`Please provide element types using the '${ELEMENTS}' setting`);
    return;
  }
  return elements.filter(isValidElementAssigner);
}

function validateDependencyNodes(
  dependencyNodes: DependencyNodeKey[] | undefined
): DependencyNodeKey[] | undefined {
  if (!dependencyNodes) {
    return;
  }

  const defaultNodesNames = Object.keys(DEFAULT_DEPENDENCY_NODES);
  const invalidFormatMessage = [
    `Please provide a valid value in ${DEPENDENCY_NODES} setting.`,
    `The value should be an array of the following strings:`,
    ` "${defaultNodesNames.join('", "')}".`,
  ].join(" ");

  if (!isArray(dependencyNodes)) {
    warnOnce(invalidFormatMessage);
    return;
  }

  for (const dependencyNode of dependencyNodes) {
    if (!isDependencyNodeKey(dependencyNode)) {
      warnOnce(invalidFormatMessage);
    }
  }

  return dependencyNodes.filter(isDependencyNodeKey);
}

/**
 * Validates the legacyTemplates setting.
 * @param legacyTemplates The legacyTemplates setting value
 * @returns The validated legacyTemplates value or undefined
 */
function validateLegacyTemplates(
  /** The legacyTemplates setting value */
  legacyTemplates: unknown
): boolean | undefined {
  if (legacyTemplates === undefined) {
    return;
  }
  if (isBoolean(legacyTemplates)) {
    return legacyTemplates;
  }
  warnOnce(
    `Please provide a valid value in '${SETTINGS_KEYS_MAP.LEGACY_TEMPLATES}' setting. The value should be a boolean.`
  );
  // Value is invalid, return undefined
  return;
}

function isValidDependencyNodeSelector(
  selector: unknown
): selector is DependencyNodeSelector {
  const isValidObject =
    isObject(selector) &&
    isString(selector.selector) &&
    (!selector.kind ||
      (isString(selector.kind) &&
        VALID_DEPENDENCY_NODE_KINDS.includes(selector.kind as DependencyKind)));
  if (!isValidObject) {
    warnOnce(
      `Please provide a valid object in ${ADDITIONAL_DEPENDENCY_NODES} setting. The object should be composed of the following properties: { selector: "<esquery selector>", kind: "value" | "type" }. The invalid object will be ignored.`
    );
  }
  return isValidObject;
}

function validateAdditionalDependencyNodes(
  additionalDependencyNodes: unknown
): DependencyNodeSelector[] | undefined {
  if (!additionalDependencyNodes) {
    return;
  }

  const invalidFormatMessage = [
    `Please provide a valid value in ${ADDITIONAL_DEPENDENCY_NODES} setting.`,
    "The value should be an array composed of the following objects:",
    '{ selector: "<esquery selector>", kind: "value" | "type" }.',
  ].join(" ");

  if (!isArray(additionalDependencyNodes)) {
    warnOnce(invalidFormatMessage);
    return;
  }

  return additionalDependencyNodes.filter(isValidDependencyNodeSelector);
}

function deprecateAlias(aliases: unknown) {
  if (aliases) {
    warnOnce(
      `Defining aliases in '${ALIAS}' setting is deprecated. Please use 'import/resolver' setting`
    );
  }
}

function deprecateTypes(types: unknown) {
  if (types) {
    warnOnce(
      `'${TYPES}' setting is deprecated. Please use '${ELEMENTS}' instead`
    );
  }
}

function validateIgnore(ignore: unknown): IgnoreSetting | undefined {
  if (!ignore) {
    return;
  }
  if (isString(ignore) || (isArray(ignore) && ignore.every(isString))) {
    return ignore;
  }
  warnOnce(
    `Please provide a valid value in '${SETTINGS_KEYS_MAP.IGNORE}' setting. The value should be a string or an array of strings.`
  );
}

function validateInclude(include: unknown): IncludeSetting | undefined {
  if (!include) {
    return;
  }
  if (isString(include) || (isArray(include) && include.every(isString))) {
    return include;
  }
  warnOnce(
    `Please provide a valid value in '${SETTINGS_KEYS_MAP.INCLUDE}' setting. The value should be a string or an array of strings.`
  );
}

function validateRootPath(rootPath: unknown): string | undefined {
  if (!rootPath) {
    return;
  }
  if (isString(rootPath)) {
    return rootPath;
  }
  warnOnce(
    `Please provide a valid value in '${SETTINGS_KEYS_MAP.ROOT_PATH}' setting. The value should be a string.`
  );
}

export function validateSettings(
  settings: Rule.RuleContext["settings"]
): Settings {
  deprecateTypes(settings[TYPES]);
  deprecateAlias(settings[ALIAS]);

  return {
    [SETTINGS_KEYS_MAP.ELEMENTS]: validateElements(
      settings[ELEMENTS] || settings[TYPES]
    ),
    [SETTINGS_KEYS_MAP.IGNORE]: validateIgnore(
      settings[SETTINGS_KEYS_MAP.IGNORE]
    ),
    [SETTINGS_KEYS_MAP.INCLUDE]: validateInclude(
      settings[SETTINGS_KEYS_MAP.INCLUDE]
    ),
    [SETTINGS_KEYS_MAP.ROOT_PATH]: validateRootPath(
      settings[SETTINGS_KEYS_MAP.ROOT_PATH]
    ),
    [SETTINGS_KEYS_MAP.DEPENDENCY_NODES]: validateDependencyNodes(
      settings[DEPENDENCY_NODES] as DependencyNodeKey[] | undefined
    ),
    [SETTINGS_KEYS_MAP.LEGACY_TEMPLATES]: validateLegacyTemplates(
      settings[SETTINGS_KEYS_MAP.LEGACY_TEMPLATES]
    ),
    [SETTINGS_KEYS_MAP.ADDITIONAL_DEPENDENCY_NODES]:
      validateAdditionalDependencyNodes(settings[ADDITIONAL_DEPENDENCY_NODES]),
  };
}
/**
 * Returns the normalized settings from the ESLint rule context
 * @param context The ESLint rule context
 * @returns The normalized settings
 */
export function getSettings(context: Rule.RuleContext): SettingsNormalized {
  const validatedSettings = validateSettings(context.settings);

  const dependencyNodesSetting = getArrayOrNull<DependencyNodeKey>(
    validatedSettings[SETTINGS_KEYS_MAP.DEPENDENCY_NODES]
  );
  const additionalDependencyNodesSetting =
    getArrayOrNull<DependencyNodeSelector>(
      validatedSettings[ADDITIONAL_DEPENDENCY_NODES]
    );
  const dependencyNodes: DependencyNodeSelector[] =
    // TODO In next major version, make this default to all types of nodes!!!
    (dependencyNodesSetting || [DEPENDENCY_NODE_KEYS_MAP.IMPORT])
      .flatMap((dependencyNode) => [
        ...DEFAULT_DEPENDENCY_NODES[dependencyNode],
      ])
      .filter(Boolean);

  const additionalDependencyNodes = additionalDependencyNodesSetting || [];

  const ignoreSetting = validatedSettings[SETTINGS_KEYS_MAP.IGNORE];
  const ignorePaths = isString(ignoreSetting) ? [ignoreSetting] : ignoreSetting;

  const includeSetting = validatedSettings[SETTINGS_KEYS_MAP.INCLUDE];
  const includePaths = isString(includeSetting)
    ? [includeSetting]
    : includeSetting;

  const descriptors = transformLegacyTypes(validatedSettings[ELEMENTS]);

  // NOTE: Filter valid descriptors only to avoid a breaking change for the moment
  const validDescriptors = descriptors.filter(isElementDescriptor);
  const invalidDescriptors = descriptors.filter(
    (desc) => !isElementDescriptor(desc)
  );
  if (invalidDescriptors.length > 0) {
    /*
     * TODO: Report invalid descriptors in ESLint context as a warning in a separate rule:
     * context.report({
     * message: `Some element descriptors are invalid and will be ignored: ${JSON.stringify(
     *   invalidDescriptors,
     * )}`,
     * loc: { line: 1, column: 0 },
     * });
     */
    warnOnce(
      `Some element descriptors are invalid and will be ignored: ${JSON.stringify(
        invalidDescriptors
      )}`
    );
  }

  return {
    elementDescriptors: validDescriptors,
    elementTypeNames: getElementsTypeNames(validDescriptors),
    ignorePaths,
    includePaths,
    rootPath: getRootPath(validatedSettings),
    dependencyNodes: [...dependencyNodes, ...additionalDependencyNodes],
    legacyTemplates:
      validatedSettings[SETTINGS_KEYS_MAP.LEGACY_TEMPLATES] ??
      LEGACY_TEMPLATES_DEFAULT,
  };
}

export function validateRules(
  settings: SettingsNormalized,
  rules: RuleOptionsRules[] = [],
  options: ValidateRulesOptions = {}
) {
  const mainKey = rulesMainKey(options.mainKey);
  for (const rule of rules) {
    //@ts-expect-error TODO: Add a different schema validation for each rule type, so keys are properly validated
    validateElementTypesMatcher([rule[mainKey]], settings);
    if (!options.onlyMainKey) {
      if (rule.allow) {
        validateElementTypesMatcher(rule.allow, settings);
      }
      if (rule.disallow) {
        validateElementTypesMatcher(rule.disallow, settings);
      }
    }
  }
}

export function isValidElementAssigner(
  element: unknown
): element is ElementDescriptor {
  if (!element) {
    warnOnce(
      `Please provide a valid object to define element types in '${ELEMENTS}' setting`
    );
    return false;
  }
  if (isLegacyType(element)) {
    warnOnce(
      `Defining elements as strings in settings is deprecated. Will be automatically converted, but this feature will be removed in next major versions`
    );
    return true;
  } else {
    const isObjectElement = isObject(element);
    if (!isObjectElement) {
      warnOnce(
        `Please provide a valid object to define element types in '${ELEMENTS}' setting`
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
          ","
        )}. Default value "${VALID_MODES[0]}" will be used instead`
      );
      return false;
    }
    if (
      !element.pattern ||
      !(isString(element.pattern) || isArray(element.pattern))
    ) {
      warnOnce(
        `Please provide a valid pattern to type ${element.type} in '${ELEMENTS}' setting`
      );
      return false;
    }
    if (element.capture && !isArray(element.capture)) {
      warnOnce(
        `Invalid capture property of type ${element.type} in '${ELEMENTS}' setting`
      );
      return false;
    }
    return true;
  }
}

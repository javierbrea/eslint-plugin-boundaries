import type {
  DependencyKind,
  DependencySelector,
  ElementDescriptors,
  ElementDescriptor,
  ElementDescriptorMode,
  ElementsSelector,
  FlagAsExternalOptions,
} from "@boundaries/elements";
import { isElementDescriptor } from "@boundaries/elements";
import type { Rule } from "eslint";

import {
  isArray,
  isString,
  isObject,
  isBoolean,
  getArrayOrNull,
} from "../Support/Common";
import {
  warnOnce,
  shouldWarnLegacyRuleOptions,
  shouldWarnLegacySettings,
} from "../Support/Debug";

import {
  isDependencyNodeKey,
  isLegacyType,
  rulesMainKey,
  detectLegacyElementSelector,
  detectLegacyTemplateSyntax,
} from "./Helpers";
import {
  getElementsTypeNames,
  getRootPath,
  transformLegacyTypes,
} from "./Settings";
import {
  SETTINGS,
  SETTINGS_KEYS_MAP,
  LEGACY_TEMPLATES_DEFAULT,
  CACHE_DEFAULT,
  CHECK_CONFIG_DEFAULT,
  DEPENDENCY_NODE_KEYS_MAP,
} from "./Settings.types";
import type {
  DependencyNodeKey,
  DependencyNodeSelector,
  DebugSetting,
  Settings,
  IgnoreSetting,
  IncludeSetting,
  RuleMainKey,
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

const DEFAULT_MATCHER_OPTIONS = {
  type: "object",
};

export function elementsMatcherSchema(
  matcherOptions: Record<string, unknown> = DEFAULT_MATCHER_OPTIONS
) {
  return {
    oneOf: [
      {
        type: "string", // single matcher (legacy)
      },
      {
        type: "object", // single object-based selector (new format)
        properties: {
          type: {
            oneOf: [
              { type: "string" },
              { type: "array", items: { type: "string" } },
            ],
          },
          category: {
            oneOf: [
              { type: "string" },
              { type: "array", items: { type: "string" } },
            ],
          },
          captured: {
            oneOf: [
              { type: "object" },
              { type: "array", items: { type: "object" } },
            ],
          },
          origin: {
            oneOf: [
              { type: "string" },
              { type: "array", items: { type: "string" } },
            ],
          },
          path: {
            oneOf: [
              { type: "string" },
              { type: "array", items: { type: "string" } },
            ],
          },
          elementPath: {
            oneOf: [
              { type: "string" },
              { type: "array", items: { type: "string" } },
            ],
          },
          internalPath: {
            oneOf: [
              { type: "string" },
              { type: "array", items: { type: "string" } },
            ],
          },
          source: {
            oneOf: [
              { type: "string" },
              { type: "array", items: { type: "string" } },
            ],
          },
          baseSource: {
            oneOf: [
              { type: "string" },
              { type: "array", items: { type: "string" } },
            ],
          },
          isIgnored: { type: "boolean" },
          isUnknown: { type: "boolean" },
          kind: {
            oneOf: [
              { type: "string" },
              { type: "array", items: { type: "string" } },
            ],
          },
          specifiers: {
            oneOf: [
              { type: "string" },
              { type: "array", items: { type: "string" } },
            ],
          },
          nodeKind: {
            oneOf: [
              { type: "string" },
              { type: "array", items: { type: "string" } },
            ],
          },
          relationship: {
            oneOf: [
              { type: "string" },
              { type: "array", items: { type: "string" } },
            ],
          },
        },
        additionalProperties: false,
      },
      {
        type: "array", // multiple matchers
        items: {
          oneOf: [
            {
              type: "string", // matcher (legacy)
            },
            {
              type: "array", // matcher with captured values (legacy)
              items: [
                {
                  type: "string", // matcher
                },
                matcherOptions, // captured values
              ],
            },
            {
              type: "object", // object-based selector (new format)
              properties: {
                type: {
                  oneOf: [
                    { type: "string" },
                    { type: "array", items: { type: "string" } },
                  ],
                },
                category: {
                  oneOf: [
                    { type: "string" },
                    { type: "array", items: { type: "string" } },
                  ],
                },
                captured: {
                  oneOf: [
                    { type: "object" },
                    { type: "array", items: { type: "object" } },
                  ],
                },
                origin: {
                  oneOf: [
                    { type: "string" },
                    { type: "array", items: { type: "string" } },
                  ],
                },
                path: {
                  oneOf: [
                    { type: "string" },
                    { type: "array", items: { type: "string" } },
                  ],
                },
                elementPath: {
                  oneOf: [
                    { type: "string" },
                    { type: "array", items: { type: "string" } },
                  ],
                },
                internalPath: {
                  oneOf: [
                    { type: "string" },
                    { type: "array", items: { type: "string" } },
                  ],
                },
                source: {
                  oneOf: [
                    { type: "string" },
                    { type: "array", items: { type: "string" } },
                  ],
                },
                baseSource: {
                  oneOf: [
                    { type: "string" },
                    { type: "array", items: { type: "string" } },
                  ],
                },
                isIgnored: { type: "boolean" },
                isUnknown: { type: "boolean" },
                kind: {
                  oneOf: [
                    { type: "string" },
                    { type: "array", items: { type: "string" } },
                  ],
                },
                specifiers: {
                  oneOf: [
                    { type: "string" },
                    { type: "array", items: { type: "string" } },
                  ],
                },
                nodeKind: {
                  oneOf: [
                    { type: "string" },
                    { type: "array", items: { type: "string" } },
                  ],
                },
                relationship: {
                  oneOf: [
                    { type: "string" },
                    { type: "array", items: { type: "string" } },
                  ],
                },
              },
              additionalProperties: false,
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

/**
 * Validates rule options and warns about legacy element selector syntax.
 * @param options The rule options to validate
 * @param mainKey The main key used in rules (from/to/target)
 * @param checkConfig Whether to perform configuration checking
 * @param ruleName The name of the rule for warning messages
 */
export function validateAndWarnRuleOptions<
  T extends { rules?: Array<Record<string, unknown>> },
>(
  options: T | undefined,
  mainKey: RuleMainKey = "from",
  checkConfig = false,
  ruleName = "boundaries/unknown"
): void {
  if (!checkConfig) {
    return;
  }

  if (!options || !options.rules || !isArray(options.rules)) {
    return;
  }

  // Check if we've already warned for this options object
  if (!shouldWarnLegacyRuleOptions(options)) {
    return;
  }

  // Collect ALL rules with legacy syntax
  const rulesWithLegacySelector: number[] = [];
  const rulesWithLegacyTemplate: number[] = [];
  const rulesWithDeprecatedImportKind: number[] = [];

  for (const [index, rule] of options.rules.entries()) {
    const ruleMainKey = rulesMainKey(mainKey);
    let hasLegacySelector = false;
    let hasLegacyTemplate = false;

    // Check all selector properties
    for (const key of [ruleMainKey, "allow", "disallow"]) {
      if (rule[key]) {
        if (detectLegacyElementSelector(rule[key])) {
          hasLegacySelector = true;
        }
        if (detectLegacyTemplateSyntax(rule[key])) {
          hasLegacyTemplate = true;
        }
      }
    }

    if (hasLegacySelector) {
      rulesWithLegacySelector.push(index);
    }
    if (hasLegacyTemplate) {
      rulesWithLegacyTemplate.push(index);
    }

    if (rule.importKind !== undefined) {
      rulesWithDeprecatedImportKind.push(index);
    }
  }

  // Show warnings if needed
  if (rulesWithLegacySelector.length > 0) {
    warnOnce(
      `[${ruleName}] Detected legacy selector syntax in ${
        rulesWithLegacySelector.length
      } rule(s) at indices: ${rulesWithLegacySelector.join(
        ", "
      )}. Consider migrating to object-based selectors. See documentation for migration guide.`
    );
  }

  if (rulesWithLegacyTemplate.length > 0) {
    warnOnce(
      `[${ruleName}] Detected legacy template syntax \${...} in ${
        rulesWithLegacyTemplate.length
      } rule(s) at indices: ${rulesWithLegacyTemplate.join(
        ", "
      )}. Consider migrating to {{...}} syntax. See documentation for details.`
    );
  }

  if (rulesWithDeprecatedImportKind.length > 0) {
    warnOnce(
      `[${ruleName}] Detected deprecated rule-level "importKind" in ${
        rulesWithDeprecatedImportKind.length
      } rule(s) at indices: ${rulesWithDeprecatedImportKind.join(
        ", "
      )}. Use selector-level "kind" instead. When both are defined, selector-level "kind" takes precedence.`
    );
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
}

/**
 * Validates the checkConfig setting.
 * @param checkConfig The checkConfig setting value
 * @returns The validated checkConfig value or undefined
 */
function validateCheckConfig(
  /** The checkConfig setting value */
  checkConfig: unknown
): boolean | undefined {
  if (checkConfig === undefined) {
    return;
  }
  if (isBoolean(checkConfig)) {
    return checkConfig;
  }
  warnOnce(
    `Please provide a valid value in '${SETTINGS_KEYS_MAP.CHECK_CONFIG}' setting. The value should be a boolean.`
  );
}

function isValidDependencyNodeSelector(
  selector: unknown
): selector is DependencyNodeSelector {
  const isValidObject =
    isObject(selector) &&
    isString(selector.selector) &&
    (!selector.kind ||
      (isString(selector.kind) &&
        VALID_DEPENDENCY_NODE_KINDS.includes(
          selector.kind as DependencyKind
        ))) &&
    (!selector.name || isString(selector.name));
  if (!isValidObject) {
    warnOnce(
      `Please provide a valid object in ${ADDITIONAL_DEPENDENCY_NODES} setting. The object should be composed of the following properties: { selector: "<esquery selector>", kind: "value" | "type", name: "<string>" (optional) }. The invalid object will be ignored.`
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
    '{ selector: "<esquery selector>", kind: "value" | "type", name: "<string>" (optional) }.',
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

function validateFlagAsExternal(
  flagAsExternal: unknown
): FlagAsExternalOptions | undefined {
  if (!flagAsExternal) {
    return;
  }

  if (!isObject(flagAsExternal)) {
    warnOnce(
      `Please provide a valid value in '${SETTINGS_KEYS_MAP.FLAG_AS_EXTERNAL}' setting. The value should be an object.`
    );
    return;
  }

  const validated: FlagAsExternalOptions = {};

  if (flagAsExternal.unresolvableAlias !== undefined) {
    if (isBoolean(flagAsExternal.unresolvableAlias)) {
      validated.unresolvableAlias = flagAsExternal.unresolvableAlias;
    } else {
      warnOnce(
        `Please provide a valid boolean for 'unresolvableAlias' in '${SETTINGS_KEYS_MAP.FLAG_AS_EXTERNAL}' setting.`
      );
    }
  }

  if (flagAsExternal.inNodeModules !== undefined) {
    if (isBoolean(flagAsExternal.inNodeModules)) {
      validated.inNodeModules = flagAsExternal.inNodeModules;
    } else {
      warnOnce(
        `Please provide a valid boolean for 'inNodeModules' in '${SETTINGS_KEYS_MAP.FLAG_AS_EXTERNAL}' setting.`
      );
    }
  }

  if (flagAsExternal.outsideRootPath !== undefined) {
    if (isBoolean(flagAsExternal.outsideRootPath)) {
      validated.outsideRootPath = flagAsExternal.outsideRootPath;
    } else {
      warnOnce(
        `Please provide a valid boolean for 'outsideRootPath' in '${SETTINGS_KEYS_MAP.FLAG_AS_EXTERNAL}' setting.`
      );
    }
  }

  if (flagAsExternal.customSourcePatterns !== undefined) {
    if (
      isArray(flagAsExternal.customSourcePatterns) &&
      flagAsExternal.customSourcePatterns.every(isString)
    ) {
      validated.customSourcePatterns = flagAsExternal.customSourcePatterns;
    } else {
      warnOnce(
        `Please provide a valid array of strings for 'customSourcePatterns' in '${SETTINGS_KEYS_MAP.FLAG_AS_EXTERNAL}' setting.`
      );
    }
  }

  return validated;
}

function validateDebugFilterSelectors(
  value: unknown,
  filterName: "files" | "dependencies"
) {
  if (value === undefined) {
    return undefined;
  }
  if (isArray(value)) {
    return value;
  }
  warnOnce(
    `Please provide a valid array for '${filterName}' in '${SETTINGS_KEYS_MAP.DEBUG}' setting.`
  );
  return undefined;
}

function validateDebugFilesFilter(
  value: unknown
): ElementsSelector[] | undefined {
  return validateDebugFilterSelectors(value, "files") as
    | ElementsSelector[]
    | undefined;
}

function validateDebugDependenciesFilter(
  value: unknown
): DependencySelector[] | undefined {
  return validateDebugFilterSelectors(value, "dependencies") as
    | DependencySelector[]
    | undefined;
}

function validateDebug(debug: unknown): DebugSetting | undefined {
  if (!debug) {
    return;
  }

  if (!isObject(debug)) {
    warnOnce(
      `Please provide a valid value in '${SETTINGS_KEYS_MAP.DEBUG}' setting. The value should be an object.`
    );
    return;
  }

  const validated: DebugSetting = {};

  if (debug.enabled !== undefined) {
    if (isBoolean(debug.enabled)) {
      validated.enabled = debug.enabled;
    } else {
      warnOnce(
        `Please provide a valid boolean for 'enabled' in '${SETTINGS_KEYS_MAP.DEBUG}' setting.`
      );
    }
  }

  if (debug.filter !== undefined) {
    if (isObject(debug.filter)) {
      const files = validateDebugFilesFilter(debug.filter.files);
      const dependencies = validateDebugDependenciesFilter(
        debug.filter.dependencies
      );

      validated.filter = {
        ...(files !== undefined ? { files } : {}),
        ...(dependencies !== undefined ? { dependencies } : {}),
      };
    } else {
      warnOnce(
        `Please provide a valid object for 'filter' in '${SETTINGS_KEYS_MAP.DEBUG}' setting.`
      );
    }
  }

  return validated;
}

// TODO: Remove settings validation in next major version. It should be done by schema validation only
export function validateSettings(
  settings: Rule.RuleContext["settings"],
  rawSettings: object
): Settings {
  const checkConfig =
    validateCheckConfig(settings[SETTINGS_KEYS_MAP.CHECK_CONFIG]) ??
    CHECK_CONFIG_DEFAULT;

  // Only check for deprecated settings if checkConfig is enabled and we haven't already warned
  if (checkConfig && shouldWarnLegacySettings(rawSettings)) {
    deprecateTypes(settings[TYPES]);
    deprecateAlias(settings[ALIAS]);
  }

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
    [SETTINGS_KEYS_MAP.CHECK_CONFIG]: validateCheckConfig(
      settings[SETTINGS_KEYS_MAP.CHECK_CONFIG]
    ),
    [SETTINGS_KEYS_MAP.ADDITIONAL_DEPENDENCY_NODES]:
      validateAdditionalDependencyNodes(settings[ADDITIONAL_DEPENDENCY_NODES]),
    [SETTINGS_KEYS_MAP.CACHE]: settings[SETTINGS_KEYS_MAP.CACHE] as
      | boolean
      | undefined,
    [SETTINGS_KEYS_MAP.FLAG_AS_EXTERNAL]: validateFlagAsExternal(
      settings[SETTINGS_KEYS_MAP.FLAG_AS_EXTERNAL]
    ),
    [SETTINGS_KEYS_MAP.DEBUG]: validateDebug(settings[SETTINGS_KEYS_MAP.DEBUG]),
  };
}
/**
 * Returns the normalized settings from the ESLint rule context
 * @param context The ESLint rule context
 * @returns The normalized settings
 */
export function getSettings(context: Rule.RuleContext): SettingsNormalized {
  const validatedSettings = validateSettings(
    context.settings,
    context.settings
  );

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

  const result: SettingsNormalized = {
    elementDescriptors: validDescriptors,
    elementTypeNames: getElementsTypeNames(validDescriptors),
    ignorePaths,
    includePaths,
    rootPath: getRootPath(validatedSettings),
    dependencyNodes: [...dependencyNodes, ...additionalDependencyNodes],
    legacyTemplates:
      validatedSettings[SETTINGS_KEYS_MAP.LEGACY_TEMPLATES] ??
      LEGACY_TEMPLATES_DEFAULT,
    cache: validatedSettings[SETTINGS_KEYS_MAP.CACHE] ?? CACHE_DEFAULT,
    checkConfig:
      validatedSettings[SETTINGS_KEYS_MAP.CHECK_CONFIG] ?? CHECK_CONFIG_DEFAULT,
    flagAsExternal: {
      unresolvableAlias:
        validatedSettings[SETTINGS_KEYS_MAP.FLAG_AS_EXTERNAL]
          ?.unresolvableAlias ?? true,
      inNodeModules:
        validatedSettings[SETTINGS_KEYS_MAP.FLAG_AS_EXTERNAL]?.inNodeModules ??
        true,
      outsideRootPath:
        validatedSettings[SETTINGS_KEYS_MAP.FLAG_AS_EXTERNAL]
          ?.outsideRootPath ?? false,
      customSourcePatterns:
        validatedSettings[SETTINGS_KEYS_MAP.FLAG_AS_EXTERNAL]
          ?.customSourcePatterns ?? [],
    },
    debug: {
      enabled: validatedSettings[SETTINGS_KEYS_MAP.DEBUG]?.enabled ?? false,
      filter: {
        files: validatedSettings[SETTINGS_KEYS_MAP.DEBUG]?.filter?.files,
        dependencies:
          validatedSettings[SETTINGS_KEYS_MAP.DEBUG]?.filter?.dependencies,
      },
    },
  };
  return result;
}

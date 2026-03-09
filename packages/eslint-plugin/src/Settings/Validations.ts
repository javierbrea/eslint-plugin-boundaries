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
import { warnOnce } from "../Support/Debug";

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
  DEPENDENCY_NODE_KEYS_MAP,
} from "./Settings.types";
import type {
  DependencyNodeKey,
  DependencyNodeSelector,
  AliasSetting,
  DebugSetting,
  RuleOptionsRules,
  RuleOptionsWithRules,
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

type JsonSchemaPrimitive = string | number | boolean | null;
type JsonSchemaValue =
  | JsonSchemaPrimitive
  | JsonSchemaObject
  | JsonSchemaValue[];
type JsonSchemaObject = {
  [key: string]: JsonSchemaValue;
};

const trackedValidatedSettings = new WeakMap<
  Rule.RuleContext["settings"],
  SettingsNormalized
>();
const trackedWarnedOptions = new WeakSet<RuleOptionsWithRules>();

const defaultLegacyMatcherOptionsSchema = {
  type: "object",
};

/** Schema for validating a micromatch pattern or array of patterns that can also be null. */
const micromatchPatternNullableSchema = {
  oneOf: [
    { type: ["string", "null"] },
    { type: "array", items: { type: ["string", "null"] } },
  ],
};

const dependencyRelationshipSchema = {
  type: "object",
  properties: {
    from: micromatchPatternNullableSchema,
    to: micromatchPatternNullableSchema,
  },
  additionalProperties: false,
};

const dependencyMatcherItemSchema = {
  type: "object",
  properties: {
    relationship: dependencyRelationshipSchema,
    kind: micromatchPatternNullableSchema,
    specifiers: micromatchPatternNullableSchema,
    nodeKind: micromatchPatternNullableSchema,
    source: micromatchPatternNullableSchema,
    module: micromatchPatternNullableSchema,
  },
  additionalProperties: false,
};

const dependencyMatcherSchema = {
  oneOf: [
    dependencyMatcherItemSchema,
    {
      type: "array",
      items: dependencyMatcherItemSchema,
    },
  ],
};

const parentElementMatcherSchema = {
  type: "object",
  properties: {
    type: micromatchPatternNullableSchema,
    category: micromatchPatternNullableSchema,
    elementPath: micromatchPatternNullableSchema,
    captured: micromatchPatternNullableSchema,
  },
  additionalProperties: false,
};

const objectElementMatcherSchemaItem = {
  type: "object", // single object-based selector (new format)
  properties: {
    path: micromatchPatternNullableSchema,
    elementPath: micromatchPatternNullableSchema,
    internalPath: micromatchPatternNullableSchema,
    type: micromatchPatternNullableSchema,
    category: micromatchPatternNullableSchema,
    captured: {
      oneOf: [
        { type: ["object", "null"] },
        { type: "array", items: { type: ["object", "null"] } },
      ],
    },
    parent: {
      oneOf: [
        { type: "null" },
        parentElementMatcherSchema,
        { type: "array", items: parentElementMatcherSchema },
      ],
    },
    origin: micromatchPatternNullableSchema,
    isIgnored: { type: "boolean" },
    isUnknown: { type: "boolean" },
  },
  additionalProperties: false,
};

const objectElementMatcherSchema = {
  oneOf: [
    objectElementMatcherSchemaItem,
    {
      type: "array",
      items: objectElementMatcherSchemaItem,
    },
  ],
};

/**
 * Builds JSON schema for legacy policy selectors.
 *
 * @param matcherOptions - Extra matcher options accepted in legacy tuple syntax.
 * @returns JSON schema definition for legacy policy values.
 */
export function legacyPoliciesSchema(
  matcherOptions: JsonSchemaObject = defaultLegacyMatcherOptionsSchema
) {
  return {
    anyOf: [
      {
        type: "string", // single matcher (legacy)
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
                matcherOptions, // Extra options for legacy rules with custom syntax
              ],
            },
          ],
        },
      },
    ],
  };
}

const legacyElementsSelectorItemSchema = {
  anyOf: [
    {
      type: "string", // single matcher (legacy)
    },
    {
      type: "array", // matcher with captured values (legacy)
      items: [
        {
          type: "string", // matcher
        },
        defaultLegacyMatcherOptionsSchema, // Extra options for legacy rules with custom syntax
      ],
    },
  ],
};

const legacyElementsSelectorSchema = {
  anyOf: [
    legacyElementsSelectorItemSchema,
    {
      type: "array",
      items: legacyElementsSelectorItemSchema,
    },
  ],
};

/**
 * Builds JSON schema for rule options of dependency-based rules.
 *
 * @param options - Schema customization options for rule main key and extras.
 * @returns ESLint-compatible schema array for rule options.
 */
export function rulesOptionsSchema(
  options: {
    rulesMainKey?: RuleMainKey;
    targetMatcherOptions?: JsonSchemaObject;
    extraOptionsSchema?: Record<string, JsonSchemaObject>;
    isLegacy?: boolean;
  } = {
    isLegacy: false,
  }
) {
  const policySchema = !options.isLegacy
    ? {
        anyOf: [
          legacyPoliciesSchema(options.targetMatcherOptions),
          {
            type: "object",
            properties: {
              from: objectElementMatcherSchema,
              to: objectElementMatcherSchema,
              dependency: dependencyMatcherSchema,
            },
            additionalProperties: false,
          },
        ],
      }
    : legacyPoliciesSchema(options.targetMatcherOptions);

  const policiesSchema = {
    anyOf: [
      policySchema,
      {
        type: "array",
        items: policySchema,
      },
    ],
  };

  const elementSelectorSchema = {
    anyOf: [legacyElementsSelectorSchema, objectElementMatcherSchema],
  };

  const legacyMainKey = rulesMainKey(options.rulesMainKey);

  const ruleSupportedProperties = options.isLegacy
    ? {
        [legacyMainKey]: elementSelectorSchema,
        allow: policiesSchema,
        disallow: policiesSchema,
      }
    : {
        from: elementSelectorSchema,
        to: elementSelectorSchema,
        dependency: dependencyMatcherSchema,
        allow: policiesSchema,
        disallow: policiesSchema,
      };

  const requiredProperties = options.isLegacy
    ? [
        {
          required: [legacyMainKey, "allow"],
        },
        {
          required: [legacyMainKey, "disallow"],
        },
      ]
    : [
        {
          required: ["allow"],
        },
        {
          required: ["disallow"],
        },
        {
          required: ["from", "allow"],
        },
        {
          required: ["from", "disallow"],
        },
        {
          required: ["to", "allow"],
        },
        {
          required: ["to", "disallow"],
        },
        {
          required: ["dependency", "allow"],
        },
        {
          required: ["dependency", "disallow"],
        },
      ];

  const schema = [
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
              ...ruleSupportedProperties,
              importKind: {
                anyOf: [
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
            anyOf: requiredProperties,
          },
        },
        ...(options.extraOptionsSchema || {}),
      },
      additionalProperties: false,
    },
  ];

  return schema;
}

/**
 * Returns the selector configured under the active rule main key.
 *
 * @param rule - Single rule entry from options.
 * @param mainKey - Main selector key configured for current rule.
 * @returns Selector value from the corresponding property, when present.
 */
function getRuleMainSelector(rule: RuleOptionsRules, mainKey: RuleMainKey) {
  if (mainKey === "from") {
    return "from" in rule ? rule.from : undefined;
  }

  if (mainKey === "to") {
    return "to" in rule ? rule.to : undefined;
  }

  return "target" in rule ? rule.target : undefined;
}

/**
 * Warns once when deprecated selector/template syntax is detected in rules.
 *
 * @param options - Rule options containing `rules` entries.
 * @param mainKey - Main selector key used by the current rule.
 * @param ruleName - Rule name displayed in warning messages.
 */
export function validateAndWarnRuleOptions(
  options: RuleOptionsWithRules | undefined,
  mainKey: RuleMainKey = "from",
  ruleName = "boundaries/unknown"
): void {
  if (
    !options ||
    !options.rules ||
    !isArray(options.rules) ||
    trackedWarnedOptions.has(options)
  ) {
    return;
  }
  trackedWarnedOptions.add(options);

  // Collect ALL rules with legacy syntax
  const rulesWithLegacySelector: number[] = [];
  const rulesWithLegacyTemplate: number[] = [];
  const rulesWithDeprecatedImportKind: number[] = [];

  for (const [index, rule] of options.rules.entries()) {
    const ruleMainKey = rulesMainKey(mainKey);
    let hasLegacySelector = false;
    let hasLegacyTemplate = false;

    // Check all selector properties
    const selectorsToCheck = [
      getRuleMainSelector(rule, ruleMainKey),
      rule.allow,
      rule.disallow,
    ];

    for (const selector of selectorsToCheck) {
      if (selector) {
        if (detectLegacyElementSelector(selector)) {
          hasLegacySelector = true;
        }
        if (detectLegacyTemplateSyntax(selector)) {
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
      )}. Use selector-level "dependency.kind" instead. When both are defined, "dependency.kind" takes precedence.`
    );
  }
}

/**
 * Validates one element descriptor item from plugin settings.
 *
 * @param element - Candidate element descriptor from settings.
 * @returns `true` when descriptor is valid or accepted legacy string.
 */
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

/**
 * Validates and filters the configured list of element descriptors.
 *
 * @param elements - Raw `boundaries/elements` setting value.
 * @returns Valid descriptors or `undefined` when setting is invalid/missing.
 */
function validateElements(elements: unknown): ElementDescriptors | undefined {
  if (!elements || !isArray(elements) || !elements.length) {
    warnOnce(`Please provide element types using the '${ELEMENTS}' setting`);
    return;
  }
  return elements.filter(isValidElementAssigner);
}

/**
 * Validates configured dependency node keys.
 *
 * @param dependencyNodes - Raw dependency node keys from settings.
 * @returns Filtered valid keys or `undefined` for missing/invalid setting.
 */
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
 * Validates one custom dependency-node selector object.
 *
 * @param selector - Candidate additional dependency node selector.
 * @returns `true` when selector has a valid shape.
 */
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

/**
 * Validates the list of additional dependency node selectors.
 *
 * @param additionalDependencyNodes - Raw custom dependency nodes setting.
 * @returns Valid selectors or `undefined` when absent/invalid.
 */
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

/**
 * Type guard for alias setting object.
 *
 * @param value - Candidate alias setting value.
 * @returns `true` when value is an object whose values are strings.
 */
function isAliasSetting(value: unknown): value is AliasSetting {
  return isObject(value) && Object.values(value).every(isString);
}

/**
 * Type guard for element descriptors array including legacy entries.
 *
 * @param value - Candidate `types` or `elements` setting value.
 * @returns `true` when all entries are valid descriptors or legacy strings.
 */
function isElementDescriptors(value: unknown): value is ElementDescriptors {
  return (
    isArray(value) &&
    value.every(
      (element) => isLegacyType(element) || isElementDescriptor(element)
    )
  );
}

/**
 * Emits deprecation warning for legacy `alias` setting.
 *
 * @param aliases - Alias setting value when present.
 */
function deprecateAlias(aliases: AliasSetting | undefined) {
  if (aliases) {
    warnOnce(
      `Defining aliases in '${ALIAS}' setting is deprecated. Please use 'import/resolver' setting`
    );
  }
}

/**
 * Emits deprecation warning for legacy `types` setting.
 *
 * @param types - Legacy types setting value when present.
 */
function deprecateTypes(types: ElementDescriptors | undefined) {
  if (types) {
    warnOnce(
      `'${TYPES}' setting is deprecated. Please use '${ELEMENTS}' instead`
    );
  }
}

/**
 * Validates `ignore` setting values.
 *
 * @param ignore - Raw ignore setting.
 * @returns String or string array when valid.
 */
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

/**
 * Validates `include` setting values.
 *
 * @param include - Raw include setting.
 * @returns String or string array when valid.
 */
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

/**
 * Validates `root-path` setting values.
 *
 * @param rootPath - Raw root-path setting.
 * @returns Root path string when valid.
 */
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

/**
 * Validates `flag-as-external` setting object and fields.
 *
 * @param flagAsExternal - Raw flag-as-external setting value.
 * @returns Normalized options object with valid fields only.
 */
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

/**
 * Validates debug filter selectors for files or dependencies.
 *
 * @param value - Raw filter value.
 * @param filterName - Filter key used in warning messages.
 * @returns Filter array when valid, otherwise `undefined`.
 */
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

/**
 * Validates debug `files` filter selector list.
 *
 * @param value - Raw `debug.filter.files` setting value.
 * @returns Valid files filter selectors.
 */
function validateDebugFilesFilter(
  value: unknown
): ElementsSelector[] | undefined {
  return validateDebugFilterSelectors(value, "files") as
    | ElementsSelector[]
    | undefined;
}

/**
 * Validates debug `dependencies` filter selector list.
 *
 * @param value - Raw `debug.filter.dependencies` setting value.
 * @returns Valid dependency filter selectors.
 */
function validateDebugDependenciesFilter(
  value: unknown
): DependencySelector[] | undefined {
  return validateDebugFilterSelectors(value, "dependencies") as
    | DependencySelector[]
    | undefined;
}

/**
 * Validates the `debug` setting object and nested filters.
 *
 * @param debug - Raw debug setting value.
 * @returns Normalized debug setting when valid.
 */
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

/**
 * Validates plugin settings and returns a sanitized settings object.
 *
 * @param settings - Raw ESLint context settings.
 * @returns Validated settings ready for normalization.
 */
export function validateSettings(
  settings: Rule.RuleContext["settings"]
): Settings {
  deprecateTypes(
    isElementDescriptors(settings[TYPES]) ? settings[TYPES] : undefined
  );
  deprecateAlias(isAliasSetting(settings[ALIAS]) ? settings[ALIAS] : undefined);

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
  const alreadyValidatedSettings = trackedValidatedSettings.get(
    context.settings
  );
  if (alreadyValidatedSettings) {
    return alreadyValidatedSettings;
  }
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
  trackedValidatedSettings.set(context.settings, result);
  return result;
}

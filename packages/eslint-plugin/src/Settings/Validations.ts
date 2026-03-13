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

import { warnOnce } from "../Debug";
import {
  isArray,
  isString,
  isObject,
  isBoolean,
  getArrayOrNull,
  isUndefined,
} from "../Shared";
import {
  SETTINGS,
  SETTINGS_KEYS_MAP,
  LEGACY_TEMPLATES_DEFAULT,
  CACHE_DEFAULT,
  DEPENDENCY_NODE_KEYS_MAP,
} from "../Shared/Settings.types";
import type {
  DependencyNodeKey,
  DependencyNodeSelector,
  AliasSetting,
  RuleOptionsRules,
  RuleOptionsWithRules,
  Settings,
  IgnoreSetting,
  IncludeSetting,
  RuleMainKey,
  SettingsNormalized,
  DebugSettingNormalized,
  RuleName,
} from "../Shared/Settings.types";

import {
  isDependencyNodeKey,
  isLegacyType,
  rulesMainKey,
  detectLegacyElementSelector,
  detectLegacyTemplateSyntax,
  migrationToV6GuideLink,
  migrationToV2GuideLink,
  moreInfoSettingsLink,
} from "./Helpers";
import {
  getElementsTypeNames,
  getRootPath,
  transformLegacyTypes,
} from "./Settings";

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

const capturedValuesSelectorSchema = {
  type: "object",
  additionalProperties: micromatchPatternNullableSchema,
};

const capturedValuesSchema = {
  oneOf: [
    {
      type: "null",
    },
    capturedValuesSelectorSchema,
    {
      type: "array",
      items: capturedValuesSelectorSchema,
    },
  ],
};

const parentElementMatcherSchema = {
  type: "object",
  properties: {
    type: micromatchPatternNullableSchema,
    category: micromatchPatternNullableSchema,
    elementPath: micromatchPatternNullableSchema,
    captured: capturedValuesSchema,
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
    captured: capturedValuesSchema,
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
        type: "array", // matcher with captured values (legacy)
        items: [
          {
            type: "string", // matcher
          },
          matcherOptions, // Extra options for legacy rules with custom syntax
        ],
      },
      {
        type: "array", // multiple matchers
        items: {
          anyOf: [
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
  ruleName: RuleName
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

    if (!isUndefined(rule.importKind)) {
      rulesWithDeprecatedImportKind.push(index);
    }
  }

  // Show warnings if needed
  if (rulesWithLegacySelector.length > 0) {
    warnOnce(
      `[${ruleName}] Detected legacy selector syntax in ${
        rulesWithLegacySelector.length
      } rule(s) at indices: ${rulesWithLegacySelector.join(", ")}.`,
      `Consider migrating to object-based selectors. ${migrationToV6GuideLink()}`
    );
  }

  if (rulesWithLegacyTemplate.length > 0) {
    warnOnce(
      `[${ruleName}] Detected legacy template syntax \${...} in ${
        rulesWithLegacyTemplate.length
      } rule(s) at indices: ${rulesWithLegacyTemplate.join(", ")}.`,
      `Consider migrating to {{...}} syntax. ${migrationToV6GuideLink("new-template-syntax")}`
    );
  }

  if (rulesWithDeprecatedImportKind.length > 0) {
    warnOnce(
      `[${ruleName}] Detected deprecated rule-level "importKind" in ${
        rulesWithDeprecatedImportKind.length
      } rule(s) at indices: ${rulesWithDeprecatedImportKind.join(", ")}.`,
      `Use selector-level "dependency.kind" instead. When both are defined, "dependency.kind" takes precedence. ${migrationToV6GuideLink("rule-level-importkind-is-deprecated")}`
    );
  }
}

/**
 * Validates one element descriptor item from plugin settings.
 *
 * @param element - Candidate element descriptor from settings.
 * @returns `true` when descriptor is valid or accepted legacy string.
 */
export function isValidElementDescriptor(
  element: unknown
): element is ElementDescriptor {
  if (!element) {
    warnOnce(
      `Invalid element descriptor in '${ELEMENTS}' setting.`,
      moreInfoSettingsLink()
    );
    return false;
  }
  if (isLegacyType(element)) {
    warnOnce(
      `Defining elements as strings in settings is deprecated.`,
      `It will be automatically converted, but this feature will be removed in next major versions. ${migrationToV6GuideLink()}`
    );
    return true;
  } else {
    const isObjectElement = isObject(element);
    if (!isObjectElement) {
      warnOnce(
        `Invalid element descriptor in '${ELEMENTS}' setting.`,
        moreInfoSettingsLink()
      );
      return false;
    }
    if (!element.type && !element.category) {
      warnOnce(
        `Missing "type" or "category" property in an element descriptor in '${ELEMENTS}' setting.`,
        moreInfoSettingsLink()
      );
      return false;
    }
    if (element.type && !isString(element.type)) {
      warnOnce(
        `Invalid "type" property in an element descriptor in '${ELEMENTS}' setting.`,
        moreInfoSettingsLink()
      );
      return false;
    }
    if (element.category && !isString(element.category)) {
      warnOnce(
        `Invalid "category" property in an element descriptor in '${ELEMENTS}' setting.`,
        moreInfoSettingsLink()
      );
      return false;
    }
    if (
      element.mode &&
      isString(element.mode) &&
      !VALID_MODES.includes(element.mode as ElementDescriptorMode)
    ) {
      warnOnce(
        `Invalid "mode" property in an element descriptor in '${ELEMENTS}' setting.`,
        `It should be one of ${VALID_MODES.join(", ")}. ${moreInfoSettingsLink()}`
      );
      return false;
    }
    if (
      !element.pattern ||
      !(isString(element.pattern) || isArray(element.pattern))
    ) {
      warnOnce(
        `Invalid "pattern" property in an element descriptor in '${ELEMENTS}' setting.`,
        moreInfoSettingsLink()
      );
      return false;
    }
    if (element.capture && !isArray(element.capture)) {
      warnOnce(
        `Invalid "capture" property in an element descriptor in '${ELEMENTS}' setting.`,
        `Capture should be an array of strings. ${moreInfoSettingsLink()}`
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
function validateElementDescriptors(
  elements: unknown
): ElementDescriptors | undefined {
  if (!elements || !isArray(elements) || !elements.length) {
    warnOnce(
      `Please provide element descriptors using the '${ELEMENTS}' setting.`,
      moreInfoSettingsLink()
    );
    return;
  }
  return elements.filter(isValidElementDescriptor);
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
  const invalidFormatTitle = `Invalid ${DEPENDENCY_NODES} setting format.`;
  const invalidNodeMessage = `It should be an array of the following strings: "${defaultNodesNames.join('", "')}". ${moreInfoSettingsLink()}`;

  if (!isArray(dependencyNodes)) {
    warnOnce(invalidFormatTitle, invalidNodeMessage);
    return;
  }

  for (const dependencyNode of dependencyNodes) {
    if (!isDependencyNodeKey(dependencyNode)) {
      warnOnce(invalidFormatTitle, invalidNodeMessage);
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
  if (isUndefined(legacyTemplates)) {
    return;
  }
  if (isBoolean(legacyTemplates)) {
    return legacyTemplates;
  }
  warnOnce(
    `Please provide a valid value in '${SETTINGS_KEYS_MAP.LEGACY_TEMPLATES}' setting.`,
    `The value should be a boolean. ${moreInfoSettingsLink()}`
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
      `Please provide a valid object in ${ADDITIONAL_DEPENDENCY_NODES} setting.`,
      `The object should be composed of the following properties: { selector: "<esquery selector>", kind: "value" | "type", name: "<string>" (optional) }. The invalid object will be ignored. ${moreInfoSettingsLink()}`
    );
  } else if (isObject(selector) && !selector.name) {
    warnOnce(
      `Consider adding a "name" property to your custom dependency node for using it in selectors and custom messages.`,
      moreInfoSettingsLink()
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

  const invalidFormatTitle = `Invalid ${ADDITIONAL_DEPENDENCY_NODES} setting format.`;
  const invalidNodeMessage = `It should be an array containing objects with the following properties: { selector: "<esquery selector>", kind: "value" | "type", name: "<string>" (optional) }. ${moreInfoSettingsLink()}`;

  if (!isArray(additionalDependencyNodes)) {
    warnOnce(invalidFormatTitle, invalidNodeMessage);
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
 * Emits deprecation warning for legacy `alias` setting.
 *
 * @param aliases - Alias setting value when present.
 */
function deprecateAlias(aliases: AliasSetting | undefined) {
  if (aliases) {
    warnOnce(
      `Defining aliases in '${ALIAS}' setting is deprecated.`,
      `Please use 'import/resolver' setting. ${moreInfoSettingsLink()}`
    );
  }
}

/**
 * Emits deprecation warning for legacy `types` setting.
 *
 * @param types - Legacy types setting value when present.
 */
function deprecateTypes(types: unknown) {
  if (types) {
    warnOnce(
      `'${TYPES}' setting is deprecated.`,
      `Please use '${ELEMENTS}' instead. ${migrationToV2GuideLink()}`
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
    `Please provide a valid value in '${SETTINGS_KEYS_MAP.IGNORE}' setting.`,
    `The value should be a string or an array of strings. ${moreInfoSettingsLink()}`
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
    `Please provide a valid value in '${SETTINGS_KEYS_MAP.INCLUDE}' setting.`,
    `The value should be a string or an array of strings. ${moreInfoSettingsLink()}`
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
    `Please provide a valid value in '${SETTINGS_KEYS_MAP.ROOT_PATH}' setting.`,
    `The value should be a string. ${moreInfoSettingsLink()}`
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
      `Please provide a valid value in '${SETTINGS_KEYS_MAP.FLAG_AS_EXTERNAL}' setting.`,
      `The value should be an object. ${moreInfoSettingsLink()}`
    );
    return;
  }

  const validated: FlagAsExternalOptions = {};

  if (!isUndefined(flagAsExternal.unresolvableAlias)) {
    if (isBoolean(flagAsExternal.unresolvableAlias)) {
      validated.unresolvableAlias = flagAsExternal.unresolvableAlias;
    } else {
      warnOnce(
        `Please provide a valid boolean for 'unresolvableAlias' in '${SETTINGS_KEYS_MAP.FLAG_AS_EXTERNAL}' setting.`,
        moreInfoSettingsLink()
      );
    }
  }

  if (!isUndefined(flagAsExternal.inNodeModules)) {
    if (isBoolean(flagAsExternal.inNodeModules)) {
      validated.inNodeModules = flagAsExternal.inNodeModules;
    } else {
      warnOnce(
        `Please provide a valid boolean for 'inNodeModules' in '${SETTINGS_KEYS_MAP.FLAG_AS_EXTERNAL}' setting.`,
        moreInfoSettingsLink()
      );
    }
  }

  if (!isUndefined(flagAsExternal.outsideRootPath)) {
    if (isBoolean(flagAsExternal.outsideRootPath)) {
      validated.outsideRootPath = flagAsExternal.outsideRootPath;
    } else {
      warnOnce(
        `Please provide a valid boolean for 'outsideRootPath' in '${SETTINGS_KEYS_MAP.FLAG_AS_EXTERNAL}' setting.`,
        moreInfoSettingsLink()
      );
    }
  }

  if (!isUndefined(flagAsExternal.customSourcePatterns)) {
    if (
      isArray(flagAsExternal.customSourcePatterns) &&
      flagAsExternal.customSourcePatterns.every(isString)
    ) {
      validated.customSourcePatterns = flagAsExternal.customSourcePatterns;
    } else {
      warnOnce(
        `Please provide a valid array of strings for 'customSourcePatterns' in '${SETTINGS_KEYS_MAP.FLAG_AS_EXTERNAL}' setting.`,
        moreInfoSettingsLink()
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
  if (isUndefined(value)) {
    return undefined;
  }
  if (isArray(value)) {
    return value;
  }
  warnOnce(
    `Please provide a valid array for '${filterName}' in '${SETTINGS_KEYS_MAP.DEBUG}' setting.`,
    moreInfoSettingsLink()
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
function validateDebug(debug: unknown): DebugSettingNormalized {
  const validated: DebugSettingNormalized = {
    enabled: false,
    filter: {
      files: undefined,
      dependencies: undefined,
    },
    messages: {
      files: true,
      dependencies: true,
      violations: true,
    },
  };

  if (!debug) {
    return validated;
  }

  if (!isObject(debug)) {
    warnOnce(
      `Please provide a valid value in '${SETTINGS_KEYS_MAP.DEBUG}' setting.`,
      `The value should be an object. ${moreInfoSettingsLink()}`
    );
    return validated;
  }

  if (!isUndefined(debug.enabled)) {
    if (isBoolean(debug.enabled)) {
      validated.enabled = debug.enabled;
    } else {
      warnOnce(
        `Please provide a valid boolean for 'enabled' in '${SETTINGS_KEYS_MAP.DEBUG}' setting.`,
        moreInfoSettingsLink()
      );
    }
  }

  if (!isUndefined(debug.messages)) {
    if (!isObject(debug.messages)) {
      warnOnce(
        `Please provide a valid object for 'messages' in '${SETTINGS_KEYS_MAP.DEBUG}' setting.`,
        moreInfoSettingsLink()
      );
    } else {
      if (!isUndefined(debug.messages.files)) {
        if (isBoolean(debug.messages.files)) {
          validated.messages.files = debug.messages.files;
        } else {
          warnOnce(
            `Please provide a valid boolean for 'messages.files' in '${SETTINGS_KEYS_MAP.DEBUG}' setting.`,
            moreInfoSettingsLink()
          );
        }
      }
      if (!isUndefined(debug.messages.dependencies)) {
        if (isBoolean(debug.messages.dependencies)) {
          validated.messages.dependencies = debug.messages.dependencies;
        } else {
          warnOnce(
            `Please provide a valid boolean for 'messages.dependencies' in '${SETTINGS_KEYS_MAP.DEBUG}' setting.`,
            moreInfoSettingsLink()
          );
        }
      }
      if (!isUndefined(debug.messages.violations)) {
        if (isBoolean(debug.messages.violations)) {
          validated.messages.violations = debug.messages.violations;
        } else {
          warnOnce(
            `Please provide a valid boolean for 'messages.violations' in '${SETTINGS_KEYS_MAP.DEBUG}' setting.`,
            moreInfoSettingsLink()
          );
        }
      }
    }
  }

  if (!isUndefined(debug.filter)) {
    if (isObject(debug.filter)) {
      const files = validateDebugFilesFilter(debug.filter.files);
      const dependencies = validateDebugDependenciesFilter(
        debug.filter.dependencies
      );

      validated.filter = {
        ...(!isUndefined(files) ? { files } : {}),
        ...(!isUndefined(dependencies) ? { dependencies } : {}),
      };
    } else {
      warnOnce(
        `Please provide a valid object for 'filter' in '${SETTINGS_KEYS_MAP.DEBUG}' setting.`,
        moreInfoSettingsLink()
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
  deprecateTypes(settings[TYPES]);
  deprecateAlias(isAliasSetting(settings[ALIAS]) ? settings[ALIAS] : undefined);

  return {
    [SETTINGS_KEYS_MAP.ELEMENTS]: validateElementDescriptors(
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
  const dependencyNodes: DependencyNodeSelector[] = (
    dependencyNodesSetting || [
      DEPENDENCY_NODE_KEYS_MAP.IMPORT,
      DEPENDENCY_NODE_KEYS_MAP.EXPORT,
      DEPENDENCY_NODE_KEYS_MAP.REQUIRE,
      DEPENDENCY_NODE_KEYS_MAP.DYNAMIC_IMPORT,
    ]
  )
    .flatMap((dependencyNode) => [...DEFAULT_DEPENDENCY_NODES[dependencyNode]])
    .filter(Boolean);

  const additionalDependencyNodes = additionalDependencyNodesSetting || [];

  const ignoreSetting = validatedSettings[SETTINGS_KEYS_MAP.IGNORE];
  const ignorePaths = isString(ignoreSetting) ? [ignoreSetting] : ignoreSetting;

  const includeSetting = validatedSettings[SETTINGS_KEYS_MAP.INCLUDE];
  const includePaths = isString(includeSetting)
    ? [includeSetting]
    : includeSetting;

  const descriptors = transformLegacyTypes(validatedSettings[ELEMENTS]);
  const validDescriptors = descriptors.filter(isElementDescriptor);

  if (validDescriptors.length < descriptors.length) {
    const invalidDescriptors = descriptors.filter(
      (desc) => !isElementDescriptor(desc)
    );
    warnOnce(
      `Some element descriptors are invalid and will be ignored.`,
      `Invalid descriptors:\n${JSON.stringify(invalidDescriptors)}.\n${moreInfoSettingsLink()}`
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
      messages: {
        files:
          validatedSettings[SETTINGS_KEYS_MAP.DEBUG]?.messages?.files ?? true,
        dependencies:
          validatedSettings[SETTINGS_KEYS_MAP.DEBUG]?.messages?.dependencies ??
          true,
        violations:
          validatedSettings[SETTINGS_KEYS_MAP.DEBUG]?.messages?.violations ??
          true,
      },
    },
  };
  trackedValidatedSettings.set(context.settings, result);
  return result;
}

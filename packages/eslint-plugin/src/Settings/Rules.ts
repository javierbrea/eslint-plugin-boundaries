import type { MicromatchPatternNullable } from "@boundaries/elements";

import { warnOnce } from "../Debug";
import {
  isArray,
  isBoolean,
  isUndefined,
  isString,
  isNull,
  isObject,
} from "../Shared";
import {
  SETTINGS_KEYS_MAP,
  FROM,
  RULE_POLICY_ALLOW,
  RULE_POLICY_DISALLOW,
  RULE_NAMES,
  RULE_SHORT_NAMES,
  RULE_NAMES_MAP,
} from "../Shared/Settings.types";
import type {
  RuleOptionsRules,
  RuleOptionsWithRules,
  RuleMainKey,
  RuleShortName,
  RulePolicy,
  RuleName,
} from "../Shared/Settings.types";

import {
  getRuleDocsPath,
  migrationToV6GuideLink,
  moreInfoSettingsLink,
  moreInfoLink,
} from "./Docs";

type JsonSchemaPrimitive = string | number | boolean | null;
type JsonSchemaValue =
  | JsonSchemaPrimitive
  | JsonSchemaObject
  | JsonSchemaValue[];
type JsonSchemaObject = {
  [key: string]: JsonSchemaValue;
};

const trackedWarnedRuleOptions = new WeakSet<RuleOptionsWithRules>();

const defaultExtraOptionsSchema = {
  type: "object",
};

/** Schema for validating a micromatch pattern or array of patterns that can also be null. */
const micromatchPatternNullableSchema = {
  oneOf: [
    { type: ["string", "null"] },
    { type: "array", items: { type: ["string", "null"] } },
  ],
};

const dependencyRelationshipSelectorSchema = {
  type: "object",
  properties: {
    from: micromatchPatternNullableSchema,
    to: micromatchPatternNullableSchema,
  },
  additionalProperties: false,
};

const dependencyInfoSingleSelectorSchema = {
  type: "object",
  properties: {
    relationship: dependencyRelationshipSelectorSchema,
    kind: micromatchPatternNullableSchema,
    specifiers: micromatchPatternNullableSchema,
    nodeKind: micromatchPatternNullableSchema,
    source: micromatchPatternNullableSchema,
    module: micromatchPatternNullableSchema,
  },
  additionalProperties: false,
};

const dependencyInfoSelectorSchema = {
  oneOf: [
    dependencyInfoSingleSelectorSchema,
    {
      type: "array",
      items: dependencyInfoSingleSelectorSchema,
    },
  ],
};

const capturedValuesSingleSelectorSchema = {
  type: "object",
  additionalProperties: micromatchPatternNullableSchema,
};

const capturedValuesSelectorSchema = {
  oneOf: [
    {
      type: "null",
    },
    capturedValuesSingleSelectorSchema,
    {
      type: "array",
      items: capturedValuesSingleSelectorSchema,
    },
  ],
};

const parentElementSingleSelectorSchema = {
  type: "object",
  properties: {
    type: micromatchPatternNullableSchema,
    category: micromatchPatternNullableSchema,
    path: micromatchPatternNullableSchema,
    elementPath: micromatchPatternNullableSchema,
    captured: capturedValuesSelectorSchema,
  },
  additionalProperties: false,
};

const parentElementSelectorSchema = {
  oneOf: [
    { type: "null" },
    parentElementSingleSelectorSchema,
    { type: "array", items: parentElementSingleSelectorSchema },
  ],
};

const elementSingleSelectorSchema = {
  type: "object",
  properties: {
    path: micromatchPatternNullableSchema,
    elementPath: micromatchPatternNullableSchema,
    internalPath: micromatchPatternNullableSchema,
    elementInternalPath: micromatchPatternNullableSchema,
    fileInternalPath: micromatchPatternNullableSchema,
    type: micromatchPatternNullableSchema,
    category: micromatchPatternNullableSchema,
    captured: capturedValuesSelectorSchema,
    parent: parentElementSelectorSchema,
    origin: micromatchPatternNullableSchema,
    isIgnored: { type: "boolean" },
    isUnknown: { type: "boolean" },
  },
  additionalProperties: false,
};

const elementSelectorSchema = {
  oneOf: [
    elementSingleSelectorSchema,
    {
      type: "array",
      items: elementSingleSelectorSchema,
    },
  ],
};

const fileSingleSelectorSchema = {
  type: "object",
  properties: {
    path: micromatchPatternNullableSchema,
    captured: capturedValuesSelectorSchema,
    categories: micromatchPatternNullableSchema,
    isIgnored: { type: "boolean" },
    isUnknown: { type: "boolean" },
  },
  additionalProperties: false,
};

const fileSelectorSchema = {
  oneOf: [
    fileSingleSelectorSchema,
    {
      type: "array",
      items: fileSingleSelectorSchema,
    },
  ],
};

const legacyElementSingleSelectorSchema = {
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
        defaultExtraOptionsSchema, // Extra options for legacy rules with custom syntax
      ],
    },
  ],
};

const legacyElementSelectorSchema = {
  anyOf: [
    legacyElementSingleSelectorSchema,
    {
      type: "array",
      items: legacyElementSingleSelectorSchema,
    },
  ],
};

const originSingleSelectorSchema = {
  type: "object",
  properties: {
    module: micromatchPatternNullableSchema,
    kind: micromatchPatternNullableSchema,
  },
  additionalProperties: false,
};

const originSelectorSchema = {
  oneOf: [
    originSingleSelectorSchema,
    {
      type: "array",
      items: originSingleSelectorSchema,
    },
  ],
};

const entitySingleSelectorSchema = {
  type: "object",
  properties: {
    element: elementSelectorSchema,
    file: fileSelectorSchema,
    origin: originSelectorSchema,
  },
  additionalProperties: false,
};

const entitySelectorSchema = {
  oneOf: [
    entitySingleSelectorSchema,
    {
      type: "array",
      items: entitySingleSelectorSchema,
    },
  ],
};

const backwardCompatibleEntitySingleSelectorSchema = {
  anyOf: [
    entitySingleSelectorSchema,
    elementSingleSelectorSchema, // Backward compatibility
    legacyElementSelectorSchema,
  ],
};

const backwardCompatibleEntitySelectorSchema = {
  anyOf: [
    entitySelectorSchema,
    backwardCompatibleEntitySingleSelectorSchema,
    {
      type: "array",
      items: backwardCompatibleEntitySingleSelectorSchema,
    },
  ],
};

const dependencySelectorSchema = {
  type: "object",
  properties: {
    from: backwardCompatibleEntitySelectorSchema,
    to: backwardCompatibleEntitySelectorSchema,
    dependency: dependencyInfoSelectorSchema,
  },
  additionalProperties: false,
};

/**
 * Builds JSON schema for legacy policy selectors.
 *
 * @param matcherOptions - Extra matcher options accepted in legacy tuple syntax.
 * @returns JSON schema definition for legacy policy values.
 */
export function legacyPoliciesSchema(
  matcherOptions: JsonSchemaObject = defaultExtraOptionsSchema
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

/**
 * Builds JSON schema for rule options of dependency-based rules.
 *
 * @param options - Schema customization options for rule main key and extras.
 * @returns ESLint-compatible schema array for rule options.
 */
export function rulesOptionsSchema({
  rulesMainKey: mainKey,
  targetMatcherOptions,
  extraOptionsSchema,
  isLegacy = false,
}: {
  rulesMainKey?: RuleMainKey;
  targetMatcherOptions?: JsonSchemaObject;
  extraOptionsSchema?: Record<string, JsonSchemaObject>;
  isLegacy?: boolean;
} = {}) {
  const policiesSchema = isLegacy
    ? legacyPoliciesSchema(targetMatcherOptions)
    : {
        anyOf: [
          dependencySelectorSchema,
          backwardCompatibleEntitySelectorSchema,
        ],
      };

  const legacyMainKey = rulesMainKey(mainKey);

  const ruleSupportedProperties = isLegacy
    ? {
        [legacyMainKey]: backwardCompatibleEntitySelectorSchema,
        allow: policiesSchema,
        disallow: policiesSchema,
      }
    : {
        from: backwardCompatibleEntitySelectorSchema,
        to: backwardCompatibleEntitySelectorSchema,
        dependency: dependencyInfoSelectorSchema,
        allow: policiesSchema,
        disallow: policiesSchema,
      };

  const requiredProperties = isLegacy
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
        ...extraOptionsSchema,
      },
      additionalProperties: false,
    },
  ];

  return schema;
}

/**
 * Type guard to check if a value is a valid RulePolicy.
 * @param value - The value to check.
 * @returns True if the value is a valid RulePolicy, false otherwise.
 */
export function isRulePolicy(value: unknown): value is RulePolicy {
  return (
    isString(value) &&
    (value === RULE_POLICY_ALLOW || value === RULE_POLICY_DISALLOW)
  );
}

/**
 * Type guard to check if a value is a valid rule name including the default plugin prefix.
 * @param value - The value to check.
 * @returns True if the value is a valid rule name with the default plugin prefix, false otherwise.
 */
export function isRuleName(value: unknown): value is RuleName {
  return RULE_NAMES.includes(value as RuleName);
}

/**
 * Type guard to check if a value is a valid rule short name.
 * @param value - The value to check.
 * @returns True if the value is a valid rule short name, false otherwise.
 */
export function isRuleShortName(value: unknown): value is RuleShortName {
  return RULE_SHORT_NAMES.includes(value as RuleShortName);
}

/**
 * Checks if a string contains legacy template syntax ${...}.
 * @param value - The value to check.
 * @returns True if the value contains legacy template syntax, false otherwise.
 */
function hasLegacyTemplateSyntax(value: string): boolean {
  return value.includes("${");
}

// TODO: Check for legacy template syntax
/**
 * Recursively checks if a selector contains legacy template syntax.
 * @param value - The value to check (can be string, object, array, etc.).
 * @returns True if legacy template syntax was detected, false otherwise.
 */
function checkForLegacyTemplateSyntax(
  micromatchPattern:
    | MicromatchPatternNullable
    | Record<string, MicromatchPatternNullable>
): boolean {
  if (isString(micromatchPattern)) {
    return hasLegacyTemplateSyntax(micromatchPattern);
  }

  if (isArray(micromatchPattern)) {
    return micromatchPattern.some(checkForLegacyTemplateSyntax);
  }

  if (isNull(micromatchPattern) || !isObject(micromatchPattern)) {
    return false;
  }

  return Object.values(micromatchPattern).some(checkForLegacyTemplateSyntax);
}

/**
 * Detects if legacy template syntax is used in selectors.
 * @param selector - The selector to check (can be a single selector or an array of selectors).
 * @returns True if legacy template syntax was detected, false otherwise.
 */
export function detectLegacyTemplateSyntax(
  micromatchPattern:
    | MicromatchPatternNullable
    | Record<string, MicromatchPatternNullable>
): boolean {
  return checkForLegacyTemplateSyntax(micromatchPattern);
}

/**
 * Returns the canonical main selector key used by schema and option checks.
 *
 * @param key - Optional rule main key (`from`, `to`, or `target`).
 * @returns The same key with default fallback to `from`.
 */
export function rulesMainKey(key: RuleMainKey = FROM) {
  return key;
}

type RuleWarningIndexes = {
  rulesWithLegacySelector: number[];
  rulesWithLegacyTemplate: number[];
  rulesWithDeprecatedImportKind: number[];
};

/**
 * Collects indices of rules using deprecated selector/template/importKind syntax.
 *
 * @param rules - Rule list to inspect.
 * @returns Rule indices grouped by deprecated syntax type.
 */
function collectRuleWarningIndexes(
  rules: RuleOptionsRules[]
): RuleWarningIndexes {
  const indexes: RuleWarningIndexes = {
    rulesWithLegacySelector: [],
    rulesWithLegacyTemplate: [],
    rulesWithDeprecatedImportKind: [],
  };

  for (const [index, rule] of rules.entries()) {
    // TODO: Detect legacy template syntax in selectors

    if (!isUndefined(rule.importKind)) {
      indexes.rulesWithDeprecatedImportKind.push(index);
    }
  }

  return indexes;
}

/**
 * Warns once when deprecated selector/template syntax is detected in rules.
 *
 * @param options - Rule options containing `rules` entries.
 * @param ruleName - Rule name displayed in warning messages.
 */
export function validateAndWarnRuleOptions(
  options: RuleOptionsWithRules | undefined,
  ruleName: RuleName
): void {
  if (!options || trackedWarnedRuleOptions.has(options)) {
    return;
  }

  if (!options.rules || !isArray(options.rules)) {
    return;
  }

  trackedWarnedRuleOptions.add(options);

  const {
    rulesWithLegacySelector,
    rulesWithLegacyTemplate,
    rulesWithDeprecatedImportKind,
  } = collectRuleWarningIndexes(options.rules);

  // TODO: How to detect this? Remove it?
  if (rulesWithLegacySelector.length > 0) {
    warnOnce(
      `[${ruleName}] Detected legacy selector syntax in ${
        rulesWithLegacySelector.length
      } rule(s) at indices: ${rulesWithLegacySelector.join(", ")}.`,
      `Consider migrating to object-based selectors. ${migrationToV6GuideLink()}`
    );
  }

  // TODO: How to detect this? Remove it?
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
 * Validates the legacyTemplates setting.
 *
 * @param legacyTemplates - Raw legacyTemplates setting value.
 * @returns Validated boolean value or `undefined` when missing/invalid.
 */
export function validateLegacyTemplates(
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
 * Warns about the deprecation of a rule and encourages migration to the "dependencies" rule.
 * @param ruleName The name of the deprecated rule.
 */
export function warnMigrationToDependencies(ruleName: RuleName) {
  warnOnce(
    `Rule "${ruleName}" is deprecated and will be removed in future versions.`,
    `Please migrate to the "${RULE_NAMES_MAP.DEPENDENCIES}" rule with appropriate selectors. ${moreInfoLink(
      getRuleDocsPath(ruleName),
      // cspell: disable-next-line
      "migration-to-boundariesdependencies"
    )}`
  );
}

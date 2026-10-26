import {
  FROM,
  NO_UNKNOWN_DEPENDENCIES_REQUIRE_MAP,
  RULE_NAMES_MAP,
} from "../Shared";
import type { RuleMainKey, RuleName } from "../Shared";

import type { JsonSchema } from "./Schemas.types";

const defaultExtraOptionsSchema = {
  type: "object",
};

/** Schema for validating a micromatch pattern or array of patterns that can also be null. */
const micromatchPatternNullableSchema = {
  anyOf: [
    { type: ["string", "null"] },
    { type: "array", items: { type: ["string", "null"] } },
  ],
};

/** Schema for `atIndex.matches` — a single string pattern or array of string patterns (OR). */
const atIndexMatchesSchema = {
  anyOf: [{ type: "string" }, { type: "array", items: { type: "string" } }],
};

/** A string pattern or an `{ expand }` item. Used in anyOf/allOf/noneOf operands. */
const stringOrExpandItemSchema: JsonSchema = {
  anyOf: [
    { type: "string" },
    {
      type: "object",
      properties: { expand: { type: "string" } },
      required: ["expand"],
      additionalProperties: false,
    },
  ],
};

/**
 * Schema for an ArrayQuery over a string array (`categories`, `types`).
 * All operators are optional and AND-combined when present.
 */
const stringArrayQuerySchema = {
  type: "object",
  properties: {
    anyOf: { type: "array", items: stringOrExpandItemSchema },
    allOf: { type: "array", items: stringOrExpandItemSchema },
    noneOf: { type: "array", items: stringOrExpandItemSchema },
    equalsTo: { type: "array", items: stringOrExpandItemSchema },
    atIndex: {
      type: "object",
      properties: {
        index: { type: "number" },
        matches: atIndexMatchesSchema,
      },
      required: ["index", "matches"],
      additionalProperties: false,
    },
    hasLength: { type: "number" },
  },
  additionalProperties: false,
};

/** Schema for a property that accepts either a micromatch pattern or a string array query. */
const micromatchOrArrayQuerySchema = {
  anyOf: [micromatchPatternNullableSchema, stringArrayQuerySchema],
};

const capturedValuesSingleSelectorSchema = {
  type: "object",
  additionalProperties: true,
};

const capturedValuesSelectorSchema = {
  anyOf: [
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
    // `types` accepts a micromatch pattern or an array query object.
    // A simplified object schema is used here (no deep validation of the query structure)
    // to avoid generating an overly large AJV validator that crashes V8's baseline JIT
    // when this schema is embedded in parentsArrayQuerySchema five times over.
    types: {
      anyOf: [micromatchPatternNullableSchema, { type: "object" }],
    },
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

/** Schema for an ArrayQuery over the parent ancestor chain (`element.parents`).
 * Items use a simplified schema (`{ type: "object" }`) to avoid generating an
 * overly large AJV validator that would crash V8's baseline JIT compiler. */
const parentsArrayQuerySchema = {
  type: "object",
  properties: {
    anyOf: { type: "array", items: { type: "object" } },
    allOf: { type: "array", items: { type: "object" } },
    noneOf: { type: "array", items: { type: "object" } },
    equalsTo: { type: "array", items: { type: "object" } },
    atIndex: {
      type: "object",
      properties: {
        index: { type: "number" },
        matches: {
          anyOf: [
            { type: "object" },
            { type: "array", items: { type: "object" } },
          ],
        },
      },
      required: ["index", "matches"],
      additionalProperties: false,
    },
    hasLength: { type: "number" },
  },
  additionalProperties: false,
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
    types: micromatchOrArrayQuerySchema,
    category: micromatchPatternNullableSchema,
    captured: capturedValuesSelectorSchema,
    parent: parentElementSelectorSchema,
    parents: parentsArrayQuerySchema,
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
    categories: micromatchOrArrayQuerySchema,
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

const moduleSingleSelectorSchema = {
  type: "object",
  properties: {
    origin: micromatchPatternNullableSchema,
    source: micromatchPatternNullableSchema,
    internalPath: micromatchPatternNullableSchema,
  },
  additionalProperties: false,
};

const moduleSelectorSchema = {
  oneOf: [
    moduleSingleSelectorSchema,
    {
      type: "array",
      items: moduleSingleSelectorSchema,
    },
  ],
};

const entitySingleSelectorSchema = {
  type: "object",
  properties: {
    element: elementSelectorSchema,
    file: fileSelectorSchema,
    module: moduleSelectorSchema,
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

/**
 * Loose schema for the modern `from`/`to`/`dependency`/`allow`/`disallow` policy properties.
 *
 * Their actual selector shape (element/file/module/origin/dependency-info descriptors) is
 * validated at runtime via the type guards exposed by `@boundaries/elements` (see
 * `validateAndWarnRuleOptions`) instead of a deep AJV schema, which used to be embedded once
 * per property and crashed V8's baseline JIT compiler when parsed.
 */
const modernPolicySelectorSchema = {
  anyOf: [{ type: "object" }, { type: "array" }, { type: "string" }],
};

/**
 * Builds JSON schema for legacy policy selectors.
 *
 * @param matcherOptions - Extra matcher options accepted in legacy tuple syntax.
 * @returns JSON schema definition for legacy policy values.
 */
export function legacyPoliciesSchema(
  matcherOptions: JsonSchema = defaultExtraOptionsSchema
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
  targetMatcherOptions?: JsonSchema;
  extraOptionsSchema?: Record<string, JsonSchema>;
  isLegacy?: boolean;
} = {}) {
  const policiesSchema = isLegacy
    ? legacyPoliciesSchema(targetMatcherOptions)
    : modernPolicySelectorSchema;

  const legacyMainKey = rulesMainKey(mainKey);

  const ruleSupportedProperties = isLegacy
    ? {
        [legacyMainKey]: backwardCompatibleEntitySelectorSchema,
        allow: policiesSchema,
        disallow: policiesSchema,
      }
    : {
        from: modernPolicySelectorSchema,
        to: modernPolicySelectorSchema,
        dependency: modernPolicySelectorSchema,
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

  const policyEntrySchema = {
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
  };

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
        // `policies` is the current option name; `rules` is kept as a deprecated alias.
        policies: policyEntrySchema,
        rules: policyEntrySchema,
        ...extraOptionsSchema,
      },
      additionalProperties: false,
    },
  ];

  // NOTE: The schema is casted because the schema is too complex for TypeScript to infer the type correctly. The schema is valid and can be used with ESLint.
  return schema as JsonSchema[];
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

/**
 * Schema of the options of the dependencies rule and its deprecated `element-types` name.
 */
const dependenciesRuleOptionsSchema = rulesOptionsSchema({
  extraOptionsSchema: {
    checkAllOrigins: {
      type: "boolean",
      description:
        "Whether to check dependencies from all origins (including external and core) or only from local entities. Default to false (only local).",
    },
    checkUnknownLocals: {
      type: "boolean",
      description:
        "Whether to check local dependencies with unknown entities (not matching any entity descriptor) or to ignore them. Default to false (ignore).",
    },
    checkInternals: {
      type: "boolean",
      description:
        "Whether to check internal dependencies (dependencies within files in the same entity). Default to false (ignore).",
    },
  },
});

/**
 * Schema of the options of the no-unknown-dependencies rule and its deprecated `no-unknown` name.
 */
const noUnknownDependenciesRuleOptionsSchema: JsonSchema[] = [
  {
    type: "object",
    properties: {
      require: {
        type: "string",
        enum: Object.values(NO_UNKNOWN_DEPENDENCIES_REQUIRE_MAP),
        description:
          "Which classification axes the dependency target must be known on to be valid. " +
          '"any" (default): known on at least one axis is enough; reports only when unknown on both. ' +
          '"element": the element axis must be known; reports when the element is unknown. ' +
          '"file": the file axis must be known; reports when the file is unknown. ' +
          '"all": both axes must be known; reports when either is unknown.',
      },
    },
    additionalProperties: false,
  },
];

/**
 * Schema of the options of each rule, as the ESLint plugin declares it in the rule `meta.schema`.
 */
const RULE_OPTIONS_SCHEMAS: Record<RuleName, JsonSchema[]> = {
  [RULE_NAMES_MAP.ELEMENT_TYPES]: dependenciesRuleOptionsSchema,
  [RULE_NAMES_MAP.DEPENDENCIES]: dependenciesRuleOptionsSchema,
  [RULE_NAMES_MAP.ENTRY_POINT]: rulesOptionsSchema({
    rulesMainKey: "target",
    isLegacy: true,
  }),
  [RULE_NAMES_MAP.EXTERNAL]: rulesOptionsSchema({
    isLegacy: true,
    targetMatcherOptions: {
      type: "object",
      properties: {
        specifiers: {
          type: "array",
          items: {
            type: "string",
          },
        },
        path: {
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
      },
      additionalProperties: false,
    },
  }),
  [RULE_NAMES_MAP.NO_IGNORED_DEPENDENCIES]: [],
  [RULE_NAMES_MAP.NO_IGNORED]: [],
  [RULE_NAMES_MAP.NO_PRIVATE]: [
    {
      type: "object",
      properties: {
        allowUncles: {
          type: "boolean",
        },
        message: {
          type: "string",
        },
      },
      additionalProperties: false,
    },
  ],
  [RULE_NAMES_MAP.NO_UNKNOWN_FILES]: [],
  [RULE_NAMES_MAP.NO_UNKNOWN_DEPENDENCIES]:
    noUnknownDependenciesRuleOptionsSchema,
  [RULE_NAMES_MAP.NO_UNKNOWN]: noUnknownDependenciesRuleOptionsSchema,
};

/**
 * Returns the JSON schema of the options of a rule, as the ESLint plugin declares it in the rule `meta.schema`: an array with the schema of each option, empty when the rule takes no options. The returned schemas are shared: do not mutate them.
 * @param ruleName The name of the rule, with the default plugin prefix.
 * @returns The schema of the rule options.
 */
export function getRuleOptionsSchema(ruleName: RuleName): JsonSchema[] {
  return RULE_OPTIONS_SCHEMAS[ruleName];
}

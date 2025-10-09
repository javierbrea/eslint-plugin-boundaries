import type { Rule } from "eslint";
import micromatch from "micromatch";

import type {
  ElementMatcher,
  ElementMatchers,
  ExternalLibraryMatcher,
  ExternalLibraryMatchers,
  RuleOptionsRules,
} from "src/constants/Options.types";

import type {
  DependencyNodeKey,
  DependencyNodeSelector,
  ElementAssigners,
  PluginSettings,
  IgnoreSetting,
  IncludeSetting,
  ImportKind,
} from "../constants/settings";
import { SETTINGS, SETTINGS_KEYS } from "../constants/settings";

import { warnOnce } from "./debug";
import type { RuleMainKey, ValidateRulesOptions } from "./Helpers.types";
import { rulesMainKey } from "./rules";
import { getElementsTypeNames, isValidElementAssigner } from "./settings";
import { isArray, isString, isObject } from "./utils";

const {
  TYPES,
  ALIAS,
  ELEMENTS,
  DEPENDENCY_NODES,
  ADDITIONAL_DEPENDENCY_NODES,
  VALID_DEPENDENCY_NODE_KINDS,
  DEFAULT_DEPENDENCY_NODES,
} = SETTINGS;

const invalidMatchers: (ElementMatcher | ExternalLibraryMatcher)[] = [];

const DEFAULT_MATCHER_OPTIONS = {
  type: "object",
};

export function elementsMatcherSchema(
  matcherOptions: Record<string, unknown> = DEFAULT_MATCHER_OPTIONS,
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
  } = {},
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
  matcher: ElementMatcher | ExternalLibraryMatcher,
  settings: PluginSettings,
) {
  const matcherToCheck = isArray(matcher) ? matcher[0] : matcher;
  return (
    !matcher || micromatch.some(getElementsTypeNames(settings), matcherToCheck)
  );
}

export function validateElementTypesMatcher(
  elementsMatcher: ElementMatchers | ExternalLibraryMatchers,
  settings: PluginSettings,
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
      `Option '${matcher}' does not match any element type from '${ELEMENTS}' setting`,
    );
  }
}

function validateElements(elements: unknown): ElementAssigners | undefined {
  if (!elements || !isArray(elements) || !elements.length) {
    warnOnce(`Please provide element types using the '${ELEMENTS}' setting`);
    return;
  }
  return elements.filter(isValidElementAssigner);
}

function isDependencyNodeKey(value: unknown): value is DependencyNodeKey {
  return (
    isString(value) && Object.keys(DEFAULT_DEPENDENCY_NODES).includes(value)
  );
}

function validateDependencyNodes(
  dependencyNodes: DependencyNodeKey[] | undefined | unknown,
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

  dependencyNodes.forEach((dependencyNode) => {
    if (!isDependencyNodeKey(dependencyNode)) {
      warnOnce(invalidFormatMessage);
    }
  });

  return dependencyNodes.filter(isDependencyNodeKey);
}

function isValidDependencyNodeSelector(
  selector: unknown,
): selector is DependencyNodeSelector {
  const isValidObject =
    isObject(selector) &&
    isString(selector.selector) &&
    (!selector.kind ||
      (isString(selector.kind) &&
        VALID_DEPENDENCY_NODE_KINDS.includes(selector.kind as ImportKind)));
  if (!isValidObject) {
    warnOnce(
      `Please provide a valid object in ${ADDITIONAL_DEPENDENCY_NODES} setting. The object should be composed of the following properties: { selector: "<esquery selector>", kind: "value" | "type" }. The invalid object will be ignored.`,
    );
  }
  return isValidObject;
}

function validateAdditionalDependencyNodes(
  additionalDependencyNodes: unknown,
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
      `Defining aliases in '${ALIAS}' setting is deprecated. Please use 'import/resolver' setting`,
    );
  }
}

function deprecateTypes(types: unknown) {
  if (types) {
    warnOnce(
      `'${TYPES}' setting is deprecated. Please use '${ELEMENTS}' instead`,
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
    `Please provide a valid value in '${SETTINGS_KEYS.IGNORE}' setting. The value should be a string or an array of strings.`,
  );
  return;
}

function validateInclude(include: unknown): IncludeSetting | undefined {
  if (!include) {
    return;
  }
  if (isString(include) || (isArray(include) && include.every(isString))) {
    return include;
  }
  warnOnce(
    `Please provide a valid value in '${SETTINGS_KEYS.INCLUDE}' setting. The value should be a string or an array of strings.`,
  );
  return;
}

function validateRootPath(rootPath: unknown): string | undefined {
  if (!rootPath) {
    return;
  }
  if (isString(rootPath)) {
    return rootPath;
  }
  warnOnce(
    `Please provide a valid value in '${SETTINGS_KEYS.ROOT_PATH}' setting. The value should be a string.`,
  );
  return;
}

export function validateSettings(
  settings: Rule.RuleContext["settings"],
): PluginSettings {
  deprecateTypes(settings[TYPES]);
  deprecateAlias(settings[ALIAS]);

  return {
    [SETTINGS_KEYS.ELEMENTS]: validateElements(
      settings[ELEMENTS] || settings[TYPES],
    ),
    [SETTINGS_KEYS.IGNORE]: validateIgnore(settings[SETTINGS_KEYS.IGNORE]),
    [SETTINGS_KEYS.INCLUDE]: validateInclude(settings[SETTINGS_KEYS.INCLUDE]),
    [SETTINGS_KEYS.ROOT_PATH]: validateRootPath(
      settings[SETTINGS_KEYS.ROOT_PATH],
    ),
    [SETTINGS_KEYS.DEPENDENCY_NODES]: validateDependencyNodes(
      settings[DEPENDENCY_NODES],
    ),
    [SETTINGS_KEYS.ADDITIONAL_DEPENDENCY_NODES]:
      validateAdditionalDependencyNodes(settings[ADDITIONAL_DEPENDENCY_NODES]),
  };
}

export function validateRules(
  settings: PluginSettings,
  rules: RuleOptionsRules[] = [],
  options: ValidateRulesOptions = {},
) {
  const mainKey = rulesMainKey(options.mainKey);
  rules.forEach((rule) => {
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
  });
}

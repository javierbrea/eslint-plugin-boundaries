import type { Rule } from "eslint";
import micromatch from "micromatch";

import type { RuleOptionsRules } from "src/constants/Options.types";

import type {
  DependencyNodeKey,
  DependencyNodeSelector,
  PluginSettings,
} from "../constants/settings";
import { SETTINGS, SETTINGS_KEYS } from "../constants/settings";

import { warnOnce } from "./debug";
import type { ValidateRulesOptions } from "./Helpers.types";
import { rulesMainKey } from "./rules";
import { getElementsTypeNames, isLegacyType } from "./settings";
import { isArray, isString, isObject } from "./utils";

const {
  TYPES,
  ALIAS,
  ELEMENTS,
  VALID_MODES,
  DEPENDENCY_NODES,
  ADDITIONAL_DEPENDENCY_NODES,
  VALID_DEPENDENCY_NODE_KINDS,
  DEFAULT_DEPENDENCY_NODES,
} = SETTINGS;

const invalidMatchers = [];

const DEFAULT_MATCHER_OPTIONS = {
  type: "object",
};

export function elementsMatcherSchema(
  matcherOptions = DEFAULT_MATCHER_OPTIONS,
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

export function rulesOptionsSchema(options = {}) {
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

function isValidElementTypesMatcher(matcher, settings) {
  const matcherToCheck = isArray(matcher) ? matcher[0] : matcher;
  return (
    !matcher || micromatch.some(getElementsTypeNames(settings), matcherToCheck)
  );
}

export function validateElementTypesMatcher(elementsMatcher, settings) {
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

function validateElements(elements) {
  if (!elements || !isArray(elements) || !elements.length) {
    warnOnce(`Please provide element types using the '${ELEMENTS}' setting`);
    return;
  }
  elements.forEach((element) => {
    // TODO, remove in next major version
    if (isLegacyType(element)) {
      warnOnce(
        `Defining elements as strings in settings is deprecated. Will be automatically converted, but this feature will be removed in next major versions`,
      );
    } else {
      Object.keys(element).forEach(() => {
        if (!element.type || !isString(element.type)) {
          warnOnce(`Please provide type in '${ELEMENTS}' setting`);
        }
        if (element.mode && !VALID_MODES.includes(element.mode)) {
          warnOnce(
            `Invalid mode property of type ${
              element.type
            } in '${ELEMENTS}' setting. Should be one of ${VALID_MODES.join(
              ",",
            )}. Default value "${VALID_MODES[0]}" will be used instead`,
          );
        }
        if (
          !element.pattern ||
          !(isString(element.pattern) || isArray(element.pattern))
        ) {
          warnOnce(
            `Please provide a valid pattern to type ${element.type} in '${ELEMENTS}' setting`,
          );
        }
        if (element.capture && !isArray(element.capture)) {
          warnOnce(
            `Invalid capture property of type ${element.type} in '${ELEMENTS}' setting`,
          );
        }
      });
    }
  });
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
    if (
      !isString(dependencyNode) ||
      !defaultNodesNames.includes(dependencyNode)
    ) {
      warnOnce(invalidFormatMessage);
    }
  });

  // TODO: Return only valid values, using a function to validate and type guard

  return dependencyNodes;
}

function validateAdditionalDependencyNodes(
  additionalDependencyNodes: DependencyNodeSelector[] | undefined | unknown,
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

  additionalDependencyNodes.forEach((dependencyNode) => {
    const isValidObject =
      isObject(dependencyNode) &&
      isString(dependencyNode.selector) &&
      (!dependencyNode.kind ||
        VALID_DEPENDENCY_NODE_KINDS.includes(dependencyNode.kind));

    if (!isValidObject) {
      warnOnce(invalidFormatMessage);
    }
  });

  // TODO: Return only valid values, using a function to validate and type guard

  return additionalDependencyNodes;
}

function deprecateAlias(aliases) {
  if (aliases) {
    warnOnce(
      `Defining aliases in '${ALIAS}' setting is deprecated. Please use 'import/resolver' setting`,
    );
  }
}

function deprecateTypes(types) {
  if (types) {
    warnOnce(
      `'${TYPES}' setting is deprecated. Please use '${ELEMENTS}' instead`,
    );
  }
}

export function validateSettings(
  settings: Rule.RuleContext["settings"],
): PluginSettings {
  deprecateTypes(settings[TYPES]);
  deprecateAlias(settings[ALIAS]);
  validateElements(settings[ELEMENTS] || settings[TYPES]);
  const dependencyNodes = validateDependencyNodes(settings[DEPENDENCY_NODES]);
  const additionalDependencyNodes = validateAdditionalDependencyNodes(
    settings[ADDITIONAL_DEPENDENCY_NODES],
  );

  return {
    [SETTINGS_KEYS.ELEMENTS]: settings[SETTINGS_KEYS.ELEMENTS],
    [SETTINGS_KEYS.IGNORE]: settings[SETTINGS_KEYS.IGNORE],
    [SETTINGS_KEYS.INCLUDE]: settings[SETTINGS_KEYS.INCLUDE],
    [SETTINGS_KEYS.ROOT_PATH]: settings[SETTINGS_KEYS.ROOT_PATH],
    [SETTINGS_KEYS.DEPENDENCY_NODES]: dependencyNodes,
    [SETTINGS_KEYS.ADDITIONAL_DEPENDENCY_NODES]: additionalDependencyNodes,
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
      validateElementTypesMatcher(rule.allow, settings);
      validateElementTypesMatcher(rule.disallow, settings);
    }
  });
}

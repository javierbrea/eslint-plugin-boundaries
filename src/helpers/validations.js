const micromatch = require("micromatch");

const {
  TYPES,
  ALIAS,
  ELEMENTS,
  VALID_MODES,
  DEPENDENCY_NODES,
  ADDITIONAL_DEPENDENCY_NODES,
  VALID_DEPENDENCY_NODE_KINDS,
  DEFAULT_DEPENDENCY_NODES,
} = require("../constants/settings");

const { getElementsTypeNames, isLegacyType } = require("./settings");
const { rulesMainKey } = require("./rules");
const { warnOnce } = require("./debug");
const { isArray, isString, isObject } = require("./utils");

const invalidMatchers = [];

const DEFAULT_MATCHER_OPTIONS = {
  type: "object",
};

function elementsMatcherSchema(matcherOptions = DEFAULT_MATCHER_OPTIONS) {
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

function rulesOptionsSchema(options = {}) {
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
  const mathcherToCheck = isArray(matcher) ? matcher[0] : matcher;
  return !matcher || micromatch.some(getElementsTypeNames(settings), mathcherToCheck);
}

function validateElementTypesMatcher(elementsMatcher, settings) {
  const [matcher] = isArray(elementsMatcher) ? elementsMatcher : [elementsMatcher];
  if (!invalidMatchers.includes(matcher) && !isValidElementTypesMatcher(matcher, settings)) {
    invalidMatchers.push(matcher);
    warnOnce(`Option '${matcher}' does not match any element type from '${ELEMENTS}' setting`);
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
        if (!element.pattern || !(isString(element.pattern) || isArray(element.pattern))) {
          warnOnce(
            `Please provide a valid pattern to type ${element.type} in '${ELEMENTS}' setting`,
          );
        }
        if (element.capture && !isArray(element.capture)) {
          warnOnce(`Invalid capture property of type ${element.type} in '${ELEMENTS}' setting`);
        }
      });
    }
  });
}

function validateDependencyNodes(dependencyNodes) {
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
    if (!isString(dependencyNode) || !defaultNodesNames.includes(dependencyNode)) {
      warnOnce(invalidFormatMessage);
    }
  });
}

function validateAdditionalDependencyNodes(additionalDependencyNodes) {
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
      (!dependencyNode.kind || VALID_DEPENDENCY_NODE_KINDS.includes(dependencyNode.kind));

    if (!isValidObject) {
      warnOnce(invalidFormatMessage);
    }
  });
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
    warnOnce(`'${TYPES}' setting is deprecated. Please use '${ELEMENTS}' instead`);
  }
}

function validateSettings(settings) {
  deprecateTypes(settings[TYPES]);
  deprecateAlias(settings[ALIAS]);
  validateElements(settings[ELEMENTS] || settings[TYPES]);
  validateDependencyNodes(settings[DEPENDENCY_NODES]);
  validateAdditionalDependencyNodes(settings[ADDITIONAL_DEPENDENCY_NODES]);
}

function validateRules(settings, rules = [], options = {}) {
  const mainKey = rulesMainKey(options.mainKey);
  rules.forEach((rule) => {
    validateElementTypesMatcher([rule[mainKey]], settings);
    if (!options.onlyMainKey) {
      validateElementTypesMatcher(rule.allow, settings);
      validateElementTypesMatcher(rule.disallow, settings);
    }
  });
}

module.exports = {
  elementsMatcherSchema,
  rulesOptionsSchema,
  validateElementTypesMatcher,
  validateSettings,
  validateRules,
};

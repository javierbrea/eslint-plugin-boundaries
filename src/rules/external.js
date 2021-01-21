const micromatch = require("micromatch");

const { RULE_EXTERNAL } = require("../constants/settings");

const { fileInfo } = require("../core/elementsInfo");
const { dependencyInfo } = require("../core/dependencyInfo");

const { validateSettings, rulesOptionsSchema, validateRules } = require("../helpers/validations");
const { meta2, dependencyLocation, elementRulesAllowDependency } = require("../helpers/rules");

function specifiersMatch(specifiers, options) {
  const importedSpecifiersNames = specifiers
    .filter((specifier) => {
      return specifier.type === "ImportSpecifier" && specifier.imported.name;
    })
    .map((specifier) => specifier.imported.name);
  return options.reduce((found, option) => {
    if (importedSpecifiersNames.includes(option)) {
      found.push(option);
    }
    return found;
  }, []);
}

function isMatchExternalDependency(dependency, matcher, options) {
  const isMatch = micromatch.isMatch(dependency.baseModule, matcher);
  if (isMatch && options) {
    const specifiersResult = specifiersMatch(dependency.specifiers, options.specifiers);
    return {
      result: specifiersResult.length > 0,
      report: specifiersResult,
    };
  }
  return {
    result: isMatch,
  };
}

function elementRulesAllowExternalDependency(element, dependency, options) {
  return elementRulesAllowDependency({
    element,
    dependency,
    options,
    isMatch: isMatchExternalDependency,
  });
}

module.exports = {
  ...meta2({
    ruleName: RULE_EXTERNAL,
    description: `Check allowed external dependencies by element type`,
    schema: rulesOptionsSchema({
      targetMatcherOptions: {
        type: "object",
        properties: {
          specifiers: {
            type: "array",
            items: {
              type: "string",
            },
          },
        },
        additionalProperties: false,
      },
    }),
  }),

  create: function (context) {
    const options = context.options[0];
    const file = fileInfo(context);
    if (!options || file.isIgnored || !file.type) {
      return {};
    }

    validateRules(options.rules, context.settings, { onlyMainKey: true });
    validateSettings(context.settings);

    return {
      ImportDeclaration: (node) => {
        const dependency = dependencyInfo(node.source.value, context);

        if (dependency.isExternal) {
          const isAllowed = elementRulesAllowExternalDependency(
            file,
            { ...dependency, specifiers: node.source.parent.specifiers },
            options
          );
          if (!isAllowed.result) {
            if (isAllowed.report) {
              context.report({
                message: `Usage of '${isAllowed.report.join(", ")}' from external module '${
                  dependency.baseModule
                }' is not allowed in '${file.type}'`,
                node: node,
                ...dependencyLocation(node, context),
              });
            } else {
              context.report({
                message: `Usage of external module '${dependency.baseModule}' is not allowed in '${file.type}'`,
                node: node,
                ...dependencyLocation(node, context),
              });
            }
          }
        }
      },
    };
  },
};

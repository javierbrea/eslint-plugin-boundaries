const { RULE_ELEMENT_TYPES } = require("../constants/settings");

const { fileInfo } = require("../core/elementsInfo");
const { dependencyInfo } = require("../core/dependencyInfo");

const { rulesOptionsSchema, validateSettings, validateRules } = require("../helpers/validations");
const {
  meta2,
  dependencyLocation,
  isMatchElementType,
  elementRulesAllowDependency,
} = require("../helpers/rules");

function elementRulesAllowDependencyType(element, dependency, options) {
  return elementRulesAllowDependency({
    element,
    dependency,
    options,
    isMatch: isMatchElementType,
  }).result;
}

module.exports = {
  ...meta2({
    ruleName: RULE_ELEMENT_TYPES,
    description: `Check allowed dependencies between element types`,
    schema: rulesOptionsSchema(),
  }),

  create: function (context) {
    const options = context.options[0];
    const file = fileInfo(context);
    if (!options || file.isIgnored || !file.type) {
      return {};
    }

    validateRules(options.rules, context.settings);
    validateSettings(context.settings);

    return {
      ImportDeclaration: (node) => {
        const dependency = dependencyInfo(node.source.value, context);

        if (
          dependency.isLocal &&
          !dependency.isIgnored &&
          dependency.type &&
          !dependency.isInternal &&
          !elementRulesAllowDependencyType(file, dependency, options)
        ) {
          context.report({
            message: `Usage of '${dependency.type}' is not allowed in '${file.type}'`,
            node: node,
            ...dependencyLocation(node, context),
          });
        }
      },
    };
  },
};

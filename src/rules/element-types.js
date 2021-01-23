const { RULE_ELEMENT_TYPES } = require("../constants/settings");

const dependencyRule = require("../rules-factories/dependency-rule");

const { rulesOptionsSchema } = require("../helpers/validations");
const {
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

module.exports = dependencyRule(
  {
    ruleName: RULE_ELEMENT_TYPES,
    description: `Check allowed dependencies between element types`,
    schema: rulesOptionsSchema(),
  },
  function ({ dependency, file, node, context, options }) {
    // console.log({ dependency, file });
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
  }
);

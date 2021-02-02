const { RULE_ENTRY_POINT } = require("../constants/settings");

const dependencyRule = require("../rules-factories/dependency-rule");

const { rulesOptionsSchema } = require("../helpers/validations");
const {
  dependencyLocation,
  isMatchElementKey,
  elementRulesAllowDependency,
} = require("../helpers/rules");

function isMatchElementInternalPath(elementInfo, matcher, options) {
  return isMatchElementKey(elementInfo, matcher, options, "internalPath");
}

function elementRulesAllowEntryPoint(element, dependency, options) {
  return elementRulesAllowDependency({
    element: dependency,
    dependency,
    options,
    isMatch: isMatchElementInternalPath,
    rulesMainKey: "target",
  }).result;
}

module.exports = dependencyRule(
  {
    ruleName: RULE_ENTRY_POINT,
    description: `Check entry point used for each element type`,
    schema: rulesOptionsSchema({
      rulesMainKey: "target",
    }),
  },
  function ({ dependency, file, node, context, options }) {
    if (
      !dependency.isIgnored &&
      dependency.type &&
      !dependency.isInternal &&
      !elementRulesAllowEntryPoint(file, dependency, options)
    ) {
      context.report({
        message: `Entry point '${dependency.internalPath}' is not allowed in '${dependency.type}'`,
        node: node,
        ...dependencyLocation(node, context),
      });
    }
  },
  {
    validateRules: { onlyMainKey: true, mainKey: "target" },
  }
);

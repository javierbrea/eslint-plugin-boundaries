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
  });
}

function errorMessage(ruleData, file, dependency) {
  return `Entry point '${dependency.internalPath}' is not allowed in '${dependency.type}'`;
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
    if (!dependency.isIgnored && dependency.type && !dependency.isInternal) {
      const ruleData = elementRulesAllowEntryPoint(file, dependency, options);
      if (!ruleData.result) {
        context.report({
          message: errorMessage(ruleData, file, dependency),
          node: node,
          ...dependencyLocation(node, context),
        });
      }
    }
  },
  {
    validateRules: { onlyMainKey: true, mainKey: "target" },
  }
);

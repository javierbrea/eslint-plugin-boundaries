const { RULE_ENTRY_POINT } = require("../constants/settings");

const dependencyRule = require("../rules-factories/dependency-rule");

const { rulesOptionsSchema } = require("../helpers/validations");
const {
  dependencyLocation,
  isMatchElementKey,
  elementRulesAllowDependency,
} = require("../helpers/rules");
const { customErrorMessage, ruleElementMessage, elementMessage } = require("../helpers/messages");

function isMatchElementInternalPath(elementInfo, matcher, options) {
  return isMatchElementKey(elementInfo, matcher, options, "internalPath");
}

function elementRulesAllowEntryPoint(_element, dependency, options) {
  return elementRulesAllowDependency({
    element: dependency,
    dependency,
    options,
    isMatch: isMatchElementInternalPath,
    rulesMainKey: "target",
  });
}

function errorMessage(ruleData, file, dependency) {
  const ruleReport = ruleData.ruleReport;
  if (ruleReport.message) {
    return customErrorMessage(ruleReport.message, file, dependency);
  }
  if (ruleReport.isDefault) {
    return `No rule allows the entry point '${
      dependency.internalPath
    }' in dependencies ${elementMessage(dependency)}`;
  }
  return `The entry point '${dependency.internalPath}' is not allowed in ${ruleElementMessage(
    ruleReport.element,
    dependency.capturedValues
  )}. Disallowed in rule ${ruleReport.index + 1}`;
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

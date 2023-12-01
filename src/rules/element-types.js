const { RULE_ELEMENT_TYPES } = require("../constants/settings");

const dependencyRule = require("../rules-factories/dependency-rule");

const { rulesOptionsSchema } = require("../helpers/validations");
const { isMatchElementType, elementRulesAllowDependency } = require("../helpers/rules");
const {
  customErrorMessage,
  ruleElementMessage,
  elementMessage,
  dependencyImportKindMessage,
} = require("../helpers/messages");

function elementRulesAllowDependencyType(element, dependency, options) {
  return elementRulesAllowDependency({
    element,
    dependency,
    options,
    isMatch: isMatchElementType,
  });
}

function errorMessage(ruleData, file, dependency) {
  const ruleReport = ruleData.ruleReport;
  if (ruleReport.message) {
    return customErrorMessage(ruleReport.message, file, dependency);
  }
  if (ruleReport.isDefault) {
    return `No rule allowing this dependency was found. File is ${elementMessage(
      file,
    )}. Dependency is ${elementMessage(dependency)}`;
  }
  return `Importing ${dependencyImportKindMessage(
    ruleReport.importKind,
    dependency,
  )}${ruleElementMessage(
    ruleReport.disallow,
    file.capturedValues,
  )} is not allowed in ${ruleElementMessage(
    ruleReport.element,
    file.capturedValues,
  )}. Disallowed in rule ${ruleReport.index + 1}`;
}

module.exports = dependencyRule(
  {
    ruleName: RULE_ELEMENT_TYPES,
    description: `Check allowed dependencies between element types`,
    schema: rulesOptionsSchema(),
  },
  function ({ dependency, file, node, context, options }) {
    if (dependency.isLocal && !dependency.isIgnored && dependency.type && !dependency.isInternal) {
      const ruleData = elementRulesAllowDependencyType(file, dependency, options);
      if (!ruleData.result) {
        context.report({
          message: errorMessage(ruleData, file, dependency),
          node: node,
        });
      }
    }
  },
);

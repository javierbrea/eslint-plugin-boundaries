const { RULE_ELEMENT_TYPES } = require("../constants/settings");

const dependencyRule = require("../rules-factories/dependency-rule");

const { rulesOptionsSchema } = require("../helpers/validations");
const {
  dependencyLocation,
  isMatchElementType,
  elementRulesAllowDependency,
} = require("../helpers/rules");
const { ruleElementMessage } = require("../helpers/messages");

function elementRulesAllowDependencyType(element, dependency, options) {
  return elementRulesAllowDependency({
    element,
    dependency,
    options,
    isMatch: isMatchElementType,
  });
}

function customErrorMessage(message /*, elementCapturedValues, dependencyCapturedValues*/) {
  // TODO, replace element captured values, including "type", and dependency captured values, including "type"
  // "Do not import ${dependency.type} from ${file.type} with ${file.elementName}";
  // TODO, support "message" property in rule settings at first level. Use it if present.
  return message;
}

function errorMessage(ruleData, elementCapturedValues) {
  const ruleReport = ruleData.ruleReport;
  if (ruleReport.isDefault) {
    return "Importing elements is disallowed by default. No rule allowing this dependency was found";
  }
  if (ruleReport.message) {
    return customErrorMessage(ruleData, elementCapturedValues);
  }
  return `Importing ${ruleElementMessage(
    ruleReport.disallow,
    elementCapturedValues
  )} is not allowed in ${ruleElementMessage(
    ruleReport.element,
    elementCapturedValues
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
          message: errorMessage(ruleData, file.capturedValues),
          node: node,
          ...dependencyLocation(node, context),
        });
      }
    }
  }
);

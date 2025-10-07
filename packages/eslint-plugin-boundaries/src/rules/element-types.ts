import { SETTINGS } from "../constants/settings";

import dependencyRule from "../rules-factories/dependency-rule";

import { rulesOptionsSchema } from "../helpers/validations";
import {
  isMatchElementType,
  elementRulesAllowDependency,
} from "../helpers/rules";
import {
  customErrorMessage,
  ruleElementMessage,
  elementMessage,
  dependencyImportKindMessage,
} from "../helpers/messages";

const { RULE_ELEMENT_TYPES } = SETTINGS;

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

export default dependencyRule(
  {
    ruleName: RULE_ELEMENT_TYPES,
    description: `Check allowed dependencies between element types`,
    schema: rulesOptionsSchema(),
  },
  function ({ dependency, file, node, context, options }) {
    if (
      dependency.isLocal &&
      !dependency.isIgnored &&
      dependency.type &&
      !dependency.isInternal
    ) {
      const ruleData = elementRulesAllowDependencyType(
        file,
        dependency,
        options,
      );
      if (!ruleData.result) {
        context.report({
          message: errorMessage(ruleData, file, dependency),
          node: node,
        });
      }
    }
  },
);

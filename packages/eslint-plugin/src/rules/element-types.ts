import {
  isIgnoredElement,
  isInternalDependency,
  isLocalElement,
  isUnknownLocalElement,
} from "@boundaries/elements";

import type { DependencyInfo } from "../constants/DependencyInfo.types";
import type { FileInfo } from "../constants/ElementsInfo.types";
import type {
  ElementTypesRuleOptions,
  RuleResult,
} from "../constants/Options.types";
import { PLUGIN_NAME, PLUGIN_ISSUES_URL } from "../constants/plugin";
import { SETTINGS } from "../constants/settings";
import {
  customErrorMessage,
  ruleElementMessage,
  elementMessage,
  dependencyImportKindMessage,
} from "../helpers/messages";
import {
  isMatchElementType,
  elementRulesAllowDependency,
} from "../helpers/rules";
import { rulesOptionsSchema } from "../helpers/validations";
import dependencyRule from "../rules-factories/dependency-rule";

const { RULE_ELEMENT_TYPES } = SETTINGS;

function elementRulesAllowDependencyType(
  element: FileInfo,
  dependency: DependencyInfo,
  options: ElementTypesRuleOptions = {},
) {
  return elementRulesAllowDependency({
    element,
    dependency,
    options,
    isMatch: isMatchElementType,
  });
}

function errorMessage(
  ruleData: RuleResult,
  file: FileInfo,
  dependency: DependencyInfo,
) {
  const ruleReport = ruleData.ruleReport;

  if (!ruleReport) {
    return `No detailed rule report available. This is likely a bug in ${PLUGIN_NAME}. Please report it at ${PLUGIN_ISSUES_URL}`;
  }

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

export default dependencyRule<ElementTypesRuleOptions>(
  {
    ruleName: RULE_ELEMENT_TYPES,
    description: `Check allowed dependencies between element types`,
    schema: rulesOptionsSchema(),
  },
  function ({ dependency, file, node, context, options }) {
    if (
      isLocalElement(dependency.originalDescription.to) &&
      !isIgnoredElement(dependency.originalDescription.to) &&
      !isUnknownLocalElement(dependency.originalDescription.to) &&
      !isInternalDependency(dependency.originalDescription)
    ) {
      const ruleData = elementRulesAllowDependencyType(
        file,
        dependency,
        options,
      );
      if (!ruleData.result) {
        context.report({
          message: errorMessage(ruleData, file, dependency),
          node,
        });
      }
    }
  },
);

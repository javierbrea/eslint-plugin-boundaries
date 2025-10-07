import { SETTINGS } from "../constants/settings";

import dependencyRule from "../rules-factories/dependency-rule";

import { rulesOptionsSchema } from "../helpers/validations";
import {
  isMatchElementKey,
  elementRulesAllowDependency,
  isMatchImportKind,
} from "../helpers/rules";
import {
  customErrorMessage,
  ruleElementMessage,
  elementMessage,
  dependencyUsageKindMessage,
} from "../helpers/messages";

const { RULE_ENTRY_POINT } = SETTINGS;

function isMatchElementInternalPath(
  elementInfo,
  matcher,
  options,
  elementsCapturedValues,
  importKind,
) {
  if (!isMatchImportKind(elementInfo, importKind)) {
    return { result: false };
  }
  return isMatchElementKey(
    elementInfo,
    matcher,
    options,
    "internalPath",
    elementsCapturedValues,
  );
}

function elementRulesAllowEntryPoint(element, dependency, options) {
  return elementRulesAllowDependency({
    element,
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
    dependency.capturedValues,
  )}${dependencyUsageKindMessage(ruleReport.importKind, dependency, {
    prefix: " when importing ",
    suffix: "",
  })}. Disallowed in rule ${ruleReport.index + 1}`;
}

export default dependencyRule(
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
        });
      }
    }
  },
  {
    validateRules: { onlyMainKey: true, mainKey: "target" },
  },
);

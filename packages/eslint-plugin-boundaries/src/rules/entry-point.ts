import type { FileInfo } from "src/core/ElementsInfo.types";

import type {
  EntryPointRuleOptions,
  RuleMatcherElementsCapturedValues,
  RuleResult,
  CapturedValuesMatcher,
} from "../constants/Options.types";
import { PLUGIN_NAME, PLUGIN_ISSUES_URL } from "../constants/plugin";
import type { ImportKind } from "../constants/settings";
import { SETTINGS } from "../constants/settings";
import type { DependencyInfo } from "../core/DependencyInfo.types";
import {
  customErrorMessage,
  ruleElementMessage,
  elementMessage,
  dependencyUsageKindMessage,
} from "../helpers/messages";
import {
  isMatchElementKey,
  elementRulesAllowDependency,
  isMatchImportKind,
} from "../helpers/rules";
import { rulesOptionsSchema } from "../helpers/validations";
import dependencyRule from "../rules-factories/dependency-rule";

const { RULE_ENTRY_POINT } = SETTINGS;

function isMatchElementInternalPath(
  elementInfo: FileInfo | DependencyInfo,
  matcher: string,
  options: CapturedValuesMatcher,
  elementsCapturedValues: RuleMatcherElementsCapturedValues,
  importKind?: ImportKind,
): RuleResult {
  if (!isMatchImportKind(elementInfo, importKind)) {
    return { result: false, report: null, ruleReport: null };
  }
  return isMatchElementKey(
    elementInfo,
    matcher,
    options,
    "internalPath",
    elementsCapturedValues,
  );
}

function elementRulesAllowEntryPoint(
  element: FileInfo,
  dependency: DependencyInfo,
  options: EntryPointRuleOptions = {},
) {
  return elementRulesAllowDependency({
    element,
    dependency,
    options,
    isMatch: isMatchElementInternalPath,
    rulesMainKey: "target",
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

export default dependencyRule<EntryPointRuleOptions>(
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
    // TODO: Define main keys in a map
    validateRules: { onlyMainKey: true, mainKey: "target" },
  },
);

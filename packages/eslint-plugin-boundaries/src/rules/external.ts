import type { Rule } from "eslint";
import type { Identifier, ImportSpecifier } from "estree";
import micromatch from "micromatch";

import type { FileInfo } from "src/core/ElementsInfo.types";

import type {
  ExternalRuleOptions,
  RuleMatcherElementsCapturedValues,
  RuleResult,
  RuleResultReport,
  ExternalLibraryDetailsMatcher,
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
  elementRulesAllowDependency,
  micromatchPatternReplacingObjectsValues,
  isMatchImportKind,
} from "../helpers/rules";
import { isArray } from "../helpers/utils";
import { rulesOptionsSchema } from "../helpers/validations";
import dependencyRule from "../rules-factories/dependency-rule";

const { RULE_EXTERNAL } = SETTINGS;

// TODO: Add always to all dependencies info
function getSpecifiers(node: Rule.Node): string[] {
  if (node.parent.type === "ImportDeclaration") {
    return node.parent.specifiers
      .filter(
        (specifier) =>
          specifier.type === "ImportSpecifier" &&
          specifier.imported &&
          (specifier.imported as Identifier).name,
      )
      .map(
        (specifier) =>
          ((specifier as ImportSpecifier).imported as Identifier).name,
      );
  }

  if (node.parent.type === "ExportNamedDeclaration") {
    return node.parent.specifiers
      .filter(
        (specifier) =>
          specifier.type === "ExportSpecifier" &&
          (specifier.exported as Identifier).name,
      )
      .map((specifier) => (specifier.exported as Identifier).name);
  }

  return [];
}

function specifiersMatch(
  specifiers: string[] = [],
  specifierOptions: string[] = [],
  elementsCapturedValues: RuleMatcherElementsCapturedValues,
) {
  let result: string[] = [];
  return specifierOptions.reduce((found, option) => {
    const matcherWithTemplateReplaced = micromatchPatternReplacingObjectsValues(
      option,
      elementsCapturedValues,
    );
    if (micromatch.some(specifiers, matcherWithTemplateReplaced)) {
      found.push(option);
    }
    return found;
  }, result);
}

function pathMatch(
  path: string,
  pathOptions: string | string[],
  elementsCapturedValues: RuleMatcherElementsCapturedValues,
) {
  const pathMatchers = isArray(pathOptions) ? pathOptions : [pathOptions];
  return pathMatchers.reduce((isMatch, option) => {
    if (isMatch) {
      return isMatch;
    }
    const matcherWithTemplateReplaced = micromatchPatternReplacingObjectsValues(
      option,
      elementsCapturedValues,
    );
    if (micromatch.some(path, matcherWithTemplateReplaced)) {
      isMatch = true;
    }
    return isMatch;
  }, false);
}

function isMatchExternalDependency(
  dependency: DependencyInfo,
  matcher: string | string[],
  options: ExternalLibraryDetailsMatcher,
  elementsCapturedValues: RuleMatcherElementsCapturedValues,
  importKind: ImportKind,
) {
  const matcherWithTemplatesReplaced = micromatchPatternReplacingObjectsValues(
    matcher,
    elementsCapturedValues,
  );
  if (!isMatchImportKind(dependency, importKind)) {
    return { result: false };
  }
  const isMatch = dependency.baseModule
    ? micromatch.isMatch(dependency.baseModule, matcherWithTemplatesReplaced)
    : false;
  if (isMatch && options && Object.keys(options).length) {
    const isPathMatch = options.path
      ? pathMatch(dependency.path, options.path, elementsCapturedValues)
      : true;
    if (isPathMatch && options.specifiers) {
      const specifiersResult = specifiersMatch(
        dependency.specifiers,
        options.specifiers,
        elementsCapturedValues,
      );
      return {
        result: specifiersResult.length > 0,
        report: {
          specifiers: specifiersResult,
        },
      };
    }
    return {
      result: isPathMatch,
      report: {
        path: dependency.path,
      },
    };
  }
  return {
    result: isMatch,
  };
}

function elementRulesAllowExternalDependency(
  element: FileInfo,
  dependency: DependencyInfo,
  options?: ExternalRuleOptions,
) {
  return elementRulesAllowDependency({
    element,
    dependency,
    options,
    isMatch: isMatchExternalDependency,
  });
}

function getErrorReportMessage(report: RuleResultReport) {
  if (report.path) {
    return report.path;
  }
  return report.specifiers?.join(", ") || "";
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
    return customErrorMessage(ruleReport.message, file, dependency, {
      specifiers: ruleData.report?.specifiers?.join(", "),
      path: ruleData.report?.path,
    });
  }
  if (ruleReport.isDefault) {
    return `No rule allows the usage of external module '${
      dependency.baseModule
    }' in elements ${elementMessage(file)}`;
  }

  const fileReport = `is not allowed in ${ruleElementMessage(
    ruleReport.element,
    file.capturedValues,
  )}. Disallowed in rule ${ruleReport.index + 1}`;

  if (ruleData.report) {
    return `Usage of ${dependencyUsageKindMessage(
      ruleReport.importKind,
      dependency,
    )}'${getErrorReportMessage(ruleData.report)}' from external module '${
      dependency.baseModule
    }' ${fileReport}`;
  }
  return `Usage of ${dependencyUsageKindMessage(
    ruleReport.importKind,
    dependency,
    {
      suffix: " from ",
    },
  )}external module '${dependency.baseModule}' ${fileReport}`;
}

export default dependencyRule<ExternalRuleOptions>(
  {
    ruleName: RULE_EXTERNAL,
    description: `Check allowed external dependencies by element type`,
    schema: rulesOptionsSchema({
      targetMatcherOptions: {
        type: "object",
        properties: {
          specifiers: {
            type: "array",
            items: {
              type: "string",
            },
          },
          path: {
            oneOf: [
              {
                type: "string",
              },
              {
                type: "array",
                items: {
                  type: "string",
                },
              },
            ],
          },
        },
        additionalProperties: false,
      },
    }),
  },
  function ({ dependency, file, node, context, options }) {
    if (dependency.isExternal) {
      const ruleData = elementRulesAllowExternalDependency(
        file,
        { ...dependency, specifiers: getSpecifiers(node) },
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
  {
    validateRules: { onlyMainKey: true },
  },
);

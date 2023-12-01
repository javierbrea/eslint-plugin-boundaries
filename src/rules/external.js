const micromatch = require("micromatch");

const { RULE_EXTERNAL } = require("../constants/settings");

const dependencyRule = require("../rules-factories/dependency-rule");

const { rulesOptionsSchema } = require("../helpers/validations");
const {
  elementRulesAllowDependency,
  micromatchPatternReplacingObjectsValues,
  isMatchImportKind,
} = require("../helpers/rules");
const {
  customErrorMessage,
  ruleElementMessage,
  elementMessage,
  dependencyUsageKindMessage,
} = require("../helpers/messages");
const { isArray } = require("../helpers/utils");

function getSpecifiers(node) {
  if (node.parent.type === "ImportDeclaration") {
    return node.parent.specifiers
      .filter((specifier) => specifier.type === "ImportSpecifier" && specifier.imported.name)
      .map((specifier) => specifier.imported.name);
  }

  if (node.parent.type === "ExportNamedDeclaration") {
    return node.parent.specifiers
      .filter((specifier) => specifier.type === "ExportSpecifier" && specifier.exported.name)
      .map((specifier) => specifier.exported.name);
  }

  return [];
}

function specifiersMatch(specifiers, specifierOptions, elementsCapturedValues) {
  return specifierOptions.reduce((found, option) => {
    const matcherWithTemplateReplaced = micromatchPatternReplacingObjectsValues(
      option,
      elementsCapturedValues,
    );
    if (micromatch.some(specifiers, matcherWithTemplateReplaced)) {
      found.push(option);
    }
    return found;
  }, []);
}

function pathMatch(path, pathOptions, elementsCapturedValues) {
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
  dependency,
  matcher,
  options,
  elementsCapturedValues,
  importKind,
) {
  const matcherWithTemplatesReplaced = micromatchPatternReplacingObjectsValues(
    matcher,
    elementsCapturedValues,
  );
  if (!isMatchImportKind(dependency, importKind)) {
    return { result: false };
  }
  const isMatch = micromatch.isMatch(dependency.baseModule, matcherWithTemplatesReplaced);
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

function elementRulesAllowExternalDependency(element, dependency, options) {
  return elementRulesAllowDependency({
    element,
    dependency,
    options,
    isMatch: isMatchExternalDependency,
  });
}

function getErrorReportMessage(report) {
  if (report.path) {
    return report.path;
  }
  return report.specifiers.join(", ");
}

function errorMessage(ruleData, file, dependency) {
  const ruleReport = ruleData.ruleReport;
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
  return `Usage of ${dependencyUsageKindMessage(ruleReport.importKind, dependency, {
    suffix: " from ",
  })}external module '${dependency.baseModule}' ${fileReport}`;
}

module.exports = dependencyRule(
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

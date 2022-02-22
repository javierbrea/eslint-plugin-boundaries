const micromatch = require("micromatch");

const { RULE_EXTERNAL } = require("../constants/settings");

const dependencyRule = require("../rules-factories/dependency-rule");

const { rulesOptionsSchema } = require("../helpers/validations");
const { dependencyLocation, elementRulesAllowDependency } = require("../helpers/rules");
const { customErrorMessage, ruleElementMessage, elementMessage } = require("../helpers/messages");

function specifiersMatch(specifiers, options) {
  const importedSpecifiersNames = specifiers
    .filter((specifier) => {
      return specifier.type === "ImportSpecifier" && specifier.imported.name;
    })
    .map((specifier) => specifier.imported.name);
  return options.reduce((found, option) => {
    if (micromatch.some(importedSpecifiersNames, option)) {
      found.push(option);
    }
    return found;
  }, []);
}

function isMatchExternalDependency(dependency, matcher, options) {
  const isMatch = micromatch.isMatch(dependency.baseModule, matcher);
  if (isMatch && options) {
    const specifiersResult = specifiersMatch(dependency.specifiers, options.specifiers);
    return {
      result: specifiersResult.length > 0,
      report: specifiersResult,
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

function errorMessage(ruleData, file, dependency) {
  const ruleReport = ruleData.ruleReport;
  if (ruleReport.message) {
    return customErrorMessage(ruleReport.message, file, dependency, {
      specifiers: ruleData.report && ruleData.report.join(", "),
    });
  }
  if (ruleReport.isDefault) {
    return `No rule allows the usage of external module '${
      dependency.baseModule
    }' in elements ${elementMessage(file)}`;
  }

  const fileReport = `is not allowed in ${ruleElementMessage(
    ruleReport.element,
    file.capturedValues
  )}. Disallowed in rule ${ruleReport.index + 1}`;

  if (ruleData.report) {
    return `Usage of '${ruleData.report.join(", ")}' from external module '${
      dependency.baseModule
    }' ${fileReport}`;
  }
  return `Usage of external module '${dependency.baseModule}' ${fileReport}`;
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
        },
        additionalProperties: false,
      },
    }),
  },
  function ({ dependency, file, node, context, options }) {
    if (dependency.isExternal) {
      const ruleData = elementRulesAllowExternalDependency(
        file,
        { ...dependency, specifiers: node.source.parent.specifiers },
        options
      );
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
    validateRules: { onlyMainKey: true },
  }
);

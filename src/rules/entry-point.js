const { ENTRY_POINT } = require("../constants/settings");

const { fileInfo } = require("../core/elementsInfo");
const { dependencyInfo } = require("../core/dependencyInfo");

const { validateSettings, rulesOptionsSchema, validateRules } = require("../helpers/validations");
const {
  meta2,
  dependencyLocation,
  elementRulesAllowDependency,
  isMatchElementKey,
} = require("../helpers/rules");

function isMatchElementInternalPath(elementInfo, matcher, options) {
  return isMatchElementKey(elementInfo, matcher, options, "internalPath");
}

function elementRulesAllowEntryPoint(element, dependency, options) {
  return elementRulesAllowDependency({
    element: dependency,
    dependency,
    options,
    isMatch: isMatchElementInternalPath,
    rulesMainKey: "target",
  }).result;
}

module.exports = {
  ...meta2({
    ruleName: ENTRY_POINT,
    description: `Check entry point used for each element type`,
    schema: rulesOptionsSchema({
      rulesMainKey: "target",
    }),
  }),

  create: function (context) {
    const options = context.options[0];
    const file = fileInfo(context);
    if (!options || file.isIgnored || !file.type) {
      return {};
    }

    validateRules(options.rules, context.settings, { onlyMainKey: true, mainKey: "target" });
    validateSettings(context.settings);

    return {
      ImportDeclaration: (node) => {
        const dependency = dependencyInfo(node.source.value, context);

        if (
          !dependency.isIgnored &&
          dependency.type &&
          !dependency.isInternal &&
          !elementRulesAllowEntryPoint(file, dependency, options)
        ) {
          context.report({
            message: `Entry point '${dependency.internalPath}' is not allowed in '${dependency.type}'`,
            node: node,
            ...dependencyLocation(node, context),
          });
        }
      },
    };
  },
};

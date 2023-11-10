const { ADDITIONAL_DEPENDENCY_NODES } = require("../constants/settings");
const { fileInfo } = require("../core/elementsInfo");
const { dependencyInfo } = require("../core/dependencyInfo");

const { validateSettings, validateRules } = require("../helpers/validations");

const { meta } = require("../helpers/rules");

module.exports = function (ruleMeta, rule, ruleOptions = {}) {
  return {
    ...meta(ruleMeta),
    create: function (context) {
      const options = context.options[0];
      validateSettings(context.settings);
      const file = fileInfo(context);
      if ((ruleOptions.validate !== false && !options) || file.isIgnored || !file.type) {
        return {};
      }
      if (ruleOptions.validate !== false) {
        validateRules(context.settings, options.rules, ruleOptions.validateRules);
      }
      const dependencyNodes = [
        { selector: "ImportDeclaration:not([importKind=type]) > Literal", kind: "value" },
        { selector: "ImportDeclaration[importKind=type] > Literal", kind: "type" },
        ...(context.settings[ADDITIONAL_DEPENDENCY_NODES] ?? []),
      ];

      return dependencyNodes.reduce((visitors, { selector, kind = "value" }) => {
        visitors[selector] = (node) => {
          const dependency = dependencyInfo(node.value, kind, context);

          rule({ file, dependency, options, node, context });
        };

        return visitors;
      }, {});
    },
  };
};

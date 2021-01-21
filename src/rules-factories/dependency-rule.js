const { fileInfo } = require("../core/elementsInfo");
const { dependencyInfo } = require("../core/dependencyInfo");

const { validateSettings, validateRules } = require("../helpers/validations");

const { meta } = require("../helpers/rules");

module.exports = function (ruleDescription, rule, ruleOptions = {}) {
  return {
    ...meta(ruleDescription),
    create: function (context) {
      const options = context.options[0];
      const file = fileInfo(context);
      if ((ruleOptions.validate !== false && !options) || file.isIgnored || !file.type) {
        return {};
      }
      if (ruleOptions.validate !== false) {
        validateRules(options.rules, context.settings, ruleOptions.validateRules);
      }
      validateSettings(context.settings);

      return {
        ImportDeclaration: (node) => {
          const dependency = dependencyInfo(node.source.value, context);

          rule({ file, dependency, options, node, context });
        },
      };
    },
  };
};

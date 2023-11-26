const {
  ADDITIONAL_DEPENDENCY_NODES,
  PREDEFINED_DEPENDENCY_NODES,
} = require("../constants/settings");
const { isArray, isString } = require("../helpers/utils");
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

      const additionalDependencyNodesSetting = context.settings[ADDITIONAL_DEPENDENCY_NODES];
      const additionalDependencyNodes = (
        isArray(additionalDependencyNodesSetting) ? additionalDependencyNodesSetting : []
      ).map((dependencyNode) => {
        if (isString(dependencyNode)) {
          return PREDEFINED_DEPENDENCY_NODES[dependencyNode];
        }

        return dependencyNode;
      });

      const dependencyNodes = [PREDEFINED_DEPENDENCY_NODES.import, ...additionalDependencyNodes]
        .flat()
        .filter(Boolean);

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

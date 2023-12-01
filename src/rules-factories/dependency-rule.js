const {
  DEPENDENCY_NODES,
  DEFAULT_DEPENDENCY_NODES,
  ADDITIONAL_DEPENDENCY_NODES,
} = require("../constants/settings");
const { getArrayOrNull } = require("../helpers/utils");
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

      const dependencyNodesSetting = getArrayOrNull(context.settings[DEPENDENCY_NODES]);
      const additionalDependencyNodesSetting = getArrayOrNull(
        context.settings[ADDITIONAL_DEPENDENCY_NODES],
      );
      const dependencyNodes = (dependencyNodesSetting || ["import"])
        .map((dependencyNode) => DEFAULT_DEPENDENCY_NODES[dependencyNode])
        .flat()
        .filter(Boolean);
      const additionalDependencyNodes = additionalDependencyNodesSetting || [];

      return [...dependencyNodes, ...additionalDependencyNodes].reduce(
        (visitors, { selector, kind }) => {
          visitors[selector] = (node) => {
            const dependency = dependencyInfo(node.value, kind, context);

            rule({ file, dependency, options, node, context });
          };

          return visitors;
        },
        {},
      );
    },
  };
};

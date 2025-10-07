import { SETTINGS } from "../constants/settings";
import { getArrayOrNull } from "../helpers/utils";
import { fileInfo } from "../core/elementsInfo";
import { dependencyInfo } from "../core/dependencyInfo";

import { validateSettings, validateRules } from "../helpers/validations";

import { meta } from "../helpers/rules";

const {
  DEPENDENCY_NODES,
  DEFAULT_DEPENDENCY_NODES,
  ADDITIONAL_DEPENDENCY_NODES,
} = SETTINGS;

export default function (ruleMeta, rule, ruleOptions = {}) {
  return {
    ...meta(ruleMeta),
    create: function (context) {
      const options = context.options[0];
      validateSettings(context.settings);
      const file = fileInfo(context);
      if (
        (ruleOptions.validate !== false && !options) ||
        file.isIgnored ||
        !file.type
      ) {
        return {};
      }
      if (ruleOptions.validate !== false) {
        validateRules(
          context.settings,
          options.rules,
          ruleOptions.validateRules,
        );
      }

      const dependencyNodesSetting = getArrayOrNull(
        context.settings[DEPENDENCY_NODES],
      );
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
}

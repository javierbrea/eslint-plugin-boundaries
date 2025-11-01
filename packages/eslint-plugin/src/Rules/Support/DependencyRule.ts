import type { Rule } from "eslint";

import { elementDescription, dependencyDescription } from "../../Elements";
import type { EslintLiteralNode } from "../../Elements";
import type {
  RuleOptionsWithRules,
  RuleOptions,
  DependencyNodeKey,
  DependencyNodeSelector,
  RuleMetaDefinition,
} from "../../Settings";
import {
  SETTINGS,
  SETTINGS_KEYS_MAP,
  DEPENDENCY_NODE_KEYS_MAP,
  validateSettings,
  validateRules,
} from "../../Settings";
import { warnOnce, getArrayOrNull, isString } from "../../Support";

import type {
  DependencyRuleRunner,
  DependencyRuleOptions,
} from "./DependencyRule.types";
import { meta } from "./Helpers";

const { DEFAULT_DEPENDENCY_NODES, ADDITIONAL_DEPENDENCY_NODES } = SETTINGS;

function optionsHaveRules(
  options?: RuleOptions
): options is RuleOptionsWithRules {
  if (!options) {
    return false;
  }
  return Boolean((options as RuleOptionsWithRules).rules);
}

export function dependencyRule<Options extends RuleOptionsWithRules>(
  ruleMeta: RuleMetaDefinition,
  rule: DependencyRuleRunner<Options>,
  ruleOptions: DependencyRuleOptions = {}
): Rule.RuleModule {
  return {
    ...meta(ruleMeta),
    create: function (context: Rule.RuleContext) {
      const options = context.options[0] as Options | undefined;
      const settings = validateSettings(context.settings);
      const file = elementDescription(context);

      if (ruleOptions.validate !== false && !options) {
        return {};
      }

      if (ruleOptions.validate !== false && optionsHaveRules(options)) {
        validateRules(settings, options.rules, ruleOptions.validateRules);
      }

      // TODO: Remove this check when allowing to select by any other property
      if (file.isIgnored || !file.type) {
        return {};
      }

      const dependencyNodesSetting = getArrayOrNull<DependencyNodeKey>(
        settings[SETTINGS_KEYS_MAP.DEPENDENCY_NODES]
      );
      const additionalDependencyNodesSetting =
        getArrayOrNull<DependencyNodeSelector>(
          settings[ADDITIONAL_DEPENDENCY_NODES]
        );
      const dependencyNodes: DependencyNodeSelector[] =
        // TODO In next major version, make this default to all types of nodes!!!
        (dependencyNodesSetting || [DEPENDENCY_NODE_KEYS_MAP.IMPORT])
          .map((dependencyNode) => DEFAULT_DEPENDENCY_NODES[dependencyNode])
          .flat()
          .filter(Boolean);

      const additionalDependencyNodes = additionalDependencyNodesSetting || [];

      return [...dependencyNodes, ...additionalDependencyNodes].reduce(
        (visitors, { selector, kind, name }) => {
          visitors[selector] = (node: EslintLiteralNode) => {
            if (!isString(node.value)) {
              warnOnce(
                `Dependency node is not a Literal, skipping node. Please check your ${ADDITIONAL_DEPENDENCY_NODES} setting.`
              );
              return;
            }
            const dependency = dependencyDescription(
              {
                node,
                kind,
                nodeKind: name,
              },
              context
            );

            rule({ dependency, options, node, context });
          };

          return visitors;
        },
        {} as Record<string, (node: EslintLiteralNode) => void>
      );
    },
  };
}

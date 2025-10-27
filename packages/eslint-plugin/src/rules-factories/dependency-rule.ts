import type { Rule } from "eslint";

import type {
  RuleOptionsWithRules,
  RuleOptions,
} from "../constants/Options.types";
import type {
  DependencyNodeKey,
  DependencyNodeSelector,
} from "../constants/settings";
import {
  SETTINGS,
  SETTINGS_KEYS_MAP,
  DEPENDENCY_NODE_KEYS_MAP,
} from "../constants/settings";
import { fileInfo, dependencyInfo } from "../core/elementsInfo";
import type { EslintLiteralNode } from "../core/elementsInfo.types";
import { warnOnce } from "../helpers/debug";
import { meta } from "../helpers/rules";
import type { RuleMetaDefinition } from "../helpers/Rules.types";
import { getArrayOrNull, isString } from "../helpers/utils";
import { validateSettings, validateRules } from "../helpers/validations";

import type {
  DependencyRuleRunner,
  DependencyRuleOptions,
} from "./DependencyRule.types";

const { DEFAULT_DEPENDENCY_NODES, ADDITIONAL_DEPENDENCY_NODES } = SETTINGS;

function optionsHaveRules(
  options?: RuleOptions,
): options is RuleOptionsWithRules {
  if (!options) {
    return false;
  }
  return Boolean((options as RuleOptionsWithRules).rules);
}

export default function <Options extends RuleOptionsWithRules>(
  ruleMeta: RuleMetaDefinition,
  rule: DependencyRuleRunner<Options>,
  ruleOptions: DependencyRuleOptions = {},
): Rule.RuleModule {
  return {
    ...meta(ruleMeta),
    create: function (context: Rule.RuleContext) {
      const options = context.options[0] as Options | undefined;
      const settings = validateSettings(context.settings);
      const file = fileInfo(context);
      if (
        (ruleOptions.validate !== false && !options) ||
        file.isIgnored ||
        !file.type
      ) {
        return {};
      }
      if (ruleOptions.validate !== false && optionsHaveRules(options)) {
        validateRules(settings, options.rules, ruleOptions.validateRules);
      }

      const dependencyNodesSetting = getArrayOrNull<DependencyNodeKey>(
        settings[SETTINGS_KEYS_MAP.DEPENDENCY_NODES],
      );
      const additionalDependencyNodesSetting =
        getArrayOrNull<DependencyNodeSelector>(
          settings[ADDITIONAL_DEPENDENCY_NODES],
        );
      const dependencyNodes: DependencyNodeSelector[] =
        // TODO In next major version, make this default to all types of nodes !!! Support giving them names to be able to use them in selectors.
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
                `Dependency node is not a Literal, skipping node. Please check your ${ADDITIONAL_DEPENDENCY_NODES} setting.`,
              );
              return;
            }
            const dependency = dependencyInfo(
              {
                node,
                kind,
                nodeKind: name,
              },
              context,
            );

            rule({ file, dependency, options, node, context });
          };

          return visitors;
        },
        {} as Record<
          string,
          (
            // TODO: Define interface
            // eslint-disable-next-line no-unused-vars
            node: EslintLiteralNode,
          ) => void
        >,
      );
    },
  };
}

import type { Rule } from "eslint";

import { elementDescription, dependencyDescription } from "../../Elements";
import type { EslintLiteralNode } from "../../Elements";
import type {
  RuleOptionsWithRules,
  RuleOptions,
  RuleMetaDefinition,
} from "../../Settings";
import { SETTINGS, validateRules, getSettings } from "../../Settings";
import { warnOnce, isString } from "../../Support";

import type {
  DependencyRuleRunner,
  DependencyRuleOptions,
} from "./DependencyRule.types";
import { meta } from "./Helpers";

const { ADDITIONAL_DEPENDENCY_NODES } = SETTINGS;

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
      const settings = getSettings(context);
      const file = elementDescription(context.filename, settings);

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

      return settings.dependencyNodes.reduce(
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
              context.filename,
              settings,
              context
            );

            rule({ dependency, options, node, context, settings });
          };

          return visitors;
        },
        {} as Record<string, (node: EslintLiteralNode) => void>
      );
    },
  };
}

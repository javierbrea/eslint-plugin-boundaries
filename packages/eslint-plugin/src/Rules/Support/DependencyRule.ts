import type { Rule } from "eslint";

import { warnOnce } from "../../Debug";
import { elementDescription, dependencyDescription } from "../../Elements";
import type { EslintLiteralNode } from "../../Elements";
import type { RuleOptionsWithRules, RuleMetaDefinition } from "../../Settings";
import { SETTINGS, getSettings, moreInfoSettingsLink } from "../../Settings";
import { isString } from "../../Shared";

import type {
  DependencyRuleRunner,
  DependencyRuleOptions,
} from "./DependencyRule.types";
import { meta } from "./Helpers";

const { ADDITIONAL_DEPENDENCY_NODES } = SETTINGS;

/**
 * Creates a rule module that evaluates dependency nodes using shared matcher logic.
 *
 * @param ruleMeta - Metadata used to build ESLint rule `meta` information.
 * @param rule - Rule runner invoked for each described dependency.
 * @param ruleOptions - Optional behavior flags for validation and rule shape.
 * @returns ESLint rule module ready to be exported by concrete rules.
 */
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

      if (file.isIgnored || file.isUnknown) {
        return {};
      }

      return settings.dependencyNodes.reduce(
        (visitors, { selector, kind, name }) => {
          visitors[selector] = (node: EslintLiteralNode) => {
            if (!isString(node.value)) {
              warnOnce(
                `Dependency node is not a Literal, skipping node.`,
                `Please check your ${ADDITIONAL_DEPENDENCY_NODES} setting. ${moreInfoSettingsLink()}`
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

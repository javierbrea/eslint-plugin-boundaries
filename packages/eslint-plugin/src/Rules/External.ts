import {
  isExternalDependencyElement,
  isCoreDependencyElement,
  ELEMENT_ORIGINS_MAP,
} from "@boundaries/elements";
import type { ExternalLibrariesSelector } from "@boundaries/elements";

import type { ExternalRuleOptions, ExternalRule } from "../Settings";
import {
  rulesOptionsSchema,
  validateAndWarnRuleOptions,
  SETTINGS,
  RULE_NAMES_MAP,
} from "../Settings";
import { isString, isArray } from "../Support";

import { evaluateRulesAndReport } from "./ElementTypes";
import { dependencyRule } from "./Support";

const { RULE_EXTERNAL } = SETTINGS;

function modifySelectors(selectors: ExternalLibrariesSelector): unknown {
  const originsToMatch = [
    ELEMENT_ORIGINS_MAP.EXTERNAL,
    ELEMENT_ORIGINS_MAP.CORE,
  ];
  if (isString(selectors)) {
    return {
      to: {
        origin: originsToMatch,
      },
      dependency: {
        module: selectors,
      },
    };
  }
  return selectors.map((selector) => {
    if (isArray(selector)) {
      return {
        to: {
          origin: originsToMatch,
          internalPath: selector[1].path,
        },
        dependency: {
          module: selector[0],
          ...(selector[1].specifiers
            ? {
                specifiers: selector[1].specifiers,
              }
            : {}),
        },
      };
    }
    return {
      to: { origin: originsToMatch },
      dependency: {
        module: selector as string,
      },
    };
  });
}

function modifyRules(rules: ExternalRule[]): Record<string, unknown>[] {
  return rules.map((rule) => ({
    from: rule.from,
    allow: rule.allow ? modifySelectors(rule.allow) : undefined,
    disallow: rule.disallow ? modifySelectors(rule.disallow) : undefined,
    importKind: rule.importKind,
    message: rule.message,
  }));
}

export default dependencyRule<ExternalRuleOptions>(
  {
    ruleName: RULE_EXTERNAL,
    description: `Check dependencies to external and core libraries`,
    schema: rulesOptionsSchema({
      targetMatcherOptions: {
        type: "object",
        properties: {
          specifiers: {
            type: "array",
            items: {
              type: "string",
            },
          },
          path: {
            oneOf: [
              {
                type: "string",
              },
              {
                type: "array",
                items: {
                  type: "string",
                },
              },
            ],
          },
        },
        additionalProperties: false,
      },
    }),
  },
  function ({ dependency, node, context, settings, options }) {
    // Validate and warn about legacy selector syntax
    validateAndWarnRuleOptions(options, "from", RULE_NAMES_MAP.EXTERNAL);

    if (
      isExternalDependencyElement(dependency.to) ||
      isCoreDependencyElement(dependency.to)
    ) {
      const rules = modifyRules(options?.rules ?? []);
      evaluateRulesAndReport({
        rules,
        settings,
        context,
        node,
        options,
        dependency,
      });
    }
  },
  {
    validateRules: { onlyMainKey: true },
  }
);

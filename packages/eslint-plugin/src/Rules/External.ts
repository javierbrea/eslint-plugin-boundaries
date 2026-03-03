import {
  isExternalDependencyElement,
  isCoreDependencyElement,
  ELEMENT_ORIGINS_MAP,
} from "@boundaries/elements";
import type { DependencySelector } from "@boundaries/elements";

import type {
  ExternalRuleOptions,
  ExternalRule,
  ElementTypesRule,
  ExternalLibrariesSelector,
  ExternalLibrarySelectorWithOptions,
} from "../Settings";
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

function isExternalLibrarySelectorWithOptions(
  selector: ExternalLibrariesSelector
): selector is ExternalLibrarySelectorWithOptions {
  return (
    isArray(selector) &&
    selector.length === 2 &&
    isString(selector[0]) &&
    typeof selector[1] === "object" &&
    selector[1] !== null
  );
}

function modifySelectors(
  selectors: ExternalLibrariesSelector
): DependencySelector | DependencySelector[] {
  const originsToMatch = [
    ELEMENT_ORIGINS_MAP.EXTERNAL,
    ELEMENT_ORIGINS_MAP.CORE,
  ];
  if (isExternalLibrarySelectorWithOptions(selectors)) {
    const selectorOptions = selectors[1];
    const moduleSelector = selectors[0];
    return {
      to: {
        origin: originsToMatch,
        internalPath: selectorOptions.path,
      },
      dependency: {
        module: moduleSelector,
        ...(selectorOptions.specifiers
          ? {
              specifiers: selectorOptions.specifiers,
            }
          : {}),
      },
    };
  }
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
      const selectorOptions = selector[1];
      const moduleSelector = selector[0];
      return {
        to: {
          origin: originsToMatch,
          internalPath: selectorOptions.path,
        },
        dependency: {
          module: moduleSelector,
          ...(selectorOptions.specifiers
            ? {
                specifiers: selectorOptions.specifiers,
              }
            : {}),
        },
      };
    }
    return {
      to: { origin: originsToMatch },
      dependency: {
        module: selector,
      },
    };
  });
}

function transformToElementTypesRules(
  rules: ExternalRule[]
): ElementTypesRule[] {
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
      const rules = transformToElementTypesRules(options?.rules ?? []);
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

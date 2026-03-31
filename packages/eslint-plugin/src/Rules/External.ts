import { ORIGINS_MAP } from "@boundaries/elements";
import type {
  DependencySelector,
  DependencySingleSelector,
} from "@boundaries/elements";

import { rulesOptionsSchema, warnMigrationToDependencies } from "../Settings";
import type {
  ExternalRuleOptions,
  ExternalRule,
  DependenciesRule,
  ExternalLibrariesSelector,
  ExternalLibrarySelectorWithOptions,
} from "../Shared";
import {
  isString,
  isArray,
  isObject,
  isNullish,
  SETTINGS,
  RULE_NAMES_MAP,
} from "../Shared";

import { evaluateRulesAndReport } from "./Dependencies";
import { dependencyRule } from "./Support";

const { RULE_EXTERNAL } = SETTINGS;

/**
 * Type guard for external selectors using tuple syntax with options.
 *
 * @param selector - External library selector from rule options.
 * @returns `true` when selector is `[module, options]`.
 */
function isExternalLibrarySelectorWithOptions(
  selector: ExternalLibrariesSelector
): selector is ExternalLibrarySelectorWithOptions {
  return (
    isArray(selector) &&
    selector.length === 2 &&
    isString(selector[0]) &&
    isObject(selector[1])
  );
}

/**
 * Builds a dependency selector from a legacy external selector using tuple syntax with options.
 * @param selector The external library selector in legacy format with options.
 * @returns The corresponding dependency selector compatible with `dependencies` rule evaluator.
 */
function buildSelectorFromLegacySelectorWithOptions(
  selector: ExternalLibrarySelectorWithOptions
): DependencySingleSelector {
  const moduleSelector = selector[0];
  const selectorOptions = selector[1];
  const hasPathSelector = !isNullish(selectorOptions.path);
  return {
    to: {
      origin: {
        kind: [ORIGINS_MAP.EXTERNAL, ORIGINS_MAP.CORE],
        module: moduleSelector,
      },
      ...(hasPathSelector ? { internalPath: selectorOptions.path } : {}),
    },
    dependency: {
      ...(selectorOptions.specifiers
        ? {
            specifiers: selectorOptions.specifiers,
          }
        : {}),
    },
  };
}

/**
 * Transforms legacy external selectors into dependency selectors.
 *
 * @param selectors - External selector(s) from legacy rule format.
 * @returns Dependency selector(s) compatible with `dependencies` rule evaluator.
 */
function modifySelectors(
  selectors: ExternalLibrariesSelector
): DependencySelector {
  const originsToMatch = [ORIGINS_MAP.EXTERNAL, ORIGINS_MAP.CORE];
  if (isExternalLibrarySelectorWithOptions(selectors)) {
    return buildSelectorFromLegacySelectorWithOptions(selectors);
  }
  if (isString(selectors)) {
    return {
      to: {
        origin: {
          kind: originsToMatch,
          module: selectors,
        },
      },
    };
  }
  return selectors.map((selector) => {
    if (isExternalLibrarySelectorWithOptions(selector)) {
      return buildSelectorFromLegacySelectorWithOptions(selector);
    }
    return {
      to: { origin: { kind: originsToMatch, module: selector } },
    };
  });
}

/**
 * Converts `external` legacy rules to `dependencies` rule shape.
 *
 * @param rules - External rules as configured by the user.
 * @returns Equivalent dependencies rules consumed by shared evaluator.
 */
function transformToDependenciesRules(
  rules: ExternalRule[]
): DependenciesRule[] {
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
      isLegacy: true,
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
            anyOf: [
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
    warnMigrationToDependencies(RULE_NAMES_MAP.EXTERNAL);
    // Validate and warn about legacy selector syntax
    // TODO: validate and warn about legacy usage
    // validateAndWarnRuleOptions(options, RULE_NAMES_MAP.EXTERNAL, "from");

    const origin = dependency.to.origin.kind;
    if (origin === ORIGINS_MAP.EXTERNAL || origin === ORIGINS_MAP.CORE) {
      const rules = transformToDependenciesRules(options?.rules ?? []);
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

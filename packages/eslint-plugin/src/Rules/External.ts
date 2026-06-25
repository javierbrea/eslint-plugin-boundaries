import { ORIGINS_MAP } from "@boundaries/elements";
import type {
  DependencyInfoSelector,
  DependencySelector,
  DependencySingleSelector,
  ModuleSingleSelector,
} from "@boundaries/elements";

import {
  rulesOptionsSchema,
  warnMigrationToDependencies,
  validateAndWarnRuleOptions,
} from "../Settings";
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
 * Strips the leading slash from a path so it matches the normalized `module.internalPath`
 * value exposed by the elements package.
 *
 * @param path The raw path option supplied by the user.
 * @returns The path without a leading slash, or the original value when not a string.
 */
function normalizeInternalPath<T>(path: T): T {
  if (isString(path) && path.startsWith("/")) {
    return path.slice(1) as T;
  }
  return path;
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
  const dependencyInfoSelector: DependencyInfoSelector = {};
  const moduleSingleSelector: ModuleSingleSelector = {
    origin: [ORIGINS_MAP.EXTERNAL, ORIGINS_MAP.CORE],
    source: moduleSelector,
  };

  if (selectorOptions.specifiers) {
    dependencyInfoSelector.specifiers = selectorOptions.specifiers;
  }
  if (selectorOptions.path) {
    moduleSingleSelector.internalPath = isString(selectorOptions.path)
      ? normalizeInternalPath(selectorOptions.path)
      : selectorOptions.path.map(normalizeInternalPath);
  }

  const result: DependencySingleSelector = {
    to: {
      module: moduleSingleSelector,
    },
  };
  if (dependencyInfoSelector.specifiers) {
    result.dependency = dependencyInfoSelector;
  }
  return result;
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
        module: {
          origin: originsToMatch,
          source: selectors,
        },
      },
    };
  }
  return selectors.map((selector) => {
    if (isExternalLibrarySelectorWithOptions(selector)) {
      return buildSelectorFromLegacySelectorWithOptions(selector);
    }
    return {
      to: { module: { origin: originsToMatch, source: selector } },
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
    // Validate and warn about deprecated rule option syntax (legacy
    // selectors, legacy templates, and rule-level importKind).
    validateAndWarnRuleOptions(
      options,
      RULE_NAMES_MAP.EXTERNAL,
      settings.disableLegacyWarnings
    );

    const origin = dependency.to.module.origin;
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

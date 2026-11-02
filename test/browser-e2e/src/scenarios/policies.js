import { normalizeConfig } from "@boundaries/config";
import {
  describeDependency,
  describeEntity,
  evaluateDependency,
} from "@boundaries/policies";

import {
  QUICK_START_FILES,
  QUICK_START_RULES,
  QUICK_START_SETTINGS,
} from "./quick-start.js";

/** @typedef {import("./index.js").Scenario} Scenario */

/**
 * The root path of the quick-start project in these scenarios.
 */
const ROOT_PATH = "/repo";

/**
 * A dependencies rule with a custom message template, which Handlebars renders.
 */
const RULES_WITH_CUSTOM_MESSAGE = {
  "boundaries/dependencies": [
    2,
    {
      policies: [
        {
          disallow: { to: { file: { categories: "test" } } },
          message:
            "Do not import test files from {{ from.element.types.[0] }}s",
        },
      ],
    },
  ],
};

/**
 * Normalizes the quick-start settings with some rules.
 * @param {Record<string, unknown>} rules The rules of the configuration.
 * @returns {{ settings: import("@boundaries/config").SettingsNormalized, options: import("@boundaries/config").DependenciesRuleOptionsNormalized }} The normalized settings and options of the dependencies rule.
 */
function getConfig(rules) {
  const { settings, rules: normalizedRules } = normalizeConfig(
    { settings: QUICK_START_SETTINGS, rules },
    { rootPath: ROOT_PATH }
  ).value;
  if (!normalizedRules.dependencies) {
    throw new Error("The rules have no dependencies rule");
  }
  return { settings, options: normalizedRules.dependencies.options };
}

/**
 * Describes and evaluates a dependency of the quick-start project, as the dependencies rule does.
 * @param {{ from: string, to?: string, source: string }} dependency The paths of the files, relative to the root, and the source as written.
 * @param {Record<string, unknown>} [rules] The rules of the configuration, the quick-start ones by default.
 * @returns {unknown} The evaluation of the dependency.
 */
function evaluate({ from, to, source }, rules = QUICK_START_RULES) {
  const { settings, options } = getConfig(rules);
  const description = describeDependency(settings, {
    from: `${ROOT_PATH}/${from}`,
    to: to && `${ROOT_PATH}/${to}`,
    source,
    kind: "value",
    nodeKind: "import",
    specifiers: [],
  });
  return evaluateDependency(settings, options, description);
}

/**
 * Scenarios of `@boundaries/policies`: the files and dependencies of the quick-start example of the docs.
 * @type {Scenario[]}
 */
export const POLICIES_SCENARIOS = [
  {
    name: "policies: describeEntity of the quick-start files",
    run: () => {
      const { settings } = getConfig(QUICK_START_RULES);
      return QUICK_START_FILES.map((filePath) =>
        describeEntity(settings, `${ROOT_PATH}/${filePath}`)
      );
    },
  },
  {
    name: "policies: evaluateDependency of a helper importing a component",
    run: () =>
      evaluate({
        from: "src/helpers/format/index.js",
        to: "src/components/atoms/Button/index.js",
        source: "../../components/atoms/Button",
      }),
  },
  {
    name: "policies: evaluateDependency of a component importing a helper",
    run: () =>
      evaluate({
        from: "src/components/atoms/Button/index.js",
        to: "src/helpers/format/index.js",
        source: "../../../helpers/format",
      }),
  },
  {
    name: "policies: evaluateDependency of a test file import with a custom message template",
    run: () =>
      evaluate(
        {
          from: "src/modules/checkout/index.js",
          to: "src/components/atoms/Button/Button.spec.js",
          source: "../../components/atoms/Button/Button.spec",
        },
        RULES_WITH_CUSTOM_MESSAGE
      ),
  },
  {
    name: "policies: evaluateDependency of an external dependency that the rule skips",
    run: () =>
      evaluate({
        from: "src/components/atoms/Button/index.js",
        source: "react",
      }),
  },
];

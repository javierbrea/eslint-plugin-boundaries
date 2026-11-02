import {
  getRuleOptionsSchema,
  normalizeConfig,
  validateRuleOptions,
} from "@boundaries/config";

import { QUICK_START_RULES, QUICK_START_SETTINGS } from "./quick-start.js";

/** @typedef {import("./index.js").Scenario} Scenario */

/**
 * A configuration with an invalid element descriptor and a deprecated selector.
 */
const CONFIG_WITH_PROBLEMS = {
  settings: {
    "boundaries/elements": [
      { type: "helper", pattern: "helpers/*" },
      { pattern: "components/*" },
    ],
  },
  rules: {
    "boundaries/dependencies": [
      2,
      {
        policies: [
          { from: "helper", allow: { to: { element: { type: "helper" } } } },
        ],
      },
    ],
    "boundaries/no-private": [2, { allowUncles: "yes" }],
  },
};

/**
 * Scenarios of `@boundaries/config`: the quick-start example of the docs, and the cases of its own browser build check.
 * @type {Scenario[]}
 */
export const CONFIG_SCENARIOS = [
  {
    name: "config: normalizeConfig of the quick-start example",
    run: () =>
      normalizeConfig({
        settings: QUICK_START_SETTINGS,
        rules: QUICK_START_RULES,
      }),
  },
  {
    name: "config: normalizeConfig with an invalid element descriptor and a deprecated selector",
    run: () => normalizeConfig(CONFIG_WITH_PROBLEMS, { rootPath: "/repo" }),
  },
  {
    name: "config: validateRuleOptions with legacy warnings",
    run: () =>
      validateRuleOptions(
        "boundaries/dependencies",
        { policies: [{ allow: "*", importKind: 2 }], unknownOption: true },
        { legacyWarnings: true }
      ),
  },
  {
    name: "config: getRuleOptionsSchema",
    run: () => getRuleOptionsSchema("boundaries/external"),
  },
];

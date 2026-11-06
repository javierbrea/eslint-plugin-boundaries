import type { QuickStartMessage } from "./quickStartVerdicts.types";

/**
 * The statements of the nine dependencies of the quick-start project, by file and in the order of the `text` state of the mockup, one per line: the line of a message is the index of its dependency in the file plus one. A file that is not here (`src/components/atoms/Button/Button.css` and the config) has no dependencies. It is data only: the engine spec checks that the dependencies of the example write these statements, and that their verdicts are the ones of `QUICK_START_MESSAGES`.
 */
export const QUICK_START_STATEMENTS: Readonly<
  Record<string, readonly string[]>
> = {
  "src/components/atoms/Button/Button.spec.js": [
    'import { Button } from "./index";',
  ],
  "src/components/atoms/Button/index.js": [
    'import { format } from "../../../helpers/format";',
    'import "./Button.css";',
  ],
  "src/helpers/format/index.js": [
    'import { Button } from "../../components/atoms/Button";',
  ],
  "src/modules/checkout/index.js": [
    'import { Button } from "../../components/atoms/Button";',
    'import { format } from "../../helpers/format";',
    'import { renderButton } from "../../components/atoms/Button/Button.spec";',
    'import React from "react";',
  ],
  "src/index.js": ['import "./modules/checkout";'],
};

/**
 * What ESLint reports when it lints the statements of `QUICK_START_STATEMENTS` with the plugin and the config of the quick-start example: the six files of `QUICK_START_FILES` in `test/browser-e2e/src/scenarios/quick-start.js`, with the settings and the rule of `QUICK_START_SETTINGS` and `QUICK_START_RULES` in the same file. It is data only: the engine spec checks that the disallowed dependencies of `evaluate`, their lines and their messages are these, and that every other dependency is allowed or not checked. The messages are sorted by path and line.
 *
 * Captured on 2026-11-06 with `@boundaries/eslint-plugin` 7.4.2, from the workspace build at `packages/eslint-plugin/dist`, and ESLint 9.39.5. To capture it again, create the six files of `QUICK_START_FILES` in an empty folder, with the statements of `QUICK_START_STATEMENTS` in their files, one per line and in that order, and `Button.css` empty. Lint the five JavaScript files with the `ESLint` class of the workspace (`new ESLint({ cwd: <the folder>, overrideConfigFile: true, overrideConfig: [...] })`, with `FORCE_COLOR=0`), with a flat config whose `files` match every JavaScript file of the project, whose `plugins` has the workspace build of the plugin as `boundaries`, and whose `settings` and `rules` are `QUICK_START_SETTINGS` and `QUICK_START_RULES`. `react` is not installed, as in the playground, where it is an external module. For each message of `result.messages` of each result, copy the path of `result.filePath` from the root of the folder, and the `line`, `ruleId`, `severity` and `message` of the message, and sort them by path and line.
 */
export const QUICK_START_MESSAGES: readonly QuickStartMessage[] = [
  {
    path: "src/helpers/format/index.js",
    line: 1,
    ruleId: "boundaries/dependencies",
    severity: 2,
    message:
      'There is no policy allowing dependencies from elements of type "helper" to elements of type "component"',
  },
  {
    path: "src/modules/checkout/index.js",
    line: 3,
    ruleId: "boundaries/dependencies",
    severity: 2,
    message:
      'Dependencies to file of category "test" are not allowed. Denied by policy at index 2',
  },
];

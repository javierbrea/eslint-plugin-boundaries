import type { ExampleMessage } from "./exampleVerdicts.types";

/**
 * The statements of the six dependencies of the overview project, by file and in the order of the example, one per line: the line of a message is the index of its dependency in the file plus one. A file that is not here has no dependencies. It is data only: `overviewVerdicts.spec.ts` checks that the dependencies of the example write these statements, and that their verdicts are the ones of `OVERVIEW_MESSAGES`.
 */
export const OVERVIEW_STATEMENTS: Readonly<Record<string, readonly string[]>> =
  {
    "src/controllers/controller-a/index.js": [
      'import { ModelA } from "../../models/model-a/index.js";',
      'import { ViewA } from "../../views/view-a/index.js";',
    ],
    "src/models/model-a/index.js": [
      'import View from "../../views/view-a/index.js";',
      'import axios from "axios";',
    ],
    "src/views/view-a/index.js": [
      'import { ModelA } from "../../models/model-a/index.js";',
      'import { createModel } from "../../models/model-a/model-a.spec.js";',
    ],
  };

/**
 * What ESLint reports when it lints the statements of `OVERVIEW_STATEMENTS` with the plugin and the config of the overview example: the four files of its tree, with the settings and the rule of its config. It is data only: `overviewVerdicts.spec.ts` checks that the disallowed dependencies of `evaluate`, their lines and their messages are these, and that every other dependency is allowed. The messages are sorted by path and line.
 *
 * Captured on 2026-11-08, with `@boundaries/eslint-plugin` 7.4.2, from the workspace build at `packages/eslint-plugin/dist`, and ESLint 9.39.5. The same three messages came out under three settings of `import/resolver`: none, `{ node: {} }` and `{ typescript: {} }`. A control run with an unknown resolver reported `Resolve error: unable to load resolver` and another message, so the setting is read. To capture it again, create the four files of the tree of the example in an empty folder, with the statements of `OVERVIEW_STATEMENTS` in their files, one per line and in that order, and the other files empty. Make that folder the working directory of the process before creating the `ESLint` class of the workspace, because the plugin matches the patterns of the file descriptors from the working directory. Lint the files with `new ESLint({ cwd: <the folder>, overrideConfigFile: true, overrideConfig: [...] })`, with `FORCE_COLOR=0`, with a flat config whose `files` match every JavaScript file of the project, whose `plugins` has the workspace build of the plugin as `boundaries`, and whose `settings` and `rules` are the ones of the config of the example. `axios` is not installed, as in the playground, where it is an external module. For each message of `result.messages` of each result, copy the path of `result.filePath` from the root of the folder, and the `line`, `ruleId`, `severity` and `message` of the message, and sort them by path and line.
 */
export const OVERVIEW_MESSAGES: readonly ExampleMessage[] = [
  {
    path: "src/models/model-a/index.js",
    line: 1,
    ruleId: "boundaries/dependencies",
    severity: 2,
    message:
      'There is no policy allowing dependencies from elements of type "model" to elements of type "view"',
  },
  {
    path: "src/models/model-a/index.js",
    line: 2,
    ruleId: "boundaries/dependencies",
    severity: 2,
    message:
      'Dependencies with module source "axios" to entities of module with origin "external" are not allowed in elements of type "model". Denied by policy at index 3',
  },
  {
    path: "src/views/view-a/index.js",
    line: 2,
    ruleId: "boundaries/dependencies",
    severity: 2,
    message:
      'Dependencies to file of category "test" are not allowed. Denied by policy at index 2',
  },
];

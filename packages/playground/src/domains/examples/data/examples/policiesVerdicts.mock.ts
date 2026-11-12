import type { ExampleMessage } from "./exampleVerdicts.types";

/**
 * The statements of the ten dependencies of the project of the policies page, by file and in the order of the example, one per line: the line of a message is the index of its dependency in the file plus one. A file that is not here has no dependencies. It is data only: `policiesVerdicts.spec.ts` checks that the dependencies of the example write these statements, and that their verdicts are the ones of `POLICIES_MESSAGES`.
 */
export const POLICIES_STATEMENTS: Readonly<Record<string, readonly string[]>> =
  {
    "src/components/atoms/atom-a/index.js": [
      'import AtomB from "../atom-b/index.js";',
      'import { sortAscending } from "../../../helpers/data/sort.js";',
      'import { format } from "../../../helpers/format/index.js";',
    ],
    "src/components/molecules/molecule-a/index.js": [
      'import { sortCases } from "../../../helpers/data/sort.spec.js";',
      'import AtomA from "../../atoms/atom-a/index.js";',
    ],
    "src/helpers/data/sort.js": [
      'import { format } from "../format/index.js";',
    ],
    "src/modules/checkout/index.js": [
      'import AtomA from "../../components/atoms/atom-a/index.js";',
      'import { createStore } from "redux";',
    ],
    "src/modules/page-home/index.js": [
      'import AtomA from "../../components/atoms/atom-a/index.js";',
      'import Header from "../../components/layout/header/index.js";',
    ],
  };

/**
 * What ESLint reports when it lints the statements of `POLICIES_STATEMENTS` with the plugin and the config of the policies example: the nine files of its tree, with the settings and the rule of its config. It is data only: `policiesVerdicts.spec.ts` checks that the disallowed dependencies of `evaluate`, their lines and their messages are these, and that every other dependency is allowed. The messages are sorted by path and line.
 *
 * Captured on 2026-11-08, with `@boundaries/eslint-plugin` 7.4.2, from the workspace build at `packages/eslint-plugin/dist`, and ESLint 9.39.5. The same five messages came out under three settings of `import/resolver`: none, `{ node: {} }` and `{ typescript: {} }`. A control run with an unknown resolver reported `Resolve error: unable to load resolver` and other messages, so the setting is read. To capture it again, create the nine files of the tree of the example in an empty folder, with the statements of `POLICIES_STATEMENTS` in their files, one per line and in that order, and the other files empty. Make that folder the working directory of the process before creating the `ESLint` class of the workspace, because the plugin matches the patterns of the file descriptors from the working directory. Lint the files with `new ESLint({ cwd: <the folder>, overrideConfigFile: true, overrideConfig: [...] })`, with `FORCE_COLOR=0`, with a flat config whose `files` match every JavaScript file of the project, whose `plugins` has the workspace build of the plugin as `boundaries`, and whose `settings` and `rules` are the ones of the config of the example. `redux` is not installed, as in the playground, where it is an external module. For each message of `result.messages` of each result, copy the path of `result.filePath` from the root of the folder, and the `line`, `ruleId`, `severity` and `message` of the message, and sort them by path and line.
 */
export const POLICIES_MESSAGES: readonly ExampleMessage[] = [
  {
    path: "src/components/atoms/atom-a/index.js",
    line: 2,
    ruleId: "boundaries/dependencies",
    severity: 2,
    message: "Atom components can't import data helpers",
  },
  {
    path: "src/components/atoms/atom-a/index.js",
    line: 3,
    ruleId: "boundaries/dependencies",
    severity: 2,
    message:
      'There is no policy allowing dependencies from elements of type "component" and captured values: family="atoms", elementName="atom-a" to elements of type "helper" and captured values: family="format"',
  },
  {
    path: "src/components/molecules/molecule-a/index.js",
    line: 1,
    ruleId: "boundaries/dependencies",
    severity: 2,
    message: "Do not import test files (test) from production code",
  },
  {
    path: "src/modules/checkout/index.js",
    line: 2,
    ruleId: "boundaries/dependencies",
    severity: 2,
    message: "Modules must not import redux directly",
  },
  {
    path: "src/modules/page-home/index.js",
    line: 1,
    ruleId: "boundaries/dependencies",
    severity: 2,
    message:
      "Modules with a name starting by 'page-' can only import layout components. You tried to import a component of family atoms from a module named page-home",
  },
];

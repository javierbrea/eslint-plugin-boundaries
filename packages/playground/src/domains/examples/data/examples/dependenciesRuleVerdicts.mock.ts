import type { ExampleMessage } from "./exampleVerdicts.types";

/**
 * The statements of the 14 dependencies of the project of the `boundaries/dependencies` rule page, by file and in the order of the example, one per line: the line of a message is the index of its dependency in the file plus one. A file that is not here has no dependencies. It is data only: `dependenciesRuleVerdicts.spec.ts` checks that the dependencies of the example write these statements, and that their verdicts are the ones of `DEPENDENCIES_RULE_MESSAGES`.
 */
export const DEPENDENCIES_RULE_STATEMENTS: Readonly<
  Record<string, readonly string[]>
> = {
  "src/components/atoms/atom-a/AtomA.js": [
    'import MoleculeA from "../../molecules/molecule-a/index.js";',
    'import { roleHasPermissions } from "../../../helpers/permissions/roles.js";',
    'import ModuleA from "../../../modules/module-a/index.js";',
    'import { sortDescending } from "../../../helpers/data/sort.spec.js";',
    'import AtomB from "../atom-b/index.js";',
    'import { someSorter } from "../../../helpers/data/sort.js";',
  ],
  "src/components/molecules/molecule-a/MoleculeA.js": [
    'import AtomA from "../../atoms/atom-a/index.js";',
  ],
  "src/helpers/data/sort.js": [
    'import { roleHasPermissions } from "../permissions/roles.js";',
  ],
  "src/helpers/permissions/roles.js": [
    'import AtomA from "../../components/atoms/atom-a/index.js";',
    'import ModuleA from "../../modules/module-a/index.js";',
    'import { someParser } from "../data/parse.js";',
  ],
  "src/modules/module-a/ModuleA.js": [
    'import { someParser } from "../../helpers/data/parse.js";',
    'import AtomA from "../../components/atoms/atom-a/index.js";',
    'import ModuleB from "../module-b/index.js";',
  ],
};

/**
 * What ESLint reports when it lints the statements of `DEPENDENCIES_RULE_STATEMENTS` with the plugin and the config of the example: the 16 files of its tree, with the settings and the rule of its config. It is data only: `dependenciesRuleVerdicts.spec.ts` checks that the disallowed dependencies of `evaluate`, their lines and their messages are these, and that every other dependency is allowed. The messages are sorted by path and line.
 *
 * Captured on 2026-11-08, with `@boundaries/eslint-plugin` 7.4.2, from the workspace build at `packages/eslint-plugin/dist`, and ESLint 9.39.5. The same seven messages came out under three settings of `import/resolver`: none, `{ node: {} }` and `{ typescript: {} }`. A control run with an unknown resolver reported `Resolve error: unable to load resolver` and other messages, so the setting is read. To capture it again, create the 16 files of the tree of the example in an empty folder, with the statements of `DEPENDENCIES_RULE_STATEMENTS` in their files, one per line and in that order, and the other files empty. Make that folder the working directory of the process before creating the `ESLint` class of the workspace, because the plugin matches the patterns of the file descriptors from the working directory. Lint the files with `new ESLint({ cwd: <the folder>, overrideConfigFile: true, overrideConfig: [...] })`, with `FORCE_COLOR=0`, with a flat config whose `files` match every JavaScript file of the project, whose `plugins` has the workspace build of the plugin as `boundaries`, and whose `settings` and `rules` are the ones of the config of the example. For each message of `result.messages` of each result, copy the path of `result.filePath` from the root of the folder, and the `line`, `ruleId`, `severity` and `message` of the message, and sort them by path and line.
 */
export const DEPENDENCIES_RULE_MESSAGES: readonly ExampleMessage[] = [
  {
    path: "src/components/atoms/atom-a/AtomA.js",
    line: 1,
    ruleId: "boundaries/dependencies",
    severity: 2,
    message:
      'There is no policy allowing dependencies from elements of type "component" and captured values: family="atoms", elementName="atom-a" to elements of type "component" and captured values: family="molecules", elementName="molecule-a"',
  },
  {
    path: "src/components/atoms/atom-a/AtomA.js",
    line: 2,
    ruleId: "boundaries/dependencies",
    severity: 2,
    message:
      'There is no policy allowing dependencies from elements of type "component" and captured values: family="atoms", elementName="atom-a" to file of categories "util", "internal" belonging to elements of type "helper" and captured values: family="permissions"',
  },
  {
    path: "src/components/atoms/atom-a/AtomA.js",
    line: 3,
    ruleId: "boundaries/dependencies",
    severity: 2,
    message:
      'There is no policy allowing dependencies from elements of type "component" and captured values: family="atoms", elementName="atom-a" to elements of type "module" and captured values: elementName="module-a"',
  },
  {
    path: "src/components/atoms/atom-a/AtomA.js",
    line: 4,
    ruleId: "boundaries/dependencies",
    severity: 2,
    message:
      'Dependencies to file of categories "test", "util" are not allowed in elements of type "component". Denied by policy at index 4',
  },
  {
    path: "src/helpers/data/sort.js",
    line: 1,
    ruleId: "boundaries/dependencies",
    severity: 2,
    message:
      'There is no policy allowing dependencies from file of category "util" belonging to elements of type "helper" and captured values: family="data" to file of categories "util", "internal" belonging to elements of type "helper" and captured values: family="permissions"',
  },
  {
    path: "src/helpers/permissions/roles.js",
    line: 1,
    ruleId: "boundaries/dependencies",
    severity: 2,
    message:
      'There is no policy allowing dependencies from file of categories "util", "internal" belonging to elements of type "helper" and captured values: family="permissions" to elements of type "component" and captured values: family="atoms", elementName="atom-a"',
  },
  {
    path: "src/helpers/permissions/roles.js",
    line: 2,
    ruleId: "boundaries/dependencies",
    severity: 2,
    message:
      'There is no policy allowing dependencies from file of categories "util", "internal" belonging to elements of type "helper" and captured values: family="permissions" to elements of type "module" and captured values: elementName="module-a"',
  },
];

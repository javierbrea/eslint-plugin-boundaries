import type { Example } from "./examples.types";

/**
 * The settings and the configuration example of the `boundaries/dependencies` rule page of the docs (`packages/website/docs/rules/dependencies.md`), reduced to `{ settings, rules }` as the playground edits it: its comments are kept and the keys that are identifiers are not quoted. The page sets `import/resolver` to `babel-module` so that its sources are aliases, such as `components/atoms/atom-a`, which the playground does not read, since it writes every source in full, so the setting is left out.
 */
const DEPENDENCIES_RULE_CONFIG = `{
  settings: {
    "boundaries/elements": [
      { type: "helper", pattern: "helpers/*", capture: ["family"] },
      { type: "component", pattern: "components/*/*", capture: ["family", "elementName"] },
      { type: "module", pattern: "modules/*", capture: ["elementName"] },
    ],
    "boundaries/files": [
      // any spec file is categorized as "test"
      { pattern: "**/*.spec.js", category: "test" },
      // any file under helpers/ is categorized as "util"
      { pattern: "helpers/**/*.js", category: "util" },
      // files under helpers/permissions/ are additionally categorized as "internal"
      { pattern: "helpers/permissions/**/*.js", category: "internal" },
    ],
  },
  rules: {
    "boundaries/dependencies": [2, {
      // disallow all local imports by default
      default: "disallow",
      policies: [
        {
          // from helper elements
          from: { element: { type: "helper" } },
          allow: {
            to: {
              element: { type: "helper" },
              // allow only files categorized as "util" and not "internal" (array query)
              file: { categories: { anyOf: ["util"], noneOf: ["internal"] } },
            },
            // allow only importing value, not type (TypeScript only)
            dependency: { kind: "value" },
          },
        },
        {
          // from component elements
          from: { element: { type: "component" } },
          allow: {
            to: [
              // allow importing components of the same family
              { element: { type: "component", captured: { family: "{{ from.element.captured.family }}" } } },
              // allow importing the sort.js file of any helper
              { element: { type: "helper", fileInternalPath: "sort.js" } },
            ],
          },
        },
        {
          // from components with captured family "molecules"
          from: { element: { type: "component", captured: { family: "molecules" } } },
          allow: {
            // allow importing components with captured family "atoms"
            to: { element: { type: "component", captured: { family: "atoms" } } },
          },
        },
        {
          // from modules
          from: { element: { type: "module" } },
          // allow importing helpers, components, and modules
          allow: {
            to: { element: { type: ["helper", "component", "module"] } },
          },
        },
        {
          // from any element
          from: { element: { type: "*" } },
          // disallow importing files categorized as "test" (file selector)
          disallow: {
            to: { file: { categories: "test" } },
          },
        },
      ],
    }],
  },
}
`;

/**
 * The project of the `boundaries/dependencies` rule page of the docs: the 16 files of its project structure, with the config of its settings and its configuration example, and the 14 dependencies that its Incorrect and Correct examples list, in the order of the page and grouped by the file that has them. The seven Incorrect ones are disallowed and the seven Correct ones are allowed. It exercises the captured values of an element (the family of a helper or of a component, which a policy reads and which another one compares with its importer's), the categories of a file (the files of `helpers/permissions/` are `util` and `internal` at once) and the order of the policies (the last that matches decides).
 *
 * Changed from the page: the paths start at `components/`, `helpers/` and `modules/`, without the `src/` that the structure of the page shows, because the plugin matches the patterns of the file descriptors from the root of the project, so that `helpers/**` does not match `src/helpers/data/parse.js`, and with `src/` the Correct example that imports `parse.js` from a helper would be disallowed. The sources are written in full, with their extension and their `index`, instead of the aliases of the page. Left out: the Incorrect example that imports a type, `import type { SomeParser } from 'helpers/data/parse'`, which the first policy disallows because it only allows values, since a type import is TypeScript and the files of the page are JavaScript.
 */
export const DEPENDENCIES_RULE_EXAMPLE: Example = {
  id: "dependencies-rule",
  title: "Dependencies rule",
  sketch: {
    config: DEPENDENCIES_RULE_CONFIG,
    // In the order of the tree: folders first, then files, each by name
    tree: [
      { path: "components/atoms/atom-a/AtomA.js", kind: "file" },
      { path: "components/atoms/atom-a/index.js", kind: "file" },
      { path: "components/atoms/atom-b/AtomB.js", kind: "file" },
      { path: "components/atoms/atom-b/index.js", kind: "file" },
      { path: "components/molecules/molecule-a/index.js", kind: "file" },
      { path: "components/molecules/molecule-a/MoleculeA.js", kind: "file" },
      { path: "components/molecules/molecule-b/index.js", kind: "file" },
      { path: "components/molecules/molecule-b/MoleculeB.js", kind: "file" },
      { path: "helpers/data/parse.js", kind: "file" },
      { path: "helpers/data/sort.js", kind: "file" },
      { path: "helpers/data/sort.spec.js", kind: "file" },
      { path: "helpers/permissions/roles.js", kind: "file" },
      { path: "modules/module-a/index.js", kind: "file" },
      { path: "modules/module-a/ModuleA.js", kind: "file" },
      { path: "modules/module-b/index.js", kind: "file" },
      { path: "modules/module-b/ModuleB.js", kind: "file" },
    ],
    // Grouped by file in the order of the tree, and in the order of the page inside a file
    dependencies: [
      {
        from: "components/atoms/atom-a/AtomA.js",
        target: {
          kind: "node",
          path: "components/molecules/molecule-a/index.js",
        },
        syntax: "import",
        importKind: "value",
        specifiers: [{ kind: "default", name: "MoleculeA" }],
      },
      {
        from: "components/atoms/atom-a/AtomA.js",
        target: { kind: "node", path: "helpers/permissions/roles.js" },
        syntax: "import",
        importKind: "value",
        specifiers: [{ kind: "named", name: "roleHasPermissions" }],
      },
      {
        from: "components/atoms/atom-a/AtomA.js",
        target: { kind: "node", path: "modules/module-a/index.js" },
        syntax: "import",
        importKind: "value",
        specifiers: [{ kind: "default", name: "ModuleA" }],
      },
      {
        from: "components/atoms/atom-a/AtomA.js",
        target: { kind: "node", path: "helpers/data/sort.spec.js" },
        syntax: "import",
        importKind: "value",
        specifiers: [{ kind: "named", name: "sortDescending" }],
      },
      {
        from: "components/atoms/atom-a/AtomA.js",
        target: { kind: "node", path: "components/atoms/atom-b/index.js" },
        syntax: "import",
        importKind: "value",
        specifiers: [{ kind: "default", name: "AtomB" }],
      },
      {
        from: "components/atoms/atom-a/AtomA.js",
        target: { kind: "node", path: "helpers/data/sort.js" },
        syntax: "import",
        importKind: "value",
        specifiers: [{ kind: "named", name: "someSorter" }],
      },
      {
        from: "components/molecules/molecule-a/MoleculeA.js",
        target: { kind: "node", path: "components/atoms/atom-a/index.js" },
        syntax: "import",
        importKind: "value",
        specifiers: [{ kind: "default", name: "AtomA" }],
      },
      {
        from: "helpers/data/sort.js",
        target: { kind: "node", path: "helpers/permissions/roles.js" },
        syntax: "import",
        importKind: "value",
        specifiers: [{ kind: "named", name: "roleHasPermissions" }],
      },
      {
        from: "helpers/permissions/roles.js",
        target: { kind: "node", path: "components/atoms/atom-a/index.js" },
        syntax: "import",
        importKind: "value",
        specifiers: [{ kind: "default", name: "AtomA" }],
      },
      {
        from: "helpers/permissions/roles.js",
        target: { kind: "node", path: "modules/module-a/index.js" },
        syntax: "import",
        importKind: "value",
        specifiers: [{ kind: "default", name: "ModuleA" }],
      },
      {
        from: "helpers/permissions/roles.js",
        target: { kind: "node", path: "helpers/data/parse.js" },
        syntax: "import",
        importKind: "value",
        specifiers: [{ kind: "named", name: "someParser" }],
      },
      {
        from: "modules/module-a/ModuleA.js",
        target: { kind: "node", path: "helpers/data/parse.js" },
        syntax: "import",
        importKind: "value",
        specifiers: [{ kind: "named", name: "someParser" }],
      },
      {
        from: "modules/module-a/ModuleA.js",
        target: { kind: "node", path: "components/atoms/atom-a/index.js" },
        syntax: "import",
        importKind: "value",
        specifiers: [{ kind: "default", name: "AtomA" }],
      },
      {
        from: "modules/module-a/ModuleA.js",
        target: { kind: "node", path: "modules/module-b/index.js" },
        syntax: "import",
        importKind: "value",
        specifiers: [{ kind: "default", name: "ModuleB" }],
      },
    ],
  },
};

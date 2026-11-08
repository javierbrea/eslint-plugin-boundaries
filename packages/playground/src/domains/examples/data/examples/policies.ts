import type { Example } from "./examples.types";

/**
 * The settings of the canonical demo setup and the "Complete Example" of the policies page of the docs (`packages/website/docs/policies/policies.mdx`), reduced to `{ settings, rules }` as the playground edits it: its comments are kept and the keys that are identifiers are not quoted. It adds `checkAllOrigins`, which the page does not set: without it the rule checks only the dependencies on files of the project, and the policy about `redux` would never see a dependency. The message of the last policy is a template literal of several lines on the page, which JSON5 does not have, so it is written as a string of one line.
 */
const POLICIES_CONFIG = `{
  settings: {
    "boundaries/elements": [
      { type: "helper", pattern: "helpers/*", capture: ["family"] },
      { type: "component", pattern: "components/*/*", capture: ["family", "elementName"] },
      { type: "module", pattern: "modules/*", capture: ["elementName"] },
    ],
    "boundaries/files": [
      { pattern: "**/*.spec.js", category: "test" },
      { pattern: "**/*.css", category: "style" },
    ],
  },
  rules: {
    "boundaries/dependencies": [2, {
      // Not on the page: it makes the rule check the dependencies on packages too, such as redux
      checkAllOrigins: true,
      // Disallow every dependency by default
      default: "disallow",
      policies: [
        {
          // Helpers can import other helpers
          from: { element: { type: "helper" } },
          allow: { to: { element: { type: "helper" } } },
        },
        {
          // Components can import...
          from: { element: { type: "component" } },
          allow: {
            to: [
              // ...components of the same family (templated from the importing element)...
              { element: { type: "component", captured: { family: "{{from.element.captured.family}}" } } },
              // ...and helpers of the "data" family
              { element: { type: "helper", captured: { family: "data" } } },
            ],
          },
        },
        {
          // Components of family "molecules" can import components of family "atoms"
          from: { element: { type: "component", captured: { family: "molecules" } } },
          allow: {
            to: { element: { type: "component", captured: { family: "atoms" } } },
          },
        },
        {
          // Components of family "atoms" cannot import "data" helpers
          from: { element: { type: "component", captured: { family: "atoms" } } },
          disallow: {
            to: { element: { type: "helper", captured: { family: "data" } } },
          },
          // Custom message only for this specific error
          message: "Atom components can't import data helpers",
        },
        {
          // No file may import a test file
          disallow: { to: { file: { categories: "test" } } },
          message: "Do not import test files ({{to.file.categories}}) from production code",
        },
        {
          // Modules can import any component or helper
          from: { element: { type: "module" } },
          allow: {
            to: { element: { type: ["helper", "component"] } },
          },
        },
        {
          // Modules cannot import external state libraries directly
          from: { element: { type: "module" } },
          disallow: {
            to: { module: { origin: "external", source: "redux" } },
          },
          message: "Modules must not import {{to.module.source}} directly",
        },
        {
          // Modules whose name starts with "page-" can only import layout components
          from: { element: { type: "module", captured: { elementName: "page-*" } } },
          disallow: {
            to: { element: { type: "component", captured: { family: "!layout" } } },
          },
          // Custom message only for this specific error
          message: "Modules with a name starting by 'page-' can only import layout components. You tried to import a component of family {{to.element.captured.family}} from a module named {{from.element.captured.elementName}}",
        },
      ],
    }],
  },
}
`;

/**
 * The project of the policies page of the docs: nine files of the demo project, with the config of the page and ten dependencies that its policies explain, grouped by the file that has them. Five are disallowed, each one by a different kind of policy: the default, a policy that overrides the one before it (atoms cannot import data helpers, though components can), a policy for every file that imports a test file, a policy about the origin and the source of a module (`redux`) and a policy about the captured values of a module (a name that starts with `page-`). Four of them have the custom message of their policy, which prints the file category, the module source and the captured values that its templates read. The other five are allowed.
 *
 * Changed from the page: the sources are written in full, with their extension and their `index`. The policies are the ones of the page, in its order.
 */
export const POLICIES_EXAMPLE: Example = {
  id: "policies",
  title: "Policies",
  sketch: {
    config: POLICIES_CONFIG,
    // In the order of the tree: folders first, then files, each by name
    tree: [
      { path: "src/components/atoms/atom-a/index.js", kind: "file" },
      { path: "src/components/atoms/atom-b/index.js", kind: "file" },
      { path: "src/components/layout/header/index.js", kind: "file" },
      { path: "src/components/molecules/molecule-a/index.js", kind: "file" },
      { path: "src/helpers/data/sort.js", kind: "file" },
      { path: "src/helpers/data/sort.spec.js", kind: "file" },
      { path: "src/helpers/format/index.js", kind: "file" },
      { path: "src/modules/checkout/index.js", kind: "file" },
      { path: "src/modules/page-home/index.js", kind: "file" },
    ],
    // Grouped by file in the order of the tree, and in the order of the page inside a file
    dependencies: [
      {
        from: "src/components/atoms/atom-a/index.js",
        target: { kind: "node", path: "src/components/atoms/atom-b/index.js" },
        syntax: "import",
        importKind: "value",
        specifiers: [{ kind: "default", name: "AtomB" }],
      },
      {
        from: "src/components/atoms/atom-a/index.js",
        target: { kind: "node", path: "src/helpers/data/sort.js" },
        syntax: "import",
        importKind: "value",
        specifiers: [{ kind: "named", name: "sortAscending" }],
      },
      {
        from: "src/components/atoms/atom-a/index.js",
        target: { kind: "node", path: "src/helpers/format/index.js" },
        syntax: "import",
        importKind: "value",
        specifiers: [{ kind: "named", name: "format" }],
      },
      {
        from: "src/components/molecules/molecule-a/index.js",
        target: { kind: "node", path: "src/helpers/data/sort.spec.js" },
        syntax: "import",
        importKind: "value",
        specifiers: [{ kind: "named", name: "sortCases" }],
      },
      {
        from: "src/components/molecules/molecule-a/index.js",
        target: { kind: "node", path: "src/components/atoms/atom-a/index.js" },
        syntax: "import",
        importKind: "value",
        specifiers: [{ kind: "default", name: "AtomA" }],
      },
      {
        from: "src/helpers/data/sort.js",
        target: { kind: "node", path: "src/helpers/format/index.js" },
        syntax: "import",
        importKind: "value",
        specifiers: [{ kind: "named", name: "format" }],
      },
      {
        from: "src/modules/checkout/index.js",
        target: { kind: "node", path: "src/components/atoms/atom-a/index.js" },
        syntax: "import",
        importKind: "value",
        specifiers: [{ kind: "default", name: "AtomA" }],
      },
      {
        from: "src/modules/checkout/index.js",
        target: { kind: "external", name: "redux" },
        syntax: "import",
        importKind: "value",
        specifiers: [{ kind: "named", name: "createStore" }],
      },
      {
        from: "src/modules/page-home/index.js",
        target: { kind: "node", path: "src/components/atoms/atom-a/index.js" },
        syntax: "import",
        importKind: "value",
        specifiers: [{ kind: "default", name: "AtomA" }],
      },
      {
        from: "src/modules/page-home/index.js",
        target: { kind: "node", path: "src/components/layout/header/index.js" },
        syntax: "import",
        importKind: "value",
        specifiers: [{ kind: "default", name: "Header" }],
      },
    ],
  },
};

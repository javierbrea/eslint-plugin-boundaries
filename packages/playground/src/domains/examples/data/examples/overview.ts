import type { Example } from "./examples.types";

/**
 * The descriptors and the policies of the overview page of the docs (`packages/website/docs/overview.md`), reduced to `{ settings, rules }` as the playground edits it: the descriptors go to `boundaries/elements` and `boundaries/files`, the policies go to the options of `boundaries/dependencies`, their comments are kept and the keys that are identifiers are not quoted. The page sets no `default`, so a dependency that no policy allows is disallowed, and its note on packages says to set `checkAllOrigins`, which makes the rule check the dependencies on packages such as `axios`.
 */
const OVERVIEW_CONFIG = `{
  settings: {
    "boundaries/elements": [
      { type: "controller", pattern: "controllers/*" },
      { type: "model", pattern: "models/*" },
      { type: "view", pattern: "views/*" },
      { type: "shared", pattern: "shared/*" },
    ],
    "boundaries/files": [
      { category: "test", pattern: "**/*.spec.js" },
    ],
  },
  rules: {
    "boundaries/dependencies": [2, {
      // Check the dependencies on packages too, such as axios
      checkAllOrigins: true,
      policies: [
        // Allow controllers to depend on models and views
        {
          from: { element: { type: "controller" } },
          allow: {
            to: { element: { types: { anyOf: ["model", "view"] } } },
          },
        },
        // Allow views to depend on models
        {
          from: { element: { type: "view" } },
          allow: {
            to: { element: { type: "model" } },
          },
        },
        // Disallow any element from importing a test file
        {
          disallow: {
            to: { file: { categories: "test" } },
          },
        },
        // Only controllers may use the \`axios\` package
        {
          from: { element: { type: "controller" } },
          allow: {
            to: { module: { origin: "external", source: "axios" } },
          },
        },
      ],
    }],
  },
}
`;

/**
 * The project of the overview page of the docs: a controller, a model and a view, with a test file of the model and the config of the page, and the seven dependencies that its policies explain, in the order of the files. It exercises the three facets of a dependency at once: the element of each file (a controller, a model or a view), its category (a test) and the origin of the module it imports (a file of the project, or the package `axios`, which is external). The controller importing the model, the view and `axios`, and the view importing the model, are allowed; the model importing the view, which the page shows as its feedback, the model importing `axios`, and the view importing the test file of the model are disallowed.
 *
 * Changed from the page: the sources are written in full, with their extension and their `index`, instead of the `../../views/view-a` of its feedback example.
 */
export const OVERVIEW_EXAMPLE: Example = {
  id: "overview",
  title: "Overview",
  sketch: {
    config: OVERVIEW_CONFIG,
    // In the order of the tree: folders first, then files, each by name
    tree: [
      { path: "src/controllers/controller-a/index.js", kind: "file" },
      { path: "src/models/model-a/index.js", kind: "file" },
      { path: "src/models/model-a/model-a.spec.js", kind: "file" },
      { path: "src/views/view-a/index.js", kind: "file" },
    ],
    // Grouped by file in the order of the tree, and in the order of the page inside a file
    dependencies: [
      {
        from: "src/controllers/controller-a/index.js",
        target: { kind: "node", path: "src/models/model-a/index.js" },
        syntax: "import",
        importKind: "value",
        specifiers: [{ kind: "named", name: "ModelA" }],
      },
      {
        from: "src/controllers/controller-a/index.js",
        target: { kind: "node", path: "src/views/view-a/index.js" },
        syntax: "import",
        importKind: "value",
        specifiers: [{ kind: "named", name: "ViewA" }],
      },
      {
        from: "src/controllers/controller-a/index.js",
        target: { kind: "external", name: "axios" },
        syntax: "import",
        importKind: "value",
        specifiers: [{ kind: "default", name: "axios" }],
      },
      {
        from: "src/models/model-a/index.js",
        target: { kind: "node", path: "src/views/view-a/index.js" },
        syntax: "import",
        importKind: "value",
        specifiers: [{ kind: "default", name: "View" }],
      },
      {
        from: "src/models/model-a/index.js",
        target: { kind: "external", name: "axios" },
        syntax: "import",
        importKind: "value",
        specifiers: [{ kind: "default", name: "axios" }],
      },
      {
        from: "src/views/view-a/index.js",
        target: { kind: "node", path: "src/models/model-a/index.js" },
        syntax: "import",
        importKind: "value",
        specifiers: [{ kind: "named", name: "ModelA" }],
      },
      {
        from: "src/views/view-a/index.js",
        target: { kind: "node", path: "src/models/model-a/model-a.spec.js" },
        syntax: "import",
        importKind: "value",
        specifiers: [{ kind: "named", name: "createModel" }],
      },
    ],
  },
};

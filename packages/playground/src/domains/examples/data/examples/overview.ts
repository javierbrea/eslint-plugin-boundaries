import type { Example } from "./examples.types";

/**
 * The descriptors and the policies of the overview page of the docs (`packages/website/docs/overview.md`), reduced to `{ settings, rules }` as the playground edits it: the descriptors go to `boundaries/elements` and `boundaries/files`, the policies go to the options of `boundaries/dependencies`, their comments are kept and the keys that are identifiers are not quoted. The page sets no `default`, so a dependency that no policy matches is disallowed. It adds `checkAllOrigins`, which the page does not set: without it the rule checks only the dependencies on files of the project, and no policy would ever see the one on `axios`.
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
      // Not on the page: it makes the rule check the dependencies on packages too, such as axios
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
          from: { element: { type: "!controller" } },
          disallow: {
            to: { module: { origin: "external", source: "axios" } },
          },
        },
      ],
    }],
  },
}
`;

/**
 * The project of the overview page of the docs: a controller, a model and a view, with a test file of the model and the config of the page, and the six dependencies that its policies explain, in the order of the files. It exercises the three facets of a dependency at once: the element of each file (a controller, a model or a view), its category (a test) and the origin of the module it imports (a file of the project, or the package `axios`, which is external). The controller importing the model and the view, and the view importing the model, are allowed; the model importing the view, which the page shows as its feedback, the model importing `axios`, and the view importing the test file of the model are disallowed.
 *
 * Left out of the page: a controller that imports `axios`. The page says that only controllers may use that package, but its policies do not allow it, so it is disallowed too, as any dependency that no policy matches is, and the sketch has none. The message that the page shows for the model importing the view, `Dependencies to elements of type "view" are not allowed in elements of type "model". Denied by policy at index 2`, is not the one ESLint reports, which says that there is no policy allowing it. The sources are written in full, with their extension and their `index`, instead of the alias `@views/view-a` of the page.
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

import type { Example } from "./examples.types";

/**
 * The config of the last step of the quick-start guide of the docs (`packages/website/docs/quick-start.mdx`), reduced to `{ settings, rules }` as the playground edits it: its comments are kept and the keys that are identifiers are not quoted. The guide spreads the predefined rules of the plugin first, and a config in the browser cannot, so they are left out.
 */
const QUICK_START_CONFIG = `{
  settings: {
    "boundaries/elements": [
      { type: "helper", pattern: "helpers/*" },
      { type: "component", pattern: "components/*/*" },
      { type: "module", pattern: "modules/*" },
    ],
    "boundaries/files": [
      { pattern: "**/*.spec.js", category: "test" },
      { pattern: "**/*.css", category: "style" },
    ],
  },
  rules: {
    "boundaries/dependencies": [2, {
      default: "disallow",
      policies: [
        {
          from: { element: { type: "component" } },
          allow: { to: { element: { type: "helper" } } },
        },
        {
          from: { element: { type: "module" } },
          allow: { to: { element: { types: ["component", "helper"] } } },
        },
        {
          // No element may import a test file, whatever element it belongs to
          disallow: { to: { file: { categories: "test" } } },
        },
      ],
    }],
  },
}
`;

/**
 * The project of the quick-start guide of the docs: one file of each element type, a test, a style and a file outside every element, with the config of the guide and nine dependencies between them, which fail the guide's step 3: a helper that imports a component, and a module that imports a test file.
 */
export const QUICK_START_EXAMPLE: Example = {
  id: "quick-start",
  title: "Quick start",
  sketch: {
    config: QUICK_START_CONFIG,
    // In the order of the tree: folders first, then files, each by name
    tree: [
      { path: "src/components/atoms/Button/Button.css", kind: "file" },
      { path: "src/components/atoms/Button/Button.spec.js", kind: "file" },
      { path: "src/components/atoms/Button/index.js", kind: "file" },
      { path: "src/helpers/format/index.js", kind: "file" },
      { path: "src/modules/checkout/index.js", kind: "file" },
      { path: "src/index.js", kind: "file" },
    ],
    // Grouped by file in the order of the tree, and in the order the text mode lists them
    dependencies: [
      {
        from: "src/components/atoms/Button/Button.spec.js",
        target: { kind: "node", path: "src/components/atoms/Button/index.js" },
        syntax: "import",
        importKind: "value",
        specifiers: [{ kind: "named", name: "Button" }],
      },
      {
        from: "src/components/atoms/Button/index.js",
        target: { kind: "node", path: "src/helpers/format/index.js" },
        syntax: "import",
        importKind: "value",
        specifiers: [{ kind: "named", name: "format" }],
      },
      {
        from: "src/components/atoms/Button/index.js",
        target: {
          kind: "node",
          path: "src/components/atoms/Button/Button.css",
        },
        syntax: "import",
        importKind: "value",
        specifiers: [],
      },
      {
        from: "src/helpers/format/index.js",
        target: { kind: "node", path: "src/components/atoms/Button/index.js" },
        syntax: "import",
        importKind: "value",
        specifiers: [{ kind: "named", name: "Button" }],
      },
      {
        from: "src/modules/checkout/index.js",
        target: { kind: "node", path: "src/components/atoms/Button/index.js" },
        syntax: "import",
        importKind: "value",
        specifiers: [{ kind: "named", name: "Button" }],
      },
      {
        from: "src/modules/checkout/index.js",
        target: { kind: "node", path: "src/helpers/format/index.js" },
        syntax: "import",
        importKind: "value",
        specifiers: [{ kind: "named", name: "format" }],
      },
      {
        from: "src/modules/checkout/index.js",
        target: {
          kind: "node",
          path: "src/components/atoms/Button/Button.spec.js",
        },
        syntax: "import",
        importKind: "value",
        specifiers: [{ kind: "named", name: "renderButton" }],
      },
      {
        from: "src/modules/checkout/index.js",
        target: { kind: "external", name: "react" },
        syntax: "import",
        importKind: "value",
        specifiers: [{ kind: "default", name: "React" }],
      },
      {
        from: "src/index.js",
        target: { kind: "node", path: "src/modules/checkout/index.js" },
        syntax: "import",
        importKind: "value",
        specifiers: [],
      },
    ],
  },
};

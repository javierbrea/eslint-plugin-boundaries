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
 * The project of the quick-start guide of the docs: one file of each element type, a test, a style and a file outside every element, with the config of the guide. It has no dependencies yet.
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
    dependencies: [],
  },
};
